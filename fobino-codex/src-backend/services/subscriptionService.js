// const Subscription = require('../models/Subscription');
// const Transaction = require('../models/Transaction');
// const Wallet = require('../models/Wallet');
// const { SUBSCRIPTION_PLANS } = require('../config/constants');
// const { zarinpal } = require('../config/payment');
// const notificationService = require('./notificationService');
// const logger = require('../utils/logger');

// class SubscriptionService {
//   // Get all plans
//   getPlans() {
//     return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
//       name: plan.name,
//       nameFa: plan.nameFa,
//       duration: plan.duration,
//       price: plan.price,
//       sellPosts: plan.sellPosts,
//       buyPosts: plan.buyPosts,
//       accessToBuyPosts: plan.accessToBuyPosts,
//       maxOffersVisible: plan.maxOffersVisible,
//       maxChatsPerPost: plan.maxChatsPerPost,
//       features: plan.features
//     }));
//   }

//   // Get plan by name
//   getPlan(planName) {
//     const planKey = Object.keys(SUBSCRIPTION_PLANS).find(
//       key => SUBSCRIPTION_PLANS[key].name === planName
//     );
//     return planKey ? SUBSCRIPTION_PLANS[planKey] : null;
//   }

//   // Get user's active subscription
//   async getUserSubscription(userId) {
//     const subscription = await Subscription.findOne({
//       user: userId,
//       status: 'active',
//       endDate: { $gt: new Date() }
//     });

//     if (!subscription) {
//       // Check for any subscription
//       const anySubscription = await Subscription.findOne({ user: userId })
//         .sort({ createdAt: -1 });
//       return anySubscription;
//     }

//     return subscription;
//   }

//   // Purchase subscription
//   async purchase(userId, planName, paymentMethod = 'wallet') {
//     const plan = this.getPlan(planName);
//     if (!plan) {
//       throw new Error('پلن انتخابی نامعتبر است');
//     }

//     // Check if user has active subscription
//     const currentSub = await this.getUserSubscription(userId);
//     if (currentSub && currentSub.status === 'active') {
//       // If current plan is free, allow direct purchase (upgrade)
//       if (currentSub.plan === 'free') {
//         // Cancel free plan and proceed with purchase
//         currentSub.status = 'cancelled';
//         currentSub.previousPlans = currentSub.previousPlans || [];
//         currentSub.previousPlans.push({
//           plan: currentSub.plan,
//           startDate: currentSub.startDate,
//           endDate: new Date(),
//           cancelledAt: new Date()
//         });
//         await currentSub.save();
//       } else {
//         // For paid plans, use upgrade method instead
//         return this.upgrade(userId, planName);
//       }
//     }

//     // Free plan - no payment needed
//     if (plan.price === 0) {
//       return this.createSubscription(userId, plan, 'free');
//     }

//     // Process payment based on method
//     if (paymentMethod === 'wallet') {
//       const wallet = await Wallet.getOrCreateWallet(userId);
//       if (!wallet.hasSufficientBalance(plan.price, 'IRR')) {
//         throw new Error('موجودی کیف پول کافی نیست');
//       }
//       await wallet.withdraw(plan.price, 'IRR');
//       return this.createSubscription(userId, plan, 'wallet');
//     }

//     // Zarinpal payment
//     if (paymentMethod === 'zarinpal') {
//       const callbackUrl = `${process.env.BASE_URL}/api/subscriptions/verify`;
//       const description = `خرید اشتراک ${plan.nameFa}`;
      
//       try {
//         const result = await zarinpal.request(plan.price, description, callbackUrl);
        
//         if (result.success) {
//           // Create pending subscription
//           const subscription = new Subscription({
//             user: userId,
//             plan: plan.name,
//             planDetails: {
//               duration: plan.duration,
//               sellPosts: plan.sellPosts,
//               buyPosts: plan.buyPosts,
//               accessToBuyPosts: plan.accessToBuyPosts,
//               maxOffersVisible: plan.maxOffersVisible,
//               maxChatsPerPost: plan.maxChatsPerPost,
//               features: plan.features
//             },
//             status: 'pending',
//             payment: {
//               amount: plan.price,
//               currency: 'IRR',
//               paymentMethod: 'zarinpal',
//               authority: result.authority
//             }
//           });
//           await subscription.save();

//           return {
//             subscription,
//             paymentUrl: result.url,
//             authority: result.authority
//           };
//         } else {
//           throw new Error('خطا در اتصال به درگاه پرداخت');
//         }
//       } catch (error) {
//         logger.error('Zarinpal payment error:', error);
//         throw new Error('خطا در اتصال به درگاه پرداخت');
//       }
//     }

//     throw new Error('روش پرداخت نامعتبر است');
//   }

//   // Create subscription helper
//   async createSubscription(userId, plan, paymentMethod) {
//     const subscription = new Subscription({
//       user: userId,
//       plan: plan.name,
//       planDetails: {
//         duration: plan.duration,
//         sellPosts: plan.sellPosts,
//         buyPosts: plan.buyPosts,
//         accessToBuyPosts: plan.accessToBuyPosts,
//         maxOffersVisible: plan.maxOffersVisible,
//         maxChatsPerPost: plan.maxChatsPerPost,
//         features: plan.features
//       },
//       status: 'active',
//       startDate: new Date(),
//       endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
//       payment: {
//         amount: plan.price,
//         currency: 'IRR',
//         paidAt: new Date(),
//         paymentMethod
//       },
//       usage: {
//         lastResetDate: new Date()
//       }
//     });

//     await subscription.save();

//     // Create transaction record
//     if (plan.price > 0) {
//       const wallet = await Wallet.getOrCreateWallet(userId);
//       await Transaction.create({
//         user: userId,
//         wallet: wallet._id,
//         type: 'subscription',
//         amount: -plan.price,
//         currency: 'IRR',
//         description: `خرید اشتراک ${plan.nameFa}`,
//         status: 'completed',
//         relatedSubscription: subscription._id,
//         completedAt: new Date()
//       });
//     }

//     return subscription;
//   }

//   // Verify Zarinpal payment callback
//   async verifyPayment(authority) {
//     const subscription = await Subscription.findOne({
//       'payment.authority': authority,
//       status: 'pending'
//     });

//     if (!subscription) {
//       throw new Error('تراکنش یافت نشد');
//     }

//     try {
//       const result = await zarinpal.verify(authority, subscription.payment.amount);
      
//       if (result.success) {
//         subscription.status = 'active';
//         subscription.startDate = new Date();
//         subscription.endDate = new Date(Date.now() + subscription.planDetails.duration * 24 * 60 * 60 * 1000);
//         subscription.payment.paidAt = new Date();
//         subscription.payment.refId = result.refId;
//         subscription.usage = { lastResetDate: new Date() };
//         await subscription.save();

//         // Create transaction record
//         const wallet = await Wallet.getOrCreateWallet(subscription.user);
//         await Transaction.create({
//           user: subscription.user,
//           wallet: wallet._id,
//           type: 'subscription',
//           amount: -subscription.payment.amount,
//           currency: 'IRR',
//           description: `خرید اشتراک از درگاه پرداخت`,
//           status: 'completed',
//           relatedSubscription: subscription._id,
//           completedAt: new Date()
//         });

//         return { success: true, subscription };
//       } else {
//         subscription.status = 'failed';
//         await subscription.save();
//         return { success: false };
//       }
//     } catch (error) {
//       logger.error('Payment verification error:', error);
//       subscription.status = 'failed';
//       await subscription.save();
//       throw new Error('خطا در تأیید پرداخت');
//     }
//   }

//   // Upgrade subscription
//   async upgrade(userId, newPlanName) {
//     const newPlan = this.getPlan(newPlanName);
//     if (!newPlan) {
//       throw new Error('پلن انتخابی نامعتبر است');
//     }

//     const currentSub = await this.getUserSubscription(userId);
//     if (!currentSub || currentSub.status !== 'active') {
//       // No active subscription, just purchase
//       return this.purchase(userId, newPlanName);
//     }

//     const currentPlan = this.getPlan(currentSub.plan);
    
//     // Calculate prorated amount
//     const remainingDays = currentSub.remainingDays;
//     const dailyRateCurrent = currentPlan.price / currentPlan.duration;
//     const creditAmount = Math.floor(dailyRateCurrent * remainingDays);
//     const upgradeCost = Math.max(0, newPlan.price - creditAmount);

//     // Process payment for difference
//     if (upgradeCost > 0) {
//       const wallet = await Wallet.getOrCreateWallet(userId);
//       if (!wallet.hasSufficientBalance(upgradeCost, 'IRR')) {
//         throw new Error('موجودی کیف پول کافی نیست');
//       }
//       await wallet.withdraw(upgradeCost, 'IRR');
//     }

//     // Archive current subscription
//     currentSub.previousPlans.push({
//       plan: currentSub.plan,
//       startDate: currentSub.startDate,
//       endDate: new Date(),
//       cancelledAt: new Date()
//     });

//     // Update to new plan
//     currentSub.plan = newPlan.name;
//     currentSub.planDetails = {
//       duration: newPlan.duration,
//       sellPosts: newPlan.sellPosts,
//       buyPosts: newPlan.buyPosts,
//       accessToBuyPosts: newPlan.accessToBuyPosts,
//       maxOffersVisible: newPlan.maxOffersVisible,
//       maxChatsPerPost: newPlan.maxChatsPerPost,
//       features: newPlan.features
//     };
//     currentSub.startDate = new Date();
//     currentSub.endDate = new Date(Date.now() + newPlan.duration * 24 * 60 * 60 * 1000);
//     currentSub.usage = {
//       sellPostsUsed: 0,
//       buyPostsUsed: 0,
//       accessToBuyPostsUsed: 0,
//       lastResetDate: new Date()
//     };

//     await currentSub.save();

//     // Create transaction
//     if (upgradeCost > 0) {
//       const wallet = await Wallet.getOrCreateWallet(userId);
//       await Transaction.create({
//         user: userId,
//         wallet: wallet._id,
//         type: 'subscription',
//         amount: -upgradeCost,
//         currency: 'IRR',
//         description: `ارتقای اشتراک به ${newPlan.nameFa}`,
//         status: 'completed',
//         relatedSubscription: currentSub._id,
//         completedAt: new Date()
//       });
//     }

//     return currentSub;
//   }

//   // Cancel subscription
//   async cancel(userId) {
//     const subscription = await this.getUserSubscription(userId);
    
//     if (!subscription || subscription.status !== 'active') {
//       throw new Error('اشتراک فعالی یافت نشد');
//     }

//     subscription.status = 'cancelled';
//     subscription.autoRenew = false;
//     await subscription.save();

//     return { message: 'اشتراک شما لغو شد' };
//   }

//   // Check limits
//   async checkLimits(userId) {
//     const subscription = await this.getUserSubscription(userId);
    
//     if (!subscription || subscription.status !== 'active') {
//       return {
//         hasActiveSubscription: false,
//         plan: null,
//         limits: null
//       };
//     }

//     return {
//       hasActiveSubscription: true,
//       plan: subscription.plan,
//       remainingDays: subscription.remainingDays,
//       limits: {
//         sellPosts: {
//           total: subscription.planDetails.sellPosts,
//           used: subscription.usage.sellPostsUsed,
//           remaining: subscription.remainingSellPosts
//         },
//         accessToBuyPosts: {
//           total: subscription.planDetails.accessToBuyPosts,
//           used: subscription.usage.accessToBuyPostsUsed,
//           remaining: subscription.remainingAccessToBuyPosts
//         },
//         maxOffersVisible: subscription.planDetails.maxOffersVisible,
//         maxChatsPerPost: subscription.planDetails.maxChatsPerPost
//       }
//     };
//   }

//   // Use sell post quota
//   async useSellPostQuota(userId) {
//     const subscription = await this.getUserSubscription(userId);
    
//     if (!subscription || subscription.status !== 'active') {
//       throw new Error('اشتراک فعالی یافت نشد');
//     }

//     await subscription.useSellPostQuota();
//     return subscription;
//   }

//   // Use access to buy posts quota
//   async useAccessQuota(userId) {
//     const subscription = await this.getUserSubscription(userId);
    
//     if (!subscription || subscription.status !== 'active') {
//       throw new Error('اشتراک فعالی یافت نشد');
//     }

//     await subscription.useAccessToBuyPostsQuota();
//     return subscription;
//   }

//   // Purchase extra quota
//   async purchaseExtraQuota(userId, type, amount) {
//     const subscription = await this.getUserSubscription(userId);
    
//     if (!subscription || subscription.status !== 'active') {
//       throw new Error('اشتراک فعالی یافت نشد');
//     }

//     const prices = {
//       sell_posts: 50000,    // per post
//       access_posts: 100000  // per access
//     };

//     const price = prices[type] * amount;
    
//     const wallet = await Wallet.getOrCreateWallet(userId);
//     if (!wallet.hasSufficientBalance(price, 'IRR')) {
//       throw new Error('موجودی کیف پول کافی نیست');
//     }

//     await wallet.withdraw(price, 'IRR');

//     subscription.extras.push({
//       type,
//       amount,
//       purchasedAt: new Date()
//     });

//     await subscription.save();

//     // Create transaction
//     await Transaction.create({
//       user: userId,
//       wallet: wallet._id,
//       type: 'subscription',
//       amount: -price,
//       currency: 'IRR',
//       description: `خرید سهمیه اضافی ${type}`,
//       status: 'completed',
//       completedAt: new Date()
//     });

//     return subscription;
//   }

//   // Check expiring subscriptions (for cron job)
//   async checkExpiringSubscriptions() {
//     const now = new Date();
//     const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
//     const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
//     const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

//     // 7 days warning
//     const expiring7Days = await Subscription.find({
//       status: 'active',
//       endDate: { $lte: in7Days, $gt: in3Days },
//       'notificationsSent.expiryWarning7Days': false
//     });

//     for (const sub of expiring7Days) {
//       await notificationService.notifySubscriptionExpiring(sub.user, 7);
//       sub.notificationsSent.expiryWarning7Days = true;
//       await sub.save();
//     }

//     // 3 days warning
//     const expiring3Days = await Subscription.find({
//       status: 'active',
//       endDate: { $lte: in3Days, $gt: in1Day },
//       'notificationsSent.expiryWarning3Days': false
//     });

//     for (const sub of expiring3Days) {
//       await notificationService.notifySubscriptionExpiring(sub.user, 3);
//       sub.notificationsSent.expiryWarning3Days = true;
//       await sub.save();
//     }

//     // 1 day warning
//     const expiring1Day = await Subscription.find({
//       status: 'active',
//       endDate: { $lte: in1Day, $gt: now },
//       'notificationsSent.expiryWarning1Day': false
//     });

//     for (const sub of expiring1Day) {
//       await notificationService.notifySubscriptionExpiring(sub.user, 1);
//       sub.notificationsSent.expiryWarning1Day = true;
//       await sub.save();
//     }

//     // Expired
//     const expired = await Subscription.find({
//       status: 'active',
//       endDate: { $lte: now }
//     });

//     for (const sub of expired) {
//       sub.status = 'expired';
//       sub.notificationsSent.expired = true;
//       await sub.save();
      
//       // Create free subscription
//       await Subscription.createFreeSubscription(sub.user);
//     }

//     logger.info(`Subscription check completed: ${expiring7Days.length} 7-day, ${expiring3Days.length} 3-day, ${expiring1Day.length} 1-day, ${expired.length} expired`);
//   }
// }

// module.exports = new SubscriptionService();
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { SUBSCRIPTION_PLANS, QUOTA_PRICES } = require('../config/constants');
const { zarinpal } = require('../config/payment');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const ledgerService = require('./transactionLedgerService');




function buildSubscriptionDescription(planName, paymentMethod, mode = 'purchase') {
  if (mode === 'upgrade') {
    return `ارتقای اشتراک به ${planName}`;
  }

  if (mode === 'extra_quota') {
    return planName;
  }

  if (paymentMethod === 'wallet') {
    return `خرید اشتراک ${planName} با کیف پول`;
  }

  if (paymentMethod === 'gateway') {
    return `خرید اشتراک ${planName} از طریق درگاه`;
  }

  return `خرید اشتراک ${planName}`;
}

async function markSubscriptionGatewayTransactionFailed(transaction, reason) {
  transaction.status = 'failed';
  transaction.settlementStatus = 'failed';
  transaction.failedAt = new Date();
  transaction.timeline = transaction.timeline || {};
  transaction.timeline.failedAt = new Date();
  transaction.metadata = transaction.metadata || {};
  transaction.metadata.notes = reason;

  transaction.display = {
    title: 'خرید اشتراک',
    subtitle: 'ناموفق',
    explainer: reason,
    badge: 'danger',
    previewNetAmount: Math.abs(transaction.grossAmount || transaction.amount || 0),
  };

  await transaction.save();
}



class SubscriptionService {
  // Get all plans
  getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      name: plan.name,
      nameFa: plan.nameFa,
      duration: plan.duration,
      price: plan.price,
      sellPosts: plan.sellPosts,
      buyPosts: plan.buyPosts,
      accessToBuyPosts: plan.accessToBuyPosts,
      maxOffersVisible: plan.maxOffersVisible,
      maxChatsPerPost: plan.maxChatsPerPost,
      features: plan.features
    }));
  }

  // Get plan by name
  getPlan(planName) {
    const planKey = Object.keys(SUBSCRIPTION_PLANS).find(
      key => SUBSCRIPTION_PLANS[key].name === planName
    );
    return planKey ? SUBSCRIPTION_PLANS[planKey] : null;
  }

  // Get user's active subscription with monthly reset tracking
  async getUserSubscription(userId) {
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      // Check for any subscription
      const anySubscription = await Subscription.findOne({ user: userId })
        .sort({ createdAt: -1 });
      return anySubscription;
    }

    // Reset monthly usage if needed
    const now = new Date();
    const lastReset = subscription.usage.lastResetDate || subscription.startDate;
    const resetDate = new Date(lastReset);
    resetDate.setMonth(resetDate.getMonth() + 1);

    if (now > resetDate) {
      subscription.usage.accessToBuyPostsUsed = 0;
      subscription.usage.lastResetDate = now;
      await subscription.save();
    }

    return subscription;
  }

  // Create or get free subscription for user
  async getOrCreateFreeSubscription(userId) {
    let subscription = await Subscription.findOne({
      user: userId,
      plan: 'free',
      status: 'active'
    });

    if (!subscription) {
      const freePlan = this.getPlan('free');
      subscription = new Subscription({
        user: userId,
        plan: 'free',
        planDetails: {
          duration: freePlan.duration,
          sellPosts: freePlan.sellPosts,
          buyPosts: freePlan.buyPosts,
          accessToBuyPosts: freePlan.accessToBuyPosts,
          maxOffersVisible: freePlan.maxOffersVisible,
          maxChatsPerPost: freePlan.maxChatsPerPost,
          features: freePlan.features
        },
        status: 'active',
        startDate: new Date(),
        endDate: null, // Free plan never expires
        payment: {
          amount: 0,
          currency: 'IRR',
          paidAt: new Date(),
          paymentMethod: 'free'
        },
        usage: {
          lastResetDate: new Date()
        }
      });
      await subscription.save();
    }

    return subscription;
  }

  // Purchase subscription
    // Purchase subscription
  async purchase(userId, planName, paymentMethod = 'wallet') {
    const plan = this.getPlan(planName);
    if (!plan) {
      throw new Error('پلن انتخابی نامعتبر است');
    }

    // Check if user has active subscription
    const currentSub = await this.getUserSubscription(userId);
    
    // For free plan, just create it
    if (planName === 'free') {
      return this.getOrCreateFreeSubscription(userId);
    }

    // Check user verification (level 2 for bank/Shaba)
    const user = await User.findById(userId);
    console.log('User level check:', {
      userId,
      level: user.level,
      levelVerifications: user.levelVerifications
    });
    
    if (user.level < 2) {
      // Also check if level2 is approved in levelVerifications
      if (!user.levelVerifications?.level2 || user.levelVerifications.level2.status !== 'approved') {
        throw new Error('برای خرید اشتراک باید احراز هویت سطح 2 (شماره شبا) را تکمیل کنید');
      }
    }

    // Cancel current subscription if exists and not free
    if (currentSub && currentSub.plan !== 'free') {
      currentSub.status = 'cancelled';
      currentSub.previousPlans = currentSub.previousPlans || [];
      currentSub.previousPlans.push({
        plan: currentSub.plan,
        startDate: currentSub.startDate,
        endDate: new Date(),
        cancelledAt: new Date()
      });
      await currentSub.save();
    }

    // Process payment from wallet
        // Process payment from wallet
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.getOrCreateWallet(userId);
      if (!wallet.hasSufficientBalance(plan.price, 'IRR')) {
        throw new Error('موجودی کیف پول کافی نیست');
      }

      await wallet.withdraw(plan.price, 'IRR');
      const subscription = await this.createSubscription(userId, plan, 'wallet');

      await ledgerService.recordSubscriptionPayment({
        userId,
        walletId: wallet._id,
        subscriptionId: subscription._id,
        amount: plan.price,
        currency: 'IRR',
        planId: plan.name,
        planName: plan.nameFa || plan.name,
        paymentMethod: 'wallet',
        status: 'completed',
        metadata: {
          paymentMethod: 'wallet',
          source: 'subscriptionService.purchase.wallet',
        },
      });

      return subscription;
    }





    // Zarinpal payment
    if (paymentMethod === 'zarinpal') {
      const callbackUrl = `${process.env.BASE_URL}/api/subscriptions/verify`;
      const description = `خرید اشتراک ${plan.nameFa} - فوبینو`;

      try {
        const wallet = await Wallet.getOrCreateWallet(userId);
        const result = await zarinpal.request(plan.price, description, callbackUrl, null, null);

        if (result.success) {
          const subscription = new Subscription({
            user: userId,
            plan: plan.name,
            planDetails: {
              duration: plan.duration,
              sellPosts: plan.sellPosts,
              buyPosts: plan.buyPosts,
              accessToBuyPosts: plan.accessToBuyPosts,
              maxOffersVisible: plan.maxOffersVisible,
              maxChatsPerPost: plan.maxChatsPerPost,
              features: plan.features
            },
            status: 'pending',
            startDate: new Date(),
            endDate: plan.duration === 0 ? null :
              new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
            payment: {
              amount: plan.price,
              currency: 'IRR',
              paymentMethod: 'zarinpal',
              authority: result.authority,
              gateway: 'zarinpal_sandbox'
            }
          });
          await subscription.save();

          await ledgerService.recordSubscriptionPayment({
            userId,
            walletId: wallet._id,
            subscriptionId: subscription._id,
            amount: plan.price,
            currency: 'IRR',
            planId: plan.name,
            planName: plan.nameFa || plan.name,
            paymentMethod: 'gateway',
            status: 'pending',
            gateway: {
              name: 'zarinpal',
              authority: result.authority,
            },
            metadata: {
              paymentMethod: 'gateway',
              source: 'subscriptionService.purchase.gateway.init',
            },
          });

          return {
            subscription,
            paymentUrl: result.url,
            authority: result.authority
          };
        }

        throw new Error('خطا در اتصال به درگاه پرداخت');
      } catch (error) {
        logger.error('Zarinpal payment error:', error);
        throw new Error('خطا در اتصال به درگاه پرداخت');
      }
    }

    throw new Error('روش پرداخت نامعتبر است');
  }

  // Create subscription helper
  async createSubscription(userId, plan, paymentMethod) {
    const endDate = plan.duration === 0 ? null : 
      new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
    
    const subscription = new Subscription({
      user: userId,
      plan: plan.name,
      planDetails: {
        duration: plan.duration,
        sellPosts: plan.sellPosts,
        buyPosts: plan.buyPosts,
        accessToBuyPosts: plan.accessToBuyPosts,
        maxOffersVisible: plan.maxOffersVisible,
        maxChatsPerPost: plan.maxChatsPerPost,
        features: plan.features
      },
      status: 'active',
      startDate: new Date(),
      endDate: endDate,
      payment: {
        amount: plan.price,
        currency: 'IRR',
        paidAt: new Date(),
        paymentMethod
      },
      usage: {
        lastResetDate: new Date()
      }
    });

    await subscription.save();

    // If producer plan, create/update producer profile
    if (plan.name === 'producer') {
      await this.createOrUpdateProducerProfile(userId);
    }

    return subscription;
  }

  // Create or update producer profile
  async createOrUpdateProducerProfile(userId) {
    const Producer = require('../models/Producer');
    let producer = await Producer.findOne({ user: userId });
    
    if (!producer) {
      const user = await User.findById(userId);
      producer = new Producer({
        user: userId,
        companyName: user.userType === 'company' ? user.companyInfo?.companyName : '',
        contact: {
          phone: user.phone,
          email: user.email
        },
        status: 'active',
        badge: 'bronze'
      });
      await producer.save();
    }
    
    return producer;
  }

  // Verify Zarinpal payment callback
  async verifyPayment(authority) {
    logger.info('Subscription payment verification started', {
      authority: authority?.substring(0, 10) + '...'
    });

    const subscription = await Subscription.findOne({
      'payment.authority': authority,
      status: 'pending'
    });

    if (!subscription) {
      logger.warn('Subscription not found for authority:', authority);
      throw new Error('تراکنش یافت نشد');
    }

    const transaction = await Transaction.findOne({
      'gateway.authority': authority,
      type: 'subscription',
      domain: 'subscription',
      status: 'pending',
    });

    try {
      const result = await zarinpal.verify(authority, subscription.payment.amount);

      if (result.success) {
        subscription.status = 'active';
        subscription.startDate = new Date();
        subscription.endDate = subscription.planDetails.duration === 0 ? null :
          new Date(Date.now() + subscription.planDetails.duration * 24 * 60 * 60 * 1000);
        subscription.payment.paidAt = new Date();
        subscription.payment.refId = result.refId;
        subscription.usage = {
          lastResetDate: new Date(),
          sellPostsUsed: 0,
          buyPostsUsed: 0,
          accessToBuyPostsUsed: 0
        };
        await subscription.save();

        if (transaction) {
          transaction.status = 'completed';
          transaction.settlementStatus = 'completed';
          transaction.completedAt = new Date();
          transaction.timeline = transaction.timeline || {};
          transaction.timeline.settledAt = new Date();
          transaction.flow = 'wallet_payment';
          transaction.impact = 'no_balance_change';
          transaction.relatedSubscription = subscription._id;
          transaction.gateway = {
            ...(transaction.gateway || {}),
            refId: result.refId,
            cardPan: result.cardPan,
            fee: result.fee,
          };
          transaction.metadata = {
            ...(transaction.metadata || {}),
            paymentMethod: 'gateway',
            planId: String(subscription.plan),
            planName: subscription.plan,
            source: 'subscriptionService.verifyPayment.success',
          };
          transaction.display = {
            title: 'خرید اشتراک',
            subtitle: `${subscription.plan} · پرداخت موفق`,
            explainer: 'پرداخت اشتراک از طریق درگاه با موفقیت انجام شد و اشتراک فعال شد.',
            badge: 'success',
            previewNetAmount: Math.abs(transaction.grossAmount || transaction.amount || 0),
          };
          await transaction.save();
        }

        if (subscription.plan === 'producer') {
          await this.createOrUpdateProducerProfile(subscription.user);
        }

        logger.info('Subscription payment verified successfully', {
          subscriptionId: subscription._id,
          userId: subscription.user,
          plan: subscription.plan,
          amount: subscription.payment.amount,
          refId: result.refId
        });

        return { success: true, subscription };
      }

      logger.error('Payment verification failed:', result.error);
      subscription.status = 'failed';
      await subscription.save();

      if (transaction) {
        await markSubscriptionGatewayTransactionFailed(
          transaction,
          'پرداخت اشتراک ناموفق بود و اشتراک فعال نشد.'
        );
      }

      return { success: false, error: result.error };
    } catch (error) {
      logger.error('Payment verification error:', {
        message: error.message,
        authority: authority,
        stack: error.stack?.split('\n')[0]
      });

      subscription.status = 'failed';
      await subscription.save();

      if (transaction) {
        await markSubscriptionGatewayTransactionFailed(
          transaction,
          'خطا در تأیید پرداخت اشتراک'
        );
      }

      throw new Error('خطا در تأیید پرداخت');
    }
  }

  // Upgrade subscription
  async upgrade(userId, newPlanName) {
    const newPlan = this.getPlan(newPlanName);
    if (!newPlan) {
      throw new Error('پلن انتخابی نامعتبر است');
    }

    const currentSub = await this.getUserSubscription(userId);
    if (!currentSub || currentSub.status !== 'active') {
      // No active subscription, just purchase
      return this.purchase(userId, newPlanName);
    }

    // Check if upgrading from free
    if (currentSub.plan === 'free') {
      return this.purchase(userId, newPlanName);
    }

    const currentPlan = this.getPlan(currentSub.plan);
    
    // Calculate prorated amount
    const remainingDays = currentSub.remainingDays;
    const dailyRateCurrent = currentPlan.price / currentPlan.duration;
    const creditAmount = Math.floor(dailyRateCurrent * remainingDays);
    const upgradeCost = Math.max(0, newPlan.price - creditAmount);

    // Process payment for difference
    if (upgradeCost > 0) {
      const wallet = await Wallet.getOrCreateWallet(userId);
      if (!wallet.hasSufficientBalance(upgradeCost, 'IRR')) {
        throw new Error('موجودی کیف پول کافی نیست');
      }
      await wallet.withdraw(upgradeCost, 'IRR');
    }

    // Archive current subscription
    currentSub.previousPlans.push({
      plan: currentSub.plan,
      startDate: currentSub.startDate,
      endDate: new Date(),
      cancelledAt: new Date()
    });

    // Update to new plan
    currentSub.plan = newPlan.name;
    currentSub.planDetails = {
      duration: newPlan.duration,
      sellPosts: newPlan.sellPosts,
      buyPosts: newPlan.buyPosts,
      accessToBuyPosts: newPlan.accessToBuyPosts,
      maxOffersVisible: newPlan.maxOffersVisible,
      maxChatsPerPost: newPlan.maxChatsPerPost,
      features: newPlan.features
    };
    currentSub.startDate = new Date();
    currentSub.endDate = newPlan.duration === 0 ? null :
      new Date(Date.now() + newPlan.duration * 24 * 60 * 60 * 1000);
    currentSub.usage = {
      sellPostsUsed: 0,
      buyPostsUsed: 0,
      accessToBuyPostsUsed: 0,
      lastResetDate: new Date()
    };

    await currentSub.save();

    // Create transaction
    if (upgradeCost > 0) {
      const wallet = await Wallet.getOrCreateWallet(userId);

      await ledgerService.recordSubscriptionPayment({
        userId,
        walletId: wallet._id,
        subscriptionId: currentSub._id,
        amount: upgradeCost,
        currency: 'IRR',
        planId: newPlan.name,
        planName: newPlan.nameFa || newPlan.name,
        paymentMethod: 'wallet',
        status: 'completed',
        metadata: {
          paymentMethod: 'wallet',
          upgradeFrom: currentPlan?.name || currentSub.previousPlans?.[currentSub.previousPlans.length - 1]?.plan,
          source: 'subscriptionService.upgrade',
        },
      });
    }

    // If upgrading to producer, create/update profile
    if (newPlan.name === 'producer') {
      await this.createOrUpdateProducerProfile(userId);
    }

    return currentSub;
  }

  // Cancel subscription
  async cancel(userId) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      throw new Error('اشتراک فعالی یافت نشد');
    }

    if (subscription.plan === 'free') {
      throw new Error('اشتراک رایگان قابل لغو نیست');
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Create free subscription for user
    await this.getOrCreateFreeSubscription(userId);

    return { message: 'اشتراک شما لغو شد' };
  }

  // Check limits
  async checkLimits(userId) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      // Return free plan limits
      const freePlan = this.getPlan('free');
      return {
        hasActiveSubscription: false,
        plan: 'free',
        remainingDays: null,
        limits: {
          sellPosts: {
            total: freePlan.sellPosts,
            used: 0,
            remaining: freePlan.sellPosts
          },
          accessToBuyPosts: {
            total: freePlan.accessToBuyPosts,
            used: 0,
            remaining: freePlan.accessToBuyPosts
          },
          maxOffersVisible: freePlan.maxOffersVisible,
          maxChatsPerPost: freePlan.maxChatsPerPost
        }
      };
    }

    return {
      hasActiveSubscription: true,
      plan: subscription.plan,
      remainingDays: subscription.remainingDays,
      limits: {
        sellPosts: {
          total: subscription.planDetails.sellPosts,
          used: subscription.usage.sellPostsUsed,
          remaining: subscription.remainingSellPosts
        },
        accessToBuyPosts: {
          total: subscription.planDetails.accessToBuyPosts,
          used: subscription.usage.accessToBuyPostsUsed,
          remaining: subscription.remainingAccessToBuyPosts
        },
        maxOffersVisible: subscription.planDetails.maxOffersVisible,
        maxChatsPerPost: subscription.planDetails.maxChatsPerPost
      }
    };
  }

  // Check if can access contact details
  // In subscriptionService.js - Replace the buggy methods:

// Fix the canAccessContact method
async canAccessContact(userId) {
  // Get user's subscription (or free if none)
  const subscription = await this.getUserSubscription(userId);
  
  // If no active subscription, use free plan
  if (!subscription || subscription.status !== 'active') {
    const freePlan = this.getPlan('free');
    const freeSub = await this.getOrCreateFreeSubscription(userId);
    
    // Reset monthly usage if needed
    await this.resetMonthlyUsageIfNeeded(freeSub);
    
    const used = freeSub.usage.accessToBuyPostsUsed || 0;
    const remaining = Math.max(0, freePlan.accessToBuyPosts - used);
    
    return {
      canAccess: remaining > 0,
      remaining: remaining,
      used: used,
      total: freePlan.accessToBuyPosts,
      isFreeUser: true,
      planName: 'free'
    };
  }

  // Reset monthly usage if needed
  await this.resetMonthlyUsageIfNeeded(subscription);

  // Unlimited access (-1 means unlimited)
  if (subscription.planDetails.accessToBuyPosts === -1) {
    return {
      canAccess: true,
      remaining: -1,
      used: subscription.usage.accessToBuyPostsUsed,
      total: -1,
      isFreeUser: false,
      planName: subscription.plan
    };
  }

  // Calculate base quota
  const baseQuota = subscription.planDetails.accessToBuyPosts;
  
  // Calculate available extras (not used this month)
  const extras = subscription.extras
    .filter(e => e.type === 'access_posts' && e.amount > 0)
    .reduce((sum, e) => {
      // If extra was used this month, don't count it
      if (e.usedAt && new Date(e.usedAt) >= new Date(subscription.usage.lastResetDate)) {
        return sum;
      }
      return sum + e.amount;
    }, 0);
    
  const totalAvailable = baseQuota + extras;
  const used = subscription.usage.accessToBuyPostsUsed || 0;
  const remaining = Math.max(0, totalAvailable - used);
  
  return {
    canAccess: remaining > 0,
    remaining: remaining,
    used: used,
    total: totalAvailable,
    isFreeUser: false,
    planName: subscription.plan,
    baseQuota: baseQuota,
    extraQuota: extras
  };
}

// Use contact access quota
async useContactAccess(userId) {
  const subscription = await this.getUserSubscription(userId);
  
  // If no subscription, create free one
  if (!subscription || subscription.status !== 'active') {
    const freePlan = this.getPlan('free');
    const freeSub = await this.getOrCreateFreeSubscription(userId);
    
    // Reset monthly usage if needed
    await this.resetMonthlyUsageIfNeeded(freeSub);
    
    if (freeSub.usage.accessToBuyPostsUsed >= freePlan.accessToBuyPosts) {
      throw new Error('سهمیه دسترسی به اطلاعات تماس شما به پایان رسیده است');
    }
    
    freeSub.usage.accessToBuyPostsUsed += 1;
    await freeSub.save();
    return freeSub;
  }

  // Reset monthly usage if needed
  await this.resetMonthlyUsageIfNeeded(subscription);

  // Unlimited access
  if (subscription.planDetails.accessToBuyPosts === -1) {
    subscription.usage.accessToBuyPostsUsed += 1;
    await subscription.save();
    return subscription;
  }

  const baseQuota = subscription.planDetails.accessToBuyPosts;
  const used = subscription.usage.accessToBuyPostsUsed || 0;
  
  // Try to use base quota first
  if (used < baseQuota) {
    subscription.usage.accessToBuyPostsUsed += 1;
    await subscription.save();
    return subscription;
  }
  
  // Find an extra quota to use
  const extraToUse = subscription.extras.find(e => 
    e.type === 'access_posts' && e.amount > 0 && 
    (!e.usedAt || new Date(e.usedAt) < new Date(subscription.usage.lastResetDate))
  );
  
  if (extraToUse) {
    extraToUse.amount -= 1;
    extraToUse.usedAt = new Date();
    
    if (extraToUse.amount === 0) {
      // Mark as fully used
      extraToUse.isUsed = true;
    }
    
    await subscription.save();
    return subscription;
  }
  
  throw new Error('سهمیه دسترسی به اطلاعات تماس شما به پایان رسیده است');
}

// Ensure resetMonthlyUsageIfNeeded exists and works
async resetMonthlyUsageIfNeeded(subscription) {
  if (!subscription.usage.lastResetDate) {
    subscription.usage.lastResetDate = new Date();
    await subscription.save();
    return;
  }

  const now = new Date();
  const lastReset = new Date(subscription.usage.lastResetDate);
  const nextReset = new Date(lastReset);
  
  // Reset monthly (30 days from last reset)
  nextReset.setMonth(nextReset.getMonth() + 1);

  if (now > nextReset) {
    // Reset base usage
    subscription.usage.accessToBuyPostsUsed = 0;
    subscription.usage.lastResetDate = now;
    
    // Don't reset extras - they stay until used
    await subscription.save();
  }
}

// Fix purchaseExtraQuota to add transaction properly
async purchaseExtraQuota(userId, amount) {
  const subscription = await this.getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    throw new Error('اشتراک فعالی یافت نشد');
  }

  const price = QUOTA_PRICES.ACCESS_POSTS * amount;
  
  const wallet = await Wallet.getOrCreateWallet(userId);
  if (!wallet.hasSufficientBalance(price, 'IRR')) {
    throw new Error('موجودی کیف پول کافی نیست');
  }

  // Process payment
  await wallet.withdraw(price, 'IRR');

  // Add extra quota
  subscription.extras.push({
    type: 'access_posts',
    amount: amount,
    purchasedAt: new Date(),
    price: price,
    isUsed: false
  });

  await subscription.save();

  // Create transaction
  const transaction = new Transaction({
    user: userId,
    wallet: wallet._id,
    type: 'subscription',
    amount: -price,
    currency: 'IRR',
    description: `خرید ${amount} سهمیه دسترسی اضافی`,
    status: 'completed',
    relatedSubscription: subscription._id,
    completedAt: new Date()
  });

  await transaction.save();

  return subscription;
}

  // Use sell post quota
  async useSellPostQuota(userId) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      // Free users can create unlimited posts
      return;
    }

    await subscription.useSellPostQuota();
    return subscription;
  }

  // Use access to buy posts quota
  async useAccessQuota(userId) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      // Use free plan
      const freeSub = await this.getOrCreateFreeSubscription(userId);
      return this.useContactAccess(userId);
    }

    await subscription.useAccessToBuyPostsQuota();
    return subscription;
  }

  // Purchase extra contact quota
  async purchaseExtraQuota(userId, amount) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || subscription.status !== 'active') {
      throw new Error('اشتراک فعالی یافت نشد');
    }

    const price = QUOTA_PRICES.ACCESS_POSTS * amount;

    const wallet = await Wallet.getOrCreateWallet(userId);
    if (!wallet.hasSufficientBalance(price, 'IRR')) {
      throw new Error('موجودی کیف پول کافی نیست');
    }

    await wallet.withdraw(price, 'IRR');

    subscription.extras.push({
      type: 'access_posts',
      amount: amount,
      purchasedAt: new Date()
    });

    await subscription.save();

    await ledgerService.recordSubscriptionPayment({
      userId,
      walletId: wallet._id,
      subscriptionId: subscription._id,
      amount: price,
      currency: 'IRR',
      planId: subscription.plan,
      planName: `سهمیه اضافی ${amount} دسترسی`,
      paymentMethod: 'wallet',
      status: 'completed',
      metadata: {
        paymentMethod: 'wallet',
        quotaType: 'access_posts',
        quotaAmount: amount,
        source: 'subscriptionService.purchaseExtraQuota',
      },
    });

    return subscription;
  }

  // Check expiring subscriptions (for cron job)
  async checkExpiringSubscriptions() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const expiring7Days = await Subscription.find({
      status: 'active',
      plan: { $in: ['vip', 'producer'] },
      endDate: { $lte: in7Days, $gt: now },
      'notificationsSent.expiryWarning7Days': false
    }).populate('user', 'firstName lastName email');

    for (const sub of expiring7Days) {
      await notificationService.notifySubscriptionExpiring(sub.user, 7);
      sub.notificationsSent.expiryWarning7Days = true;
      await sub.save();
    }

    // 3 days warning
    const expiring3Days = await Subscription.find({
      status: 'active',
      plan: { $in: ['vip', 'producer'] },
      endDate: { $lte: in3Days, $gt: in1Day },
      'notificationsSent.expiryWarning3Days': false
    });

    for (const sub of expiring3Days) {
      await notificationService.notifySubscriptionExpiring(sub.user, 3);
      sub.notificationsSent.expiryWarning3Days = true;
      await sub.save();
    }

    // 1 day warning
    const expiring1Day = await Subscription.find({
      status: 'active',
      plan: { $in: ['vip', 'producer'] },
      endDate: { $lte: in1Day, $gt: now },
      'notificationsSent.expiryWarning1Day': false
    });

    for (const sub of expiring1Day) {
      await notificationService.notifySubscriptionExpiring(sub.user, 1);
      sub.notificationsSent.expiryWarning1Day = true;
      await sub.save();
    }

    // Expired (only for vip and producer, free never expires)
    const expired = await Subscription.find({
      status: 'active',
      plan: { $in: ['vip', 'producer'] },
      endDate: { $lte: now }
    });

    for (const sub of expired) {
      sub.status = 'expired';
      sub.notificationsSent.expired = true;
      await sub.save();
      
      // Create free subscription
      await this.getOrCreateFreeSubscription(sub.user);
    }

    logger.info(`Subscription check completed: ${expiring7Days.length} 7-day, ${expiring3Days.length} 3-day, ${expiring1Day.length} 1-day, ${expired.length} expired`);
  }
}

module.exports = new SubscriptionService();