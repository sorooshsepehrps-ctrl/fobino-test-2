// Input sanitization middleware
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potential XSS characters
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      // Skip MongoDB operators
      if (key.startsWith('$')) continue;
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};

// Middleware to sanitize request body and query
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Middleware to prevent NoSQL injection
const preventNoSQLInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (obj === null || obj === undefined) return false;
    
    if (typeof obj === 'string') {
      // Check for common injection patterns
      const patterns = [
        /\$where/i,
        /\$regex/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$or/i,
        /\$and/i
      ];
      return patterns.some(pattern => pattern.test(obj));
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForInjection);
    }
    
    if (typeof obj === 'object') {
      // Check keys for $ operators
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$')) return true;
        if (checkForInjection(obj[key])) return true;
      }
    }
    
    return false;
  };
  
  if (checkForInjection(req.body) || checkForInjection(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'درخواست نامعتبر'
    });
  }
  
  next();
};

// Middleware to escape HTML in response
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
};

// Validate and sanitize phone number
const sanitizePhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('98')) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  // Validate Iranian mobile number
  if (/^09\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
};

// Validate and sanitize email
const sanitizeEmail = (email) => {
  if (!email) return null;
  
  const sanitized = email.toLowerCase().trim();
  
  // Basic email validation
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return sanitized;
  }
  
  return null;
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  preventNoSQLInjection,
  escapeHtml,
  sanitizePhone,
  sanitizeEmail
};
