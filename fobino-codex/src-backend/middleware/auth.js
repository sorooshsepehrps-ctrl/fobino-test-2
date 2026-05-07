
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DropshippingAgreement = require('../models/DropshippingAgreement');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'کاربر یافت نشد'
        });
      }

      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          message: 'حساب کاربری شما مسدود شده است',
          banInfo: user.banInfo
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'حساب کاربری شما به حالت تعلیق درآمده است'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'توکن منقضی شده است',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (error) {}
    }

    next();
  } catch (error) {
    next();
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'توکن بازیابی الزامی است'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'توکن بازیابی نامعتبر است'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'توکن بازیابی منقضی شده است'
      });
    }
  } catch (error) {
    logger.error('Refresh token middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });

  return { accessToken, refreshToken };
};

const verifyPhoneCode = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن و کد تایید الزامی است'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    if (!user.phoneVerification || !user.phoneVerification.code) {
      return res.status(400).json({
        success: false,
        message: 'کد تایید ارسال نشده است'
      });
    }

    if (user.phoneVerification.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'کد تایید منقضی شده است'
      });
    }

    if (user.phoneVerification.code !== code) {
      user.phoneVerification.attempts += 1;
      await user.save();

      if (user.phoneVerification.attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'تعداد تلاش‌های شما بیش از حد مجاز است'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'کد تایید نادرست است'
      });
    }

    user.phoneVerification = undefined;
    user.verifications.phone = true;
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    logger.error('Phone verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    if (!roles.includes(req.user.role) && !roles.some((role) => req.user.roles?.includes(role))) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید'
      });
    }

    next();
  };
};

const restrictDropshippingTo = (...types) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    const agreements = await DropshippingAgreement.find({
      user: req.user._id,
      role: { $in: types }
    });

    const hasRoleAccess = types.some((type) => {
      if (type === 'provider') return req.user.isProvider;
      if (type === 'dropshipper') return req.user.isDropshipper;
      return false;
    });

    if (!hasRoleAccess) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش را ندارید'
      });
    }

    const activeAgreement = agreements.find((agreement) => agreement.status === 'active');
    if (!activeAgreement) {
      const suspendedAgreement = agreements.find((agreement) => agreement.status === 'suspended');
      if (suspendedAgreement) {
        return res.status(403).json({
          success: false,
          message: 'دسترسی دراپ‌شیپینگ شما در حال حاضر تعلیق شده است'
        });
      }

      return res.status(403).json({
        success: false,
        message: 'احراز هویت دراپ‌شیپینگ شما تکمیل نشده است'
      });
    }

    req.dropshippingAgreement = activeAgreement;
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  verifyRefreshToken,
  generateTokens,
  verifyPhoneCode,
  restrictTo,
  restrictDropshippingTo
};
