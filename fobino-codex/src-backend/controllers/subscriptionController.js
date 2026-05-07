const subscriptionService = require('../services/subscriptionService');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

// @desc    Get all subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public


// exports.getPlans = asyncHandler(async (req, res) => {
//   const plans = subscriptionService.getPlans();
//   return response.success(res, { plans });
// });


exports.getPlans = asyncHandler (async (req , res)=>{
  const plan = subscriptionService.getPlans()
  return response.success(res, {plans})
});




// @desc    Get user's current subscription
// @route   GET /api/subscriptions/my
// @route   GET /api/subscriptions/me
// @access  Private
exports.getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user._id);
  const limits = await subscriptionService.checkLimits(req.user._id);
  return response.success(res, { subscription, limits });
});

// @desc    Purchase a subscription plan
// @route   POST /api/subscriptions/purchase
// @access  Private
exports.purchase = asyncHandler(async (req, res) => {
  const { planName, paymentMethod = 'wallet' } = req.body;
  const result = await subscriptionService.purchase(req.user._id, planName, paymentMethod);
  
  // If Zarinpal payment, return payment URL
  if (result.paymentUrl) {
    return response.success(res, { 
      subscription: result.subscription,
      paymentUrl: result.paymentUrl,
      authority: result.authority
    }, 'در حال انتقال به درگاه پرداخت');
  }
  
  return response.created(res, { subscription: result }, 'اشتراک با موفقیت خریداری شد');
});

// @desc    Upgrade subscription
// @route   POST /api/subscriptions/upgrade
// @access  Private
exports.upgrade = asyncHandler(async (req, res) => {
  const { newPlanName } = req.body;
  const subscription = await subscriptionService.upgrade(req.user._id, newPlanName);
  return response.success(res, { subscription }, 'اشتراک با موفقیت ارتقا یافت');
});


// exports.upgrade = asyncHandler(async (req, res) => {
//   const { newPlanName } = req.body;
//   const {userId } = req.params


//   const sunscriptionSchema = await subscriptionmodel ({req.user._id , newPlanName})
//   return response.success (res , {subscription}, 'ssssssssss')
//   const subscription = await subscriptionService.upgrade(req.user._id, newPlanName);
//   return response.success(res, { subscription }, 'اشتراک با موفقیت ارتقا یافت');
// });




// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
exports.cancel = asyncHandler(async (req, res) => {
  const result = await subscriptionService.cancel(req.user._id);
  return response.success(res, null, result.message);
});

// @desc    Check subscription limits
// @route   GET /api/subscriptions/limits
// @access  Private
exports.checkLimits = asyncHandler(async (req, res) => {
  const limits = await subscriptionService.checkLimits(req.user._id);
  return response.success(res, limits);
});

// @desc    Get subscription usage
// @route   GET /api/subscriptions/usage
// @access  Private
exports.getUsage = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user._id);
  const accessInfo = await subscriptionService.canAccessContact(req.user._id);
  
  return response.success(res, {
    subscription: {
      plan: subscription?.plan || 'free',
      status: subscription?.status || 'active',
      startDate: subscription?.startDate,
      endDate: subscription?.endDate,
      remainingDays: subscription?.remainingDays || null
    },
    usage: {
      contactAccess: accessInfo,
      sellPosts: {
        used: subscription?.usage?.sellPostsUsed || 0,
        remaining: subscription?.plan === 'free' ? -1 : subscription?.planDetails?.sellPosts || -1
      }
    }
  });
});

// @desc    Check contact access availability
// @route   GET /api/subscriptions/contact-access
// @access  Private
exports.checkContactAccess = asyncHandler(async (req, res) => {
  const accessInfo = await subscriptionService.canAccessContact(req.user._id);
  return response.success(res, { accessInfo });
});

// @desc    Purchase extra contact quota
// @route   POST /api/subscriptions/purchase-contact-quota
// @access  Private
exports.purchaseContactQuota = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount < 1) {
    return response.error(res, 'تعداد سهمیه باید حداقل ۱ باشد', 400);
  }

  const subscription = await subscriptionService.purchaseExtraQuota(req.user._id, amount);
  return response.success(res, { 
    subscription,
    purchasedAmount: amount,
    price: 100000 * amount // 10,000 Toman each
  }, 'سهمیه دسترسی اضافی خریداری شد');
});

// @desc    Purchase extra quota (legacy endpoint)
// @route   POST /api/subscriptions/extra
// @route   POST /api/subscriptions/quota
// @access  Private
exports.purchaseExtra = asyncHandler(async (req, res) => {
  const { type, amount } = req.body;
  if (!['sell_posts', 'access_posts'].includes(type)) {
    return response.error(res, 'نوع سهمیه نامعتبر است', 400);
  }
  
  // For access_posts, use the new method
  if (type === 'access_posts') {
    const subscription = await subscriptionService.purchaseExtraQuota(req.user._id, amount);
    return response.success(res, { subscription }, 'سهمیه اضافی خریداری شد');
  }
  
  // For sell_posts (legacy support)
  const subscription = await subscriptionService.purchaseExtraQuota(req.user._id, type, amount);
  return response.success(res, { subscription }, 'سهمیه اضافی خریداری شد');
});

// @desc    Verify payment callback from Zarinpal
// @route   GET /api/subscriptions/verify
// @access  Public
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { Authority, Status } = req.query;
  
  if (Status !== 'OK') {
    return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/subscription?status=failed`);
  }

  try {
    const result = await subscriptionService.verifyPayment(Authority);
    if (result.success) {
      return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/subscription?status=success`);
    } else {
      return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/subscription?status=failed`);
    }
  } catch (error) {
    return res.redirect(`${process.env.CORS_ORIGIN}/dashboard/subscription?status=failed`);
  }
});
























