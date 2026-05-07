const path = require('path');

// App Constants
const APP_NAME = 'فوبینو';
const APP_VERSION = '1.0.0';
const COMPANY_NAME = 'فوبینو';
const SUPPORT_EMAIL = 'support@fobino.com';
const SUPPORT_PHONE = '02112345678';

// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';
const IS_TEST = NODE_ENV === 'test';

// Server Configuration
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const API_PREFIX = '/api/v1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this-too';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

// Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fobino';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// File Upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const UPLOAD_PATH = 'uploads';

// External Services
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';

// SMS Service
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'kavenegar';
const SMS_API_KEY = process.env.SMS_API_KEY;

// Email Service
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fobino.com';

// Additional quotas prices (in Rials)
const QUOTA_PRICES = {
  ACCESS_POSTS: 100000 // 10,000 Toman per contact
};

// Subscription Plans
// Backend is the source of truth for purchasable plans. `free` remains an
// internal fallback plan; only VIP and Producer are sold in the UI.
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'free',
    nameFa: 'رایگان',
    duration: 0, // Never expires
    price: 0,
    isPurchasable: false,
    sellPosts: -1, // Unlimited
    buyPosts: -1, // Unlimited
    accessToBuyPosts: 5, // 5 contacts per month
    consultationOnlineIncludedMinutes: 0,
    consultationInPersonEligible: false,
    badge: null,
    maxOffersVisible: 3,
    maxChatsPerPost: 5,
    features: [
      'unlimited_posts',
      'basic_profile',
      '5_contacts_per_month',
      'basic_support'
    ]
  },
  VIP: {
    name: 'vip',
    nameFa: 'ویژه',
    duration: 365, // 1 year
    price: 28000000, // 2,800,000 Toman (stored in IRR)
    isPurchasable: true,
    sellPosts: -1, // Unlimited
    buyPosts: -1, // Unlimited
    accessToBuyPosts: 85, // 85 contacts per month
    consultationOnlineIncludedMinutes: 20 * 60,
    consultationInPersonEligible: false,
    badge: 'vip',
    maxOffersVisible: 10,
    maxChatsPerPost: 20,
    features: [
      '85_contacts_per_month',
      'vip_badge',
      '20_hours_online_consultation',
      'priority_support'
    ]
  },
  PRODUCER: {
    name: 'producer',
    nameFa: 'تولیدکننده',
    duration: 365, // 1 year
    price: 100000000, // 10,000,000 Toman (stored in IRR)
    isPurchasable: true,
    sellPosts: -1, // Unlimited
    buyPosts: -1, // Unlimited
    accessToBuyPosts: 85, // 85 contacts per month
    consultationOnlineIncludedMinutes: 20 * 60,
    consultationInPersonEligible: true,
    badge: 'producer',
    maxOffersVisible: 20,
    maxChatsPerPost: 50,
    features: [
      '85_contacts_per_month',
      'producer_badge',
      '20_hours_online_consultation',
      'in_person_consultation_request',
      'producer_verification_flow'
    ]
  }
};


module.exports = {
  // App Info
  APP_NAME,
  APP_VERSION,
  COMPANY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,

  // Environment
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,

  // Server
  PORT,
  BASE_URL,
  API_PREFIX,
  CORS_ORIGIN,
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE,

  // Database
  MONGO_URI,
  REDIS_URL,

  // File Upload
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  UPLOAD_PATH,

  // External Services
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  ZARINPAL_MERCHANT_ID,
  ZARINPAL_SANDBOX,

  // SMS
  SMS_PROVIDER,
  SMS_API_KEY,

  // Email
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,

  // Subscription
  SUBSCRIPTION_PLANS,
  QUOTA_PRICES,

  // User Levels
  USER_LEVELS: {
    BASIC: 0,           // ثبت‌نام اولیه
    PROFILE: 1,         // تکمیل پروفایل
    IDENTITY: 2,        // احراز هویت
    BUSINESS: 3,        // مدارک کسب‌وکار
    BANK: 4             // اطلاعات بانکی
  },

  // User Roles
  USER_ROLES: {
    USER: 'user',
    SUPPORT: 'support',
    JUDGE: 'judge',
    ADMIN: 'admin'
  },

  // User Status
  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
    PENDING: 'pending'
  },

  // Post Types
  POST_TYPES: {
    SELL: 'sell',
    BUY: 'buy'
  },

  // Post Status
  POST_STATUS: {
    ACTIVE: 'active',
    PENDING: 'pending',
    SOLD: 'sold',
    EXPIRED: 'expired',
    DELETED: 'deleted',
    REJECTED: 'rejected'
  },

  // Chat Types
  CHAT_TYPES: {
    PRE_OFFER: 'pre_offer',
    POST_OFFER: 'post_offer',
    DEAL_NEGOTIATION: 'deal_negotiation',
    DEAL_EXECUTION: 'deal_execution',
    DISPUTE: 'dispute',
    SUPPORT: 'support'
  },

  // Chat Status
  CHAT_STATUS: {
    ACTIVE: 'active',
    CLOSED: 'closed',
    ARCHIVED: 'archived',
    BLOCKED: 'blocked'
  },

  // Offer Status
  OFFER_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COUNTERED: 'countered',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  },

  // Deal Status
  DEAL_STATUS: {
    PENDING: 'pending',
    OPEN: 'open',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CONFIRMED: 'confirmed',
    DISPUTED: 'disputed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  // Payment Methods
  PAYMENT_METHODS: {
    FOBINO_SECURE: 'fobino_secure',
    CREDIT: 'credit',
    TAHATOR: 'tahator',
    CASH: 'cash'
  },

  // Shipping Status
  SHIPPING_STATUS: {
    PENDING: 'pending',
    ESTIMATED: 'estimated',
    AGREED: 'agreed',
    DISAGREED: 'disagreed',
    SHIPPED: 'shipped',
    WAITING_FOR_FACTOR: 'waiting_for_factor',
    FACTORED: 'factored'
  },

  // Inspection Status
  INSPECTION_STATUS: {
    PENDING: 'pending',
    ESTIMATED: 'estimated',
    PAID: 'paid',
    INSPECTED: 'inspected',
    WAITING_FOR_FACTOR: 'waiting_for_factor',
    FACTORED: 'factored'
  },

  // Escrow Status
  ESCROW_STATUS: {
    PENDING: 'pending',
    DEPOSITED: 'deposited',
    RELEASED: 'released',
    REFUNDED: 'refunded',
    SPLIT: 'split'
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    PAYMENT: 'payment',
    REFUND: 'refund',
    COMMISSION: 'commission',
    ESCROW_DEPOSIT: 'escrow_deposit',
    ESCROW_RELEASE: 'escrow_release',
    SUBSCRIPTION: 'subscription',
    INVITATION: 'invitation'
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Dispute Status
  DISPUTE_STATUS: {
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_REVIEW: 'in_review',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  },

  // Dispute Decision
  DISPUTE_DECISION: {
    BUYER: 'buyer',
    SELLER: 'seller',
    SHARED: 'shared',
    CANCEL: 'cancel'
  },

  // Ticket Status
  TICKET_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    WAITING_USER: 'waiting_user',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  },

  // Ticket Priority
  TICKET_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Verification Status
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },

  // Currencies
  CURRENCIES: {
    IRR: 'IRR',   // Iranian Rial
    USD: 'USD',   // US Dollar
    EUR: 'EUR',   // Euro
    AED: 'AED',   // UAE Dirham
    TRY: 'TRY'    // Turkish Lira
  },

  // Payment Gateways
  PAYMENT_GATEWAYS: {
    ZARINPAL: 'zarinpal',
    IDPAY: 'idpay',
    NEXTPAY: 'nextpay',
    WALLET: 'wallet'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    NEW_MESSAGE: 'new_message',
    NEW_OFFER: 'new_offer',
    OFFER_ACCEPTED: 'offer_accepted',
    OFFER_REJECTED: 'offer_rejected',
    DEAL_CREATED: 'deal_created',
    DEAL_UPDATED: 'deal_updated',
    PAYMENT_RECEIVED: 'payment_received',
    PRODUCT_SHIPPED: 'product_shipped',
    DELIVERY_CONFIRMED: 'delivery_confirmed',
    DISPUTE_OPENED: 'dispute_opened',
    DISPUTE_RESOLVED: 'dispute_resolved',
    SUBSCRIPTION_EXPIRING: 'subscription_expiring',
    SUBSCRIPTION_EXPIRED: 'subscription_expired',
    VERIFICATION_APPROVED: 'verification_approved',
    VERIFICATION_REJECTED: 'verification_rejected',
    SYSTEM: 'system'
  },

  // Units
  UNITS: [
    { value: 'ton', label: 'تن' },
    { value: 'kg', label: 'کیلوگرم' },
    { value: 'gram', label: 'گرم' },
    { value: 'meter', label: 'متر' },
    { value: 'sqm', label: 'متر مربع' },
    { value: 'piece', label: 'عدد' },
    { value: 'pack', label: 'بسته' },
    { value: 'roll', label: 'رول' },
    { value: 'liter', label: 'لیتر' },
    { value: 'box', label: 'جعبه' }
  ],

  // Provinces of Iran
  PROVINCES: [
    'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز',
    'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی',
    'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
    'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان', 'کرمان',
    'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان',
    'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد'
  ],

  // System Settings
  SYSTEM: {
    FEE_PERCENT: 5,
    FOBINO_COMMISSION_PERCENT: 1, // 1% commission for fobino_secure deals
    MIN_WITHDRAWAL: 500000,
    MAX_WITHDRAWAL: 500000000,
    SMS_COST_PER_MESSAGE: 15000,
    INVITATION_COST_PER_MESSAGE: 15000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGES_PER_POST: 10,
    VERIFICATION_CODE_EXPIRE: 5 * 60, // 5 minutes
    DEAL_TIMER_DEFAULT_DAYS: 7,
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_BLOCK_DURATION: 60 * 60 // 1 hour
  }
};
