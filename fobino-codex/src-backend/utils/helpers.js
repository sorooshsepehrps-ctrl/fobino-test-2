const crypto = require('crypto');

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random number
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate verification code
const generateVerificationCode = (length = 6) => {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)).toString();
};

// Paginate results
const paginate = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Create pagination response
const paginationResponse = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
};

// Slugify Persian text
const slugify = (text) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Convert Persian numbers to English
const persianToEnglish = (str) => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(persianNumbers[i], 'g'), i.toString());
    str = str.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
  }
  
  return str;
};

// Convert English numbers to Persian
const englishToPersian = (str) => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, (match) => persianNumbers[parseInt(match)]);
};

// Format price
const formatPrice = (price, currency = 'IRR') => {
  if (!price && price !== 0) return 'توافقی';
  
  const formatted = price.toLocaleString('fa-IR');
  
  const currencyLabels = {
    IRR: 'ریال',
    USD: 'دلار',
    EUR: 'یورو',
    AED: 'درهم'
  };
  
  return `${formatted} ${currencyLabels[currency] || currency}`;
};

// Format date to Persian
const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('fa-IR', options);
};

// Format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now - d) / 1000);
  
  if (diffInSeconds < 60) return 'لحظاتی پیش';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} روز پیش`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} هفته پیش`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ماه پیش`;
  return `${Math.floor(diffInSeconds / 31536000)} سال پیش`;
};

// Calculate days between dates
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Add days to date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Check if date is expired
const isExpired = (date) => {
  return new Date(date) < new Date();
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Pick specific fields from object
const pick = (obj, fields) => {
  return fields.reduce((acc, field) => {
    if (obj.hasOwnProperty(field)) {
      acc[field] = obj[field];
    }
    return acc;
  }, {});
};

// Omit specific fields from object
const omit = (obj, fields) => {
  const result = { ...obj };
  fields.forEach(field => delete result[field]);
  return result;
};

// Check if string is valid ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

// Calculate commission
const calculateCommission = (amount, rate = 5) => {
  return Math.floor(amount * (rate / 100));
};

// Mask phone number
const maskPhone = (phone) => {
  if (!phone || phone.length < 8) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
};

// Mask email
const maskEmail = (email) => {
  if (!email) return email;
  const [name, domain] = email.split('@');
  const maskedName = name.length > 2 
    ? name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
    : name;
  return `${maskedName}@${domain}`;
};

// Generate unique code
const generateUniqueCode = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Sleep function
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * (i + 1));
    }
  }
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  generateVerificationCode,
  paginate,
  paginationResponse,
  slugify,
  persianToEnglish,
  englishToPersian,
  formatPrice,
  formatDate,
  formatRelativeTime,
  daysBetween,
  addDays,
  isExpired,
  deepClone,
  pick,
  omit,
  isValidObjectId,
  calculatePercentage,
  calculateCommission,
  maskPhone,
  maskEmail,
  generateUniqueCode,
  sleep,
  retry
};
