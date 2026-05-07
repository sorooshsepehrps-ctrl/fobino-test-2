/* backend/src/controllers/authController.js - OPTIMIZED VERSION */
const authService = require('../services/authService');
const subscriptionService = require('../services/subscriptionService');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { phone, password, firstName, lastName } = req.body;
  const result = await authService.register(phone, password, firstName, lastName);
  return response.created(res, result, 'ثبت‌نام با موفقیت انجام شد');
});

// @desc    Login user (OTP-based, no password)
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return response.error(res, 'شماره تلفن الزامی است', 400);
  }

  const result = await authService.login(phone);
  return response.success(res, result, result.message);
});

// @desc    Verify phone and complete login/registration
// @route   POST /api/auth/verify
// @access  Public
exports.verify = asyncHandler(async (req, res) => {
  const { phone, code, userType, firstName, lastName, companyName, economicCode } = req.body;
  
  // Build userData object for new users
  const userData = {
    userType: userType || 'individual',
    firstName: firstName || '',
    lastName: lastName || '',
    companyName: companyName || '',
    economicCode: economicCode || ''
  };

  // Verify phone and get user info
  const result = await authService.verifyPhone(phone, code, userData);
  
  // Ensure wallet and subscription exist for ALL users (new and existing)
  try {
    await ensureUserHasWalletAndSubscription(result.user._id);
  } catch (error) {
    console.error('❌ Error ensuring wallet/subscription:', error.message);
    // Don't fail the verification if this fails
  }
  
  return response.success(res, result, 'ورود موفق');
});

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
exports.resendCode = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await authService.resendVerificationCode(phone);
  return response.success(res, result, result.message);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await authService.forgotPassword(phone);
  return response.success(res, result, result.message);
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { phone, code, newPassword } = req.body;
  const result = await authService.resetPassword(phone, code, newPassword);
  return response.success(res, result, result.message);
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
  return response.success(res, result, result.message);
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  return response.success(res, result, 'توکن با موفقیت بازیابی شد');
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user._id);
  return response.success(res, null, result.message);
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = authService.sanitizeUser(req.user);
  
  // Ensure wallet and subscription exist
  try {
    await ensureUserHasWalletAndSubscription(req.user._id);
  } catch (error) {
    console.error('Error ensuring wallet/subscription:', error.message);
  }
  
  return response.success(res, { user });
});

// @desc    Fix missing wallet and subscription for current user
// @route   POST /api/auth/fix-account
// @access  Private
exports.fixAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  
  try {
    const result = await ensureUserHasWalletAndSubscription(user._id, true);
    return response.success(res, result, 'حساب کاربری با موفقیت به‌روزرسانی شد');
  } catch (error) {
    return response.error(res, `خطا در به‌روزرسانی حساب: ${error.message}`, 500);
  }
});

// @desc    Check user account status (wallet & subscription)
// @route   GET /api/auth/account-status
// @access  Private
exports.getAccountStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  
  const Wallet = require('../models/Wallet');
  const Subscription = require('../models/Subscription');
  
  const wallet = await Wallet.findOne({ user: user._id });
  const subscription = await Subscription.findOne({ user: user._id });
  
  return response.success(res, {
    user: {
      _id: user._id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      level: user.level
    },
    wallet: wallet ? {
      exists: true,
      _id: wallet._id,
      balances: wallet.balances
    } : {
      exists: false
    },
    subscription: subscription ? {
      exists: true,
      _id: subscription._id,
      plan: subscription.plan,
      status: subscription.status,
      remainingDays: subscription.remainingDays
    } : {
      exists: false
    }
  });
});

// @desc    Get user's subscription details
// @route   GET /api/auth/subscription
// @access  Private
exports.getSubscription = asyncHandler(async (req, res) => {
  const limits = await subscriptionService.checkLimits(req.user._id);
  return response.success(res, { limits });
});

// ========== HELPER FUNCTIONS ==========

/**
 * Ensures user has wallet and subscription
 * @param {string} userId - User ID
 * @param {boolean} verbose - Whether to return detailed result
 * @returns {Promise<Object>} Result of the operation
 */
async function ensureUserHasWalletAndSubscription(userId, verbose = false) {
  const Wallet = require('../models/Wallet');
  const Subscription = require('../models/Subscription');
  
  const result = {
    walletCreated: false,
    walletExists: false,
    subscriptionCreated: false,
    subscriptionExists: false,
    wallet: null,
    subscription: null
  };
  
  try {
    // 1. Ensure wallet exists
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
      result.walletCreated = true;
      console.log(`✅ Wallet created for user: ${userId}`);
    } else {
      result.walletExists = true;
    }
    result.wallet = wallet;
    
    // 2. Ensure subscription exists
    let subscription = await Subscription.findOne({ user: userId });
    if (!subscription) {
      // Use subscriptionService to create free subscription
      subscription = await subscriptionService.getOrCreateFreeSubscription(userId);
      result.subscriptionCreated = true;
      console.log(`✅ Free subscription created for user: ${userId}`);
    } else {
      result.subscriptionExists = true;
      
      // Ensure subscription is active (reactivate if expired/cancelled)
      if (subscription.status !== 'active') {
        subscription.status = 'active';
        await subscription.save();
        console.log(`✅ Reactivated subscription for user: ${userId}`);
      }
    }
    result.subscription = subscription;
    
    return verbose ? result : { success: true };
    
  } catch (error) {
    console.error(`❌ Error ensuring wallet/subscription for user ${userId}:`, error.message);
    throw error;
  }
}

// Also export the helper function for use in other places
exports.ensureUserHasWalletAndSubscription = ensureUserHasWalletAndSubscription;




// const authService = require('../services/authService');
// const { asyncHandler } = require('../middleware/errorHandler');
// const response = require('../utils/responseFormatter');

// // @desc    Register new user
// // @route   POST /api/auth/register
// // @access  Public
// exports.register = asyncHandler(async (req, res) => {
//   const { phone, password, firstName, lastName } = req.body;
//   const result = await authService.register(phone, password, firstName, lastName);
//   return response.created(res, result, 'ثبت‌نام با موفقیت انجام شد');
// });

// // @desc    Login user (OTP-based, no password)
// // @route   POST /api/auth/login
// // @access  Public
// exports.login = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
  
//   if (!phone) {
//     return response.badRequest(res, 'شماره تلفن الزامی است');
//   }

//   const result = await authService.login(phone);
//   return response.success(res, result, result.message);
// });

// // @desc    Verify phone and complete login/registration
// // @route   POST /api/auth/verify
// // @access  Public
// exports.verify = asyncHandler(async (req, res) => {
//   const { phone, code, userType, firstName, lastName, companyName, economicCode } = req.body;
  
//   // Build userData object for new users
//   const userData = (firstName || lastName || userType) ? {
//     userType: userType || 'individual',
//     firstName: firstName || '',
//     lastName: lastName || '',
//     companyName: companyName || '',
//     economicCode: economicCode || '',
//   } : null;

//   const result = await authService.verifyPhone(phone, code, userData);
//   return response.success(res, result, 'ورود موفق');
// });

// // @desc    Resend verification code
// // @route   POST /api/auth/resend-code
// // @access  Public
// exports.resendCode = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
//   const result = await authService.resendVerificationCode(phone);
//   return response.success(res, result, result.message);
// });

// // @desc    Forgot password
// // @route   POST /api/auth/forgot-password
// // @access  Public
// exports.forgotPassword = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
//   const result = await authService.forgotPassword(phone);
//   return response.success(res, result, result.message);
// });

// // @desc    Reset password
// // @route   POST /api/auth/reset-password
// // @access  Public
// exports.resetPassword = asyncHandler(async (req, res) => {
//   const { phone, code, newPassword } = req.body;
//   const result = await authService.resetPassword(phone, code, newPassword);
//   return response.success(res, result, result.message);
// });

// // @desc    Change password
// // @route   POST /api/auth/change-password
// // @access  Private
// exports.changePassword = asyncHandler(async (req, res) => {
//   const { currentPassword, newPassword } = req.body;
//   const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
//   return response.success(res, result, result.message);
// });

// // @desc    Refresh token
// // @route   POST /api/auth/refresh-token
// // @access  Public
// exports.refreshToken = asyncHandler(async (req, res) => {
//   const { refreshToken } = req.body;
//   const result = await authService.refreshToken(refreshToken);
//   return response.success(res, result, 'توکن با موفقیت بازیابی شد');
// });

// // @desc    Logout
// // @route   POST /api/auth/logout
// // @access  Private
// exports.logout = asyncHandler(async (req, res) => {
//   const result = await authService.logout(req.user._id);
//   return response.success(res, null, result.message);
// });

// // @desc    Get current user
// // @route   GET /api/auth/me
// // @access  Private
// exports.getMe = asyncHandler(async (req, res) => {
//   const user = authService.sanitizeUser(req.user);
//   return response.success(res, { user });
// });
