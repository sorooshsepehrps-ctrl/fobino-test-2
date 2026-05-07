
const cron = require('node-cron');
const logger = require('../utils/logger');
const subscriptionService = require('../services/subscriptionService');
const Deal = require('../models/Deal');
const Post = require('../models/Post');
const ExchangeRate = require('../models/ExchangeRate');
const notificationService = require('../services/notificationService');
const dropshippingLateService = require('../services/dropshippingLateService');

const initializeJobs = () => {
  logger.info('Initializing scheduled jobs...');

  // 1. Subscription Management Jobs
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running subscription expiry check...');
    try {
      await subscriptionService.checkExpiringSubscriptions();
      logger.info('Subscription expiry check completed');
    } catch (error) {
      logger.error('Subscription expiry check failed:', error);
    }
  });

  cron.schedule('1 0 1 * *', async () => {
    logger.info('Running monthly subscription usage reset...');
    try {
      await resetMonthlyUsage();
      logger.info('Monthly subscription usage reset completed');
    } catch (error) {
      logger.error('Monthly subscription usage reset failed:', error);
    }
  });

  cron.schedule('0 8 * * *', async () => {
    logger.info('Running subscription auto-renewal check...');
    try {
      await checkAutoRenewals();
      logger.info('Subscription auto-renewal check completed');
    } catch (error) {
      logger.error('Subscription auto-renewal check failed:', error);
    }
  });

  // 2. Deal Management Jobs
  cron.schedule('0 * * * *', async () => {
    logger.info('Running deal deadline check...');
    try {
      await checkDealDeadlines();
      logger.info('Deal deadline check completed');
    } catch (error) {
      logger.error('Deal deadline check failed:', error);
    }
  });

  cron.schedule('0 */4 * * *', async () => {
    logger.info('Running auto-confirm check...');
    try {
      await autoConfirmDeliveredDeals();
      logger.info('Auto-confirm check completed');
    } catch (error) {
      logger.error('Auto-confirm check failed:', error);
    }
  });

  // 3. Dropshipping automation jobs
  // Check overdue shipment deadlines - every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running dropshipping shipment deadline check...');
    try {
      const result = await dropshippingLateService.processShipmentDeadlineOverdues();
      logger.info('Dropshipping shipment deadline check completed', result);
    } catch (error) {
      logger.error('Dropshipping shipment deadline check failed:', error);
    }
  });

  // Escalate overdue tickets - every hour
  cron.schedule('15 * * * *', async () => {
    logger.info('Running dropshipping late ticket escalation check...');
    try {
      const result = await dropshippingLateService.processLateTicketEscalations();
      logger.info('Dropshipping late ticket escalation completed', result);
    } catch (error) {
      logger.error('Dropshipping late ticket escalation failed:', error);
    }
  });

  // 4. Platform Maintenance Jobs
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Updating exchange rates...');
    try {
      await ExchangeRate.updateFromAPI();
      logger.info('Exchange rates updated');
    } catch (error) {
      logger.error('Exchange rate update failed:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    logger.info('Running post expiry check...');
    try {
      await expireOldPosts();
      logger.info('Post expiry check completed');
    } catch (error) {
      logger.error('Post expiry check failed:', error);
    }
  });

  cron.schedule('0 3 * * *', async () => {
    logger.info('Running cleanup job...');
    try {
      await cleanupExpiredData();
      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  });

  cron.schedule('0 */2 * * *', async () => {
    logger.info('Running free subscription check...');
    try {
      await ensureFreeSubscriptions();
      logger.info('Free subscription check completed');
    } catch (error) {
      logger.error('Free subscription check failed:', error);
    }
  });

  logger.info('All scheduled jobs initialized');
};

// ========== SUBSCRIPTION MANAGEMENT FUNCTIONS ==========

const resetMonthlyUsage = async () => {
  const Subscription = require('../models/Subscription');
  const now = new Date();

  const result = await Subscription.updateMany(
    {
      status: 'active',
      $or: [{ plan: 'vip' }, { plan: 'producer' }, { plan: 'free' }]
    },
    {
      $set: {
        'usage.accessToBuyPostsUsed': 0,
        'usage.lastResetDate': now
      }
    }
  );

  logger.info(`Monthly usage reset for ${result.modifiedCount} subscriptions`);

  const subscriptions = await Subscription.find({
    status: 'active',
    plan: { $in: ['vip', 'producer'] }
  }).populate('user');

  for (const sub of subscriptions) {
    await notificationService.create(
      sub.user,
      'subscription_reset',
      'بازنشانی سهمیه ماهانه',
      'سهمیه دسترسی شما برای ماه جدید بازنشانی شد. شما ۸۵ بار دسترسی دارید.',
      { subscriptionId: sub._id },
      '/dashboard/subscription'
    );
  }
};

const checkAutoRenewals = async () => {
  const Subscription = require('../models/Subscription');
  const Wallet = require('../models/Wallet');
  const Transaction = require('../models/Transaction');

  const now = new Date();
  const renewThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const subscriptions = await Subscription.find({
    status: 'active',
    plan: { $in: ['vip', 'producer'] },
    endDate: { $lte: renewThreshold, $gt: now },
    autoRenew: true
  }).populate('user');

  for (const sub of subscriptions) {
    try {
      const user = sub.user;

      if (user.level < 2) {
        logger.warn(`User ${user._id} doesn't have level 2 verification for auto-renewal`);
        continue;
      }

      const plan = subscriptionService.getPlan(sub.plan);
      if (!plan) continue;

      const wallet = await Wallet.getOrCreateWallet(user._id);
      if (!wallet.hasSufficientBalance(plan.price, 'IRR')) {
        await notificationService.create(
          user,
          'auto_renew_failed',
          'اتوماتیک تمدید نشد',
          'اشتراک شما به دلیل عدم موجودی کافی در کیف پول به صورت خودکار تمدید نشد. لطفا کیف پول خود را شارژ کنید.',
          { subscriptionId: sub._id },
          '/dashboard/wallet'
        );
        continue;
      }

      await wallet.withdraw(plan.price, 'IRR');

      const newEndDate = new Date(sub.endDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
      sub.endDate = newEndDate;
      sub.previousPlans.push({
        plan: sub.plan,
        startDate: sub.startDate,
        endDate: now,
        renewedAt: now
      });
      sub.startDate = now;
      sub.usage = {
        sellPostsUsed: 0,
        buyPostsUsed: 0,
        accessToBuyPostsUsed: 0,
        lastResetDate: now
      };
      await sub.save();

      await Transaction.create({
        user: user._id,
        wallet: wallet._id,
        type: 'subscription',
        amount: -plan.price,
        currency: 'IRR',
        description: `تمدید خودکار اشتراک ${plan.nameFa}`,
        status: 'completed',
        relatedSubscription: sub._id,
        completedAt: now
      });

      await notificationService.create(
        user,
        'auto_renew_success',
        'اشتراک تمدید شد',
        `اشتراک ${plan.nameFa} شما با موفقیت تمدید شد. اعتبار تا ${newEndDate.toLocaleDateString('fa-IR')}`,
        { subscriptionId: sub._id },
        '/dashboard/subscription'
      );

      logger.info(`Auto-renewed subscription ${sub._id} for user ${user._id}`);
    } catch (error) {
      logger.error(`Failed to auto-renew subscription ${sub._id}:`, error);
    }
  }
};

const ensureFreeSubscriptions = async () => {
  const Subscription = require('../models/Subscription');
  const User = require('../models/User');

  const users = await User.find({});
  for (const user of users) {
    const existing = await Subscription.findOne({ user: user._id, status: 'active' });
    if (existing) continue;

    await Subscription.create({
      user: user._id,
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  }
};

const checkDealDeadlines = async () => {
  const now = new Date();
  const overdueDeals = await Deal.find({
    status: { $in: ['pending', 'in_progress'] },
    deadline: { $lt: now }
  });

  for (const deal of overdueDeals) {
    deal.status = 'expired';
    await deal.save();
  }
};

const autoConfirmDeliveredDeals = async () => {
  const now = new Date();
  const threshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const deals = await Deal.find({
    status: 'delivered',
    deliveredAt: { $lte: threshold }
  });

  for (const deal of deals) {
    deal.status = 'completed';
    await deal.save();
  }
};

const expireOldPosts = async () => {
  const now = new Date();
  await Post.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

const cleanupExpiredData = async () => {
  return true;
};

module.exports = {
  initializeJobs
};
