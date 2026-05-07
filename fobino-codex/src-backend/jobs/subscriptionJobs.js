const cron = require('node-cron');
const subscriptionService = require('../services/subscriptionService');
const logger = require('../utils/logger');

// Run daily at midnight
const subscriptionCron = cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Starting subscription expiration check...');
    await subscriptionService.checkExpiringSubscriptions();
    logger.info('Subscription expiration check completed');
  } catch (error) {
    logger.error('Error in subscription cron job:', error);
  }
});

// Run monthly on 1st at 00:01 for usage reset
const usageResetCron = cron.schedule('1 0 1 * *', async () => {
  try {
    logger.info('Starting monthly usage reset...');
    
    // Get all active subscriptions
    const Subscription = require('../models/Subscription');
    const activeSubs = await Subscription.find({
      status: 'active',
      plan: { $in: ['vip', 'producer'] }
    });

    for (const sub of activeSubs) {
      sub.usage.accessToBuyPostsUsed = 0;
      sub.usage.lastResetDate = new Date();
      await sub.save();
    }

    logger.info(`Monthly usage reset completed for ${activeSubs.length} subscriptions`);
  } catch (error) {
    logger.error('Error in usage reset cron job:', error);
  }
});

const startSubscriptionJobs = () => {
  subscriptionCron.start();
  usageResetCron.start();
  logger.info('Subscription cron jobs started');
};

const stopSubscriptionJobs = () => {
  subscriptionCron.stop();
  usageResetCron.stop();
  logger.info('Subscription cron jobs stopped');
};

module.exports = {
  startSubscriptionJobs,
  stopSubscriptionJobs
};


// const startSubscriptionJob = ()=>{
//   subscriptionCron.stop(),
//   usage.ResetCron.start(),
//  logger.info ('subscription is founded on your baed name ')
// }


// const endSubscription= ()=>{
// subscriptionCron.stop(),
// logger.info('your subscription time limit is ended')
// }