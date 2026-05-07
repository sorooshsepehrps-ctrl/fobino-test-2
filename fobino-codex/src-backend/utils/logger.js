const winston = require('winston');
const path = require('path');

// Custom JSON stringifier that handles circular references
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      
      // Handle special objects
      if (value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          name: value.name
        };
      }
      
      // Remove sensitive data
      if (value.password || value.token) {
        return '[Sensitive Data]';
      }
    }
    return value;
  });
};

// Custom formatter to avoid circular references
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    
    // Safely stringify the rest object
    let restString = '';
    if (Object.keys(rest).length > 0) {
      try {
        // Handle circular references
        restString = safeStringify(rest);
      } catch (error) {
        restString = `[Stringify Error: ${error.message}]`;
      }
    }
    
    return `${timestamp} ${level.toUpperCase()}: ${message} ${restString}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add a stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;