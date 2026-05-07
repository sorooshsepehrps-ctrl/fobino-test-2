/* backend/src/services/authService.js - OPTIMIZED VERSION */
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { kavenegar, generateVerificationCode } = require('../config/sms');
const { sendEmail, emailTemplates } = require('../config/email');
const logger = require('../utils/logger');
const { SYSTEM } = require('../config/constants');

// Import models for wallet/subscription creation
const Wallet = require('../models/Wallet');
const Subscription = require('../models/Subscription');

class AuthService {
  // Login with phone only (OTP-based, no password)
  async login(phone) {
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      // New user - create with pending status
      isNewUser = true;
      user = new User({
        phone,
        roles: ['user'],
        level: 0,
        levelStatus: 'pending',
        status: 'pending',
        isPhoneVerified: false
      });
      await user.save();
    } else {
      // Check if account is locked
      if (user.isLocked && user.isLocked()) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new Error(`حساب شما به مدت ${remainingMinutes} دقیقه مسدود است`);
      }

      // Check status
      if (user.status === 'banned') {
        throw new Error('حساب کاربری شما مسدود شده است');
      }

      if (user.status === 'suspended') {
        throw new Error('حساب کاربری شما به حالت تعلیق درآمده است');
      }
    }

    // Generate verification code
    const code = generateVerificationCode();
    user.phoneVerification = {
      code,
      expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000),
      attempts: 0
    };
    await user.save();

    // Send SMS
    await kavenegar.sendVerificationCode(phone, code);

    return {
      isNewUser,
      message: 'کد تایید به شماره تلفن شما ارسال شد'
    };
  }

  // Verify code and complete registration/login
  async verifyPhone(phone, code, userData = null) {
    const user = await User.findOne({ phone });
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // Validate verification code
    if (!user.phoneVerification || !user.phoneVerification.code) {
      throw new Error('کد تایید ارسال نشده است');
    }

    if (user.phoneVerification.expiresAt < new Date()) {
      throw new Error('کد تایید منقضی شده است');
    }

    if (user.phoneVerification.code !== code) {
      user.phoneVerification.attempts += 1;
      await user.save();

      if (user.phoneVerification.attempts >= 5) {
        throw new Error('تعداد تلاش‌های شما بیش از حد مجاز است');
      }

      throw new Error('کد تایید نادرست است');
    }

    // Clear verification code
    user.phoneVerification = undefined;
    user.verifications = user.verifications || {};
    user.verifications.phone = true;
    user.isPhoneVerified = true;

    // Check if this is a new user
    const isNewUser = user.status === 'pending';
    
    if (isNewUser) {
      // Update user with provided data
      user.firstName = userData?.firstName || '';
      user.lastName = userData?.lastName || '';
      user.userType = userData?.userType || 'individual';
      
      if (userData?.userType === 'company') {
        user.companyInfo = {
          companyName: userData.companyName || '',
          economicCode: userData.economicCode || '',
        };
      }
      
      user.status = 'active';
      user.level = 0;
      
      console.log(`✅ New user activated: ${user._id}`);
    }

    // Update login info
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    // Generate tokens
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // IMPORTANT: Wallet and subscription will be created by authController
    // This ensures they're created even if this service call fails

    return {
      ...tokens,
      user: {
        _id: user._id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        level: user.level,
        status: user.status,
        isNewUser: isNewUser
      }
    };
  }

  // Resend verification code
  async resendVerificationCode(phone) {
    const user = await User.findOne({ phone });
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    const code = generateVerificationCode();
    user.phoneVerification = {
      code,
      expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000),
      attempts: 0
    };
    await user.save();

    await kavenegar.sendVerificationCode(phone, code);

    return { message: 'کد تایید جدید ارسال شد' };
  }

  // Legacy register (kept for backwards compatibility)
  async register(phone, password, firstName = '', lastName = '') {
    return this.login(phone);
  }

  // Forgot password
  async forgotPassword(phone) {
    const user = await User.findOne({ phone });
    
    if (!user) {
      // Don't reveal if user exists
      return { message: 'اگر این شماره در سیستم موجود باشد، کد بازیابی ارسال خواهد شد' };
    }

    const code = generateVerificationCode();
    user.passwordReset = {
      token: code,
      expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000)
    };
    await user.save();

    await kavenegar.sendVerificationCode(phone, code);

    return { message: 'کد بازیابی ارسال شد' };
  }

  // Reset password
  async resetPassword(phone, code, newPassword) {
    const user = await User.findOne({ phone });
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    if (!user.passwordReset || !user.passwordReset.token) {
      throw new Error('درخواست بازیابی رمز عبور یافت نشد');
    }

    if (user.passwordReset.expiresAt < new Date()) {
      throw new Error('کد بازیابی منقضی شده است');
    }

    if (user.passwordReset.token !== code) {
      throw new Error('کد بازیابی نادرست است');
    }

    user.password = newPassword;
    user.passwordReset = undefined;
    await user.save();

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('رمز عبور فعلی نادرست است');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    const user = await User.findOne({ refreshToken });
    
    if (!user) {
      throw new Error('توکن نامعتبر است');
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  // Logout
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return { message: 'با موفقیت خارج شدید' };
  }

  // Sanitize user object
  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.phoneVerification;
    delete userObj.passwordReset;
    return userObj;
  }
}


module.exports = new AuthService();


// const User = require('../models/User');
// const Subscription = require('../models/Subscription');
// const Wallet = require('../models/Wallet');
// const { generateTokens } = require('../middleware/auth');
// const { kavenegar, generateVerificationCode } = require('../config/sms');
// const { sendEmail, emailTemplates } = require('../config/email');
// const logger = require('../utils/logger');
// const { SYSTEM } = require('../config/constants');

// class AuthService {
//   // Login with phone only (OTP-based, no password)
//   // This matches the frontend flow: phone -> OTP -> (if new user: user type selection)
//   async login(phone) {
//     let user = await User.findOne({ phone });
//     let isNewUser = false;

//     if (!user) {
//       // New user - just mark as new, don't create yet
//       isNewUser = true;
      
//       // Create a temporary user record to store the verification code
//       user = new User({
//         phone,
//         roles: ['user'],
//         level: 0,
//         levelStatus: 'pending',
//         status: 'pending'
//       });
//       await user.save();
//     } else {
//       // Check if account is locked
//       if (user.isLocked && user.isLocked()) {
//         const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
//         throw new Error(`حساب شما به مدت ${remainingMinutes} دقیقه مسدود است`);
//       }

//       // Check status
//       if (user.status === 'banned') {
//         throw new Error('حساب کاربری شما مسدود شده است');
//       }

//       if (user.status === 'suspended') {
//         throw new Error('حساب کاربری شما به حالت تعلیق درآمده است');
//       }
//     }

//     // Generate verification code
//     const code = generateVerificationCode();
//     user.phoneVerification = {
//       code,
//       expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000),
//       attempts: 0
//     };
//     await user.save();

//     // Send SMS (in dev mode, this logs to console)
//     await kavenegar.sendVerificationCode(phone, code);

//     return {
//       isNewUser,
//       message: 'کد تایید به شماره تلفن شما ارسال شد'
//     };
//   }

//   // Verify code and complete registration/login
//   // For new users, also accepts: userType, firstName, lastName, companyName, economicCode
//   async verifyPhone(phone, code, userData = null) {
//     const user = await User.findOne({ phone });
    
//     if (!user) {
//       throw new Error('کاربر یافت نشد');
//     }

//     if (!user.phoneVerification || !user.phoneVerification.code) {
//       throw new Error('کد تایید ارسال نشده است');
//     }

//     if (user.phoneVerification.expiresAt < new Date()) {
//       throw new Error('کد تایید منقضی شده است');
//     }

//     if (user.phoneVerification.code !== code) {
//       user.phoneVerification.attempts += 1;
//       await user.save();

//       if (user.phoneVerification.attempts >= 5) {
//         throw new Error('تعداد تلاش‌های شما بیش از حد مجاز است');
//       }

//       throw new Error('کد تایید نادرست است');
//     }

//     // Clear verification code
//     user.phoneVerification = undefined;
//     user.verifications = user.verifications || {};
//     user.verifications.phone = true;

//     // If new user, update with provided data
//     const isNewUser = user.status === 'pending';
//     if (isNewUser && userData) {
//       user.firstName = userData.firstName || '';
//       user.lastName = userData.lastName || '';
//       user.userType = userData.userType || 'individual';
      
//       if (userData.userType === 'company') {
//         user.companyInfo = {
//           companyName: userData.companyName || '',
//           economicCode: userData.economicCode || '',
//         };
//       }
      
//       user.status = 'active';

//       // Create wallet for user
//       await Wallet.create({ user: user._id });

//       // Create free subscription
//       await Subscription.createFreeSubscription(user._id);
//     }

//     // Update login info
//     user.lastLogin = new Date();
//     user.loginCount = (user.loginCount || 0) + 1;

//     // Generate tokens
//     const tokens = generateTokens(user._id);
//     user.refreshToken = tokens.refreshToken;
//     await user.save();

//     return {
//       ...tokens,
//       user: this.sanitizeUser(user)
//     };
//   }

//   // Resend verification code
//   async resendVerificationCode(phone) {
//     const user = await User.findOne({ phone });
    
//     if (!user) {
//       throw new Error('کاربر یافت نشد');
//     }

//     const code = generateVerificationCode();
//     user.phoneVerification = {
//       code,
//       expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000),
//       attempts: 0
//     };
//     await user.save();

//     await kavenegar.sendVerificationCode(phone, code);

//     return { message: 'کد تایید جدید ارسال شد' };
//   }

//   // Legacy register (kept for backwards compatibility)
//   async register(phone, password, firstName = '', lastName = '') {
//     return this.login(phone);
//   }

//   // Forgot password
//   async forgotPassword(phone) {
//     const user = await User.findOne({ phone });
    
//     if (!user) {
//       // Don't reveal if user exists
//       return { message: 'اگر این شماره در سیستم موجود باشد، کد بازیابی ارسال خواهد شد' };
//     }

//     const code = generateVerificationCode();
//     user.passwordReset = {
//       token: code,
//       expiresAt: new Date(Date.now() + SYSTEM.VERIFICATION_CODE_EXPIRE * 1000)
//     };
//     await user.save();

//     await kavenegar.sendVerificationCode(phone, code);

//     return { message: 'کد بازیابی ارسال شد' };
//   }

//   // Reset password
//   async resetPassword(phone, code, newPassword) {
//     const user = await User.findOne({ phone });
    
//     if (!user) {
//       throw new Error('کاربر یافت نشد');
//     }

//     if (!user.passwordReset || !user.passwordReset.token) {
//       throw new Error('درخواست بازیابی رمز عبور یافت نشد');
//     }

//     if (user.passwordReset.expiresAt < new Date()) {
//       throw new Error('کد بازیابی منقضی شده است');
//     }

//     if (user.passwordReset.token !== code) {
//       throw new Error('کد بازیابی نادرست است');
//     }

//     user.password = newPassword;
//     user.passwordReset = undefined;
//     await user.save();

//     return { message: 'رمز عبور با موفقیت تغییر کرد' };
//   }

//   // Change password
//   async changePassword(userId, currentPassword, newPassword) {
//     const user = await User.findById(userId).select('+password');
    
//     if (!user) {
//       throw new Error('کاربر یافت نشد');
//     }

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       throw new Error('رمز عبور فعلی نادرست است');
//     }

//     user.password = newPassword;
//     await user.save();

//     return { message: 'رمز عبور با موفقیت تغییر کرد' };
//   }

//   // Refresh token
//   async refreshToken(refreshToken) {
//     const user = await User.findOne({ refreshToken });
    
//     if (!user) {
//       throw new Error('توکن نامعتبر است');
//     }

//     const tokens = generateTokens(user._id);
//     user.refreshToken = tokens.refreshToken;
//     await user.save();

//     return tokens;
//   }

//   // Logout
//   async logout(userId) {
//     await User.findByIdAndUpdate(userId, { refreshToken: null });
//     return { message: 'با موفقیت خارج شدید' };
//   }

//   // Sanitize user object
//   sanitizeUser(user) {
//     const userObj = user.toObject ? user.toObject() : user;
//     delete userObj.password;
//     delete userObj.refreshToken;
//     delete userObj.phoneVerification;
//     delete userObj.passwordReset;
//     return userObj;
//   }
// }

// module.exports = new AuthService();
