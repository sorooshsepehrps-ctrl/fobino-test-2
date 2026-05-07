const { USER_ROLES, USER_LEVELS } = require('../config/constants');

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    const userRoles = req.user.roles || ['user'];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی لازم برای این عملیات را ندارید'
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'برای دسترسی به این بخش باید وارد شوید'
    });
  }

  if (!req.user.roles.includes(USER_ROLES.ADMIN)) {
    return res.status(403).json({
      success: false,
      message: 'فقط مدیران سیستم به این بخش دسترسی دارند'
    });
  }

  next();
};

// Check if user is support
const isSupport = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'برای دسترسی به این بخش باید وارد شوید'
    });
  }

  const hasAccess = req.user.roles.includes(USER_ROLES.SUPPORT) || 
                   req.user.roles.includes(USER_ROLES.ADMIN);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'فقط پشتیبانان به این بخش دسترسی دارند'
    });
  }

  next();
};

// Check if user is judge
const isJudge = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'برای دسترسی به این بخش باید وارد شوید'
    });
  }

  const hasAccess = req.user.roles.includes(USER_ROLES.JUDGE) || 
                   req.user.roles.includes(USER_ROLES.ADMIN);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'فقط داوران به این بخش دسترسی دارند'
    });
  }

  next();
};

// Check if user is admin or support
const isAdminOrSupport = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'برای دسترسی به این بخش باید وارد شوید'
    });
  }

  const hasAccess = req.user.roles.includes(USER_ROLES.ADMIN) || 
                   req.user.roles.includes(USER_ROLES.SUPPORT);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی لازم برای این عملیات را ندارید'
    });
  }

  next();
};

// Check minimum user level
const requireLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    if (req.user.level < minLevel) {
      const levelNames = {
        1: 'تکمیل پروفایل',
        2: 'احراز هویت',
        3: 'تایید کسب‌وکار',
        4: 'تایید اطلاعات بانکی'
      };

      return res.status(403).json({
        success: false,
        message: `برای این عملیات باید سطح ${levelNames[minLevel] || minLevel} را تکمیل کنید`,
        requiredLevel: minLevel,
        currentLevel: req.user.level
      });
    }

    next();
  };
};

// Check if user is verified (at least level 2)
const isVerified = (req, res, next) => {
  return requireLevel(USER_LEVELS.IDENTITY)(req, res, next);
};

// Check if user owns the resource
const isOwner = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    // Admins can access any resource
    if (req.user.roles.includes(USER_ROLES.ADMIN)) {
      return next();
    }

    const resourceUserId = req.resource?.[resourceUserField]?.toString() || 
                          req.resource?.[resourceUserField];

    if (!resourceUserId || resourceUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مجاز به دسترسی به این منبع نیستید'
      });
    }

    next();
  };
};

// Check if user is participant in deal/chat
const isParticipant = (buyerField = 'buyer', sellerField = 'seller') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'برای دسترسی به این بخش باید وارد شوید'
      });
    }

    // Admins and support can access
    if (req.user.roles.includes(USER_ROLES.ADMIN) || 
        req.user.roles.includes(USER_ROLES.SUPPORT)) {
      return next();
    }

    const userId = req.user._id.toString();
    const buyerId = req.resource?.[buyerField]?.toString();
    const sellerId = req.resource?.[sellerField]?.toString();

    if (userId !== buyerId && userId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'شما در این معامله شرکت‌کننده نیستید'
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  isAdmin,
  isSupport,
  isJudge,
  isAdminOrSupport,
  requireLevel,
  isVerified,
  isOwner,
  isParticipant
};
