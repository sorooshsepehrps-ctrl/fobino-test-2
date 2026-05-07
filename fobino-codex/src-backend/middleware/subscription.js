const Subscription = require('../models/Subscription');
const { SUBSCRIPTION_PLANS } = require('../config/constants');
const subscriptionService = require('../services/subscriptionService');

// Check if user has active subscription (updated)
const hasActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    // Everyone has at least free subscription
    if (!subscription) {
      // Create free subscription
      await subscriptionService.getOrCreateFreeSubscription(req.user._id);
    }

    req.subscription = subscription || await subscriptionService.getOrCreateFreeSubscription(req.user._id);
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// Check if user can create sell post (updated for unlimited free posts)
const canCreateSellPost = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    // Everyone can create unlimited sell posts
    const subscription = await subscriptionService.getUserSubscription(req.user._id);
    
    if (!subscription) {
      // This shouldn't happen as everyone gets free subscription
      return res.status(500).json({
        success: false,
        message: 'خطا در بررسی وضعیت اشتراک'
      });
    }
    
    if (subscription.plan === 'free' || subscription.plan === 'vip' || subscription.plan === 'producer') {
      req.subscription = subscription;
      return next();
    }
    
    // If somehow there's another plan, check limits
    if (!subscription.canCreateSellPost()) {
      return res.status(403).json({
        success: false,
        message: 'سهمیه آگهی فروش شما به پایان رسیده است',
        code: 'SELL_POST_LIMIT_REACHED',
        remaining: subscription.remainingSellPosts,
        plan: subscription.plan
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// Check if user can access contact details of buy posts
const canAccessContact = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    const accessInfo = await subscriptionService.canAccessContact(req.user._id);
    
    if (!accessInfo.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'سهمیه دسترسی به اطلاعات تماس شما به پایان رسیده است',
        code: 'CONTACT_ACCESS_LIMIT_REACHED',
        remaining: accessInfo.remaining,
        used: accessInfo.used,
        total: accessInfo.total,
        canPurchaseExtra: true
      });
    }

    req.contactAccessInfo = accessInfo;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// Use contact access quota
const useContactAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    await subscriptionService.useContactAccess(req.user._id);
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
      code: 'CONTACT_ACCESS_LIMIT_REACHED'
    });
  }
};

// Check if user can access buy posts (alias for canAccessContact)
const canAccessBuyPosts = canAccessContact;

// Check if user has specific feature
const hasFeature = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'برای دسترسی به این بخش باید وارد شوید'
        });
      }

      const subscription = await subscriptionService.getUserSubscription(req.user._id);
      
      if (!subscription || !subscription.hasFeature(feature)) {
        return res.status(403).json({
          success: false,
          message: 'این امکان در اشتراک شما موجود نیست',
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          currentPlan: subscription?.plan || 'free'
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'خطای سرور'
      });
    }
  };
};

// Check minimum subscription plan
const requirePlan = (...allowedPlans) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'برای دسترسی به این بخش باید وارد شوید'
        });
      }

      const subscription = await subscriptionService.getUserSubscription(req.user._id);
      
      if (!subscription || !allowedPlans.includes(subscription.plan)) {
        return res.status(403).json({
          success: false,
          message: 'برای دسترسی به این بخش نیاز به ارتقای اشتراک دارید',
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: subscription?.plan || 'free',
          requiredPlans: allowedPlans
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'خطای سرور'
      });
    }
  };
};

// Get subscription info and attach to request
const attachSubscription = async (req, res, next) => {
  try {
    if (req.user) {
      const subscription = await subscriptionService.getUserSubscription(req.user._id);
      
      if (!subscription) {
        // Create free subscription if doesn't exist
        subscription = await subscriptionService.getOrCreateFreeSubscription(req.user._id);
      }
      
      req.subscription = subscription;
      
      // Also attach contact access info
      if (subscription) {
        const accessInfo = await subscriptionService.canAccessContact(req.user._id);
        req.contactAccessInfo = accessInfo;
      }
    }
    next();
  } catch (error) {
    // Don't fail the request if subscription check fails
    console.error('Error attaching subscription:', error);
    next();
  }
};

// Check chat limit per post
const checkChatLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای شروع گفتگو نیاز به ورود دارید'
      });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user._id);
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'برای شروع گفتگو نیاز به اشتراک فعال دارید'
      });
    }

    const Chat = require('../models/Chat');
    const postId = req.params.postId || req.body.postId;
    
    if (!postId) {
      return next();
    }
    
    const chatCount = await Chat.countDocuments({
      post: postId,
      'participants.user': req.user._id,
      status: 'active'
    });

    if (subscription.planDetails.maxChatsPerPost !== -1 && chatCount >= subscription.planDetails.maxChatsPerPost) {
      return res.status(403).json({
        success: false,
        message: 'به حداکثر تعداد گفتگو برای این آگهی رسیده‌اید',
        code: 'CHAT_LIMIT_REACHED',
        current: chatCount,
        limit: subscription.planDetails.maxChatsPerPost
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// Check if user can view post details
const canViewPostDetails = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای مشاهده جزئیات آگهی باید وارد شوید'
      });
    }

    const postId = req.params.id || req.body.postId;
    if (!postId) {
      return next();
    }

    const Post = require('../models/Post');
    const post = await Post.findById(postId).select('user type');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'آگهی یافت نشد'
      });
    }

    // User can always see their own posts
    if (post.user.toString() === req.user._id.toString()) {
      return next();
    }

    // For buy posts, check contact access
    if (post.type === 'buy') {
      const accessInfo = await subscriptionService.canAccessContact(req.user._id);
      
      if (!accessInfo.canAccess) {
        return res.status(403).json({
          success: false,
          message: 'برای مشاهده اطلاعات تماس این آگهی، نیاز به استفاده از سهمیه دارید',
          code: 'CONTACT_ACCESS_REQUIRED',
          remaining: accessInfo.remaining,
          used: accessInfo.used,
          total: accessInfo.total
        });
      }
      
      req.contactAccessInfo = accessInfo;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

// Middleware to check user verification level for subscription purchase
const checkVerificationForPurchase = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای خرید اشتراک باید وارد شوید'
      });
    }

    const { planName } = req.body;
    
    // Free plan doesn't need verification
    if (planName === 'free') {
      return next();
    }

    // VIP and Producer plans require level 2 verification
    if (planName === 'vip' || planName === 'producer') {
      if (req.user.level < 2) {
        return res.status(403).json({
          success: false,
          message: 'برای خرید این اشتراک، باید احراز هویت سطح 2 (شماره شبا) را تکمیل کنید',
          code: 'VERIFICATION_REQUIRED',
          requiredLevel: 2,
          currentLevel: req.user.level
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

module.exports = {
  hasActiveSubscription,
  canCreateSellPost,
  canAccessBuyPosts,
  canAccessContact,
  useContactAccess,
  hasFeature,
  requirePlan,
  attachSubscription,
  checkChatLimit,
  canViewPostDetails,
  checkVerificationForPurchase
};