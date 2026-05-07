const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Create rate limiter with Redis store (if available)
const createRateLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip;
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// General API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Auth routes rate limiter (stricter)
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید.',
    code: 'AUTH_RATE_LIMIT'
  }
});

// Login rate limiter
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.',
    code: 'LOGIN_RATE_LIMIT'
  }
});

// SMS rate limiter
const smsLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: {
    success: false,
    message: 'لطفاً یک دقیقه صبر کنید و سپس مجدداً درخواست کنید.',
    code: 'SMS_RATE_LIMIT'
  }
});

// SMS daily limiter
const smsDailyLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    success: false,
    message: 'تعداد پیامک‌های درخواستی شما به حد روزانه رسیده است.',
    code: 'SMS_DAILY_LIMIT'
  }
});

// Payment rate limiter
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'تعداد درخواست‌های پرداخت شما بیش از حد مجاز است.',
    code: 'PAYMENT_RATE_LIMIT'
  }
});

// Upload rate limiter
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: 'تعداد آپلودهای شما بیش از حد مجاز است.',
    code: 'UPLOAD_RATE_LIMIT'
  }
});

// Message rate limiter
const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'تعداد پیام‌های ارسالی شما بیش از حد مجاز است.',
    code: 'MESSAGE_RATE_LIMIT'
  }
});

// Search rate limiter
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'تعداد جستجوهای شما بیش از حد مجاز است.',
    code: 'SEARCH_RATE_LIMIT'
  }
});

// Admin actions rate limiter
const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'تعداد درخواست‌های مدیریتی شما بیش از حد مجاز است.',
    code: 'ADMIN_RATE_LIMIT'
  }
});

// Slow down middleware for suspicious activity
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  maxDelayMs: 5000
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  loginLimiter,
  smsLimiter,
  smsDailyLimiter,
  paymentLimiter,
  uploadLimiter,
  messageLimiter,
  searchLimiter,
  adminLimiter,
  speedLimiter
};
