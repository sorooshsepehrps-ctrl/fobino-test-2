const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error
class NotFoundError extends AppError {
  constructor(message = 'منبع مورد نظر یافت نشد') {
    super(message, 404, 'NOT_FOUND');
  }
}

// Validation error
class ValidationError extends AppError {
  constructor(message = 'داده‌های ورودی نامعتبر است', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// Authentication error
class AuthError extends AppError {
  constructor(message = 'احراز هویت ناموفق بود') {
    super(message, 401, 'AUTH_ERROR');
  }
}

// Authorization error
class ForbiddenError extends AppError {
  constructor(message = 'شما دسترسی لازم را ندارید') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Conflict error
class ConflictError extends AppError {
  constructor(message = 'تداخل در داده‌ها') {
    super(message, 409, 'CONFLICT');
  }
}

// Rate limit error
class RateLimitError extends AppError {
  constructor(message = 'تعداد درخواست‌ها بیش از حد مجاز است') {
    super(message, 429, 'RATE_LIMIT');
  }
}

// Handle CastError (invalid MongoDB ObjectId)
const handleCastError = (err) => {
  const message = `شناسه نامعتبر: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Handle duplicate key error
const handleDuplicateError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const fieldNames = {
    phone: 'شماره تلفن',
    email: 'ایمیل',
    slug: 'نامک'
  };
  const message = `${fieldNames[field] || field} قبلاً ثبت شده است`;
  return new AppError(message, 400, 'DUPLICATE_ERROR');
};

// Handle validation error from MongoDB
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(e => ({
    field: e.path,
    message: e.message
  }));
  return new ValidationError('داده‌های ورودی نامعتبر است', errors);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AuthError('توکن نامعتبر است');
};

const handleJWTExpiredError = () => {
  return new AuthError('توکن منقضی شده است');
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?._id
  });

  // Handle specific error types
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  if (err.code === 11000) {
    error = handleDuplicateError(err);
  }

  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'خطای سرور',
    code: error.code || 'SERVER_ERROR'
  };

  // Include errors array for validation errors
  if (error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Async handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler
};
