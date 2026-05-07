const logger = require('../utils/logger');

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?._id,
    ip: req.ip
  });
  
  next(err);
};

// Admin action logger
const adminActionLogger = (action) => {
  return (req, res, next) => {
    const AdminLog = require('../models/AdminLog');
    
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(body) {
      // Log admin action after response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AdminLog.log(
          req.user._id,
          action,
          req.params.type || 'system',
          req.params.id || null,
          `${action}: ${req.path}`,
          {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            changes: req.body
          }
        ).catch(err => logger.error('Failed to log admin action:', err));
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Audit logger for sensitive operations
const auditLogger = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(body) {
      const duration = Date.now() - startTime;
      
      logger.info('Audit log', {
        operation,
        userId: req.user?._id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        success: body?.success
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  requestLogger,
  errorLogger,
  adminActionLogger,
  auditLogger
};
