const { body, param, query } = require('express-validator');

const createDealValidator = [
  body('offerId')
    .notEmpty().withMessage('شناسه پیشنهاد الزامی است')
    .isMongoId().withMessage('شناسه پیشنهاد نامعتبر است'),
  
  body('deliveryAddress')
    .optional()
    .isObject().withMessage('آدرس تحویل باید یک شیء باشد'),
  
  body('deliveryAddress.province')
    .optional()
    .trim()
    .notEmpty().withMessage('استان الزامی است'),
  
  body('deliveryAddress.city')
    .optional()
    .trim()
    .notEmpty().withMessage('شهر الزامی است'),
  
  body('deliveryAddress.address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('آدرس نمی‌تواند بیش از ۵۰۰ کاراکتر باشد'),
  
  body('deliveryAddress.postalCode')
    .optional()
    .trim()
    .matches(/^\d{10}$/).withMessage('کد پستی نامعتبر است'),
  
  body('deliveryAddress.receiverName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('نام گیرنده نمی‌تواند بیش از ۱۰۰ کاراکتر باشد'),
  
  body('deliveryAddress.receiverPhone')
    .optional()
    .matches(/^09\d{9}$/).withMessage('شماره تلفن گیرنده نامعتبر است')
];

const dealIdValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است')
];

const confirmDealValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  
  body('qualityScore')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('امتیاز کیفیت باید بین ۱ تا ۱۰۰ باشد'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('نظر نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد')
];

const shipDealValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  
  body('trackingNumber')
    .notEmpty().withMessage('کد پیگیری الزامی است')
    .trim(),
  
  body('carrier')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('نام حامل نمی‌تواند بیش از ۱۰۰ کاراکتر باشد')
];

const extendDealValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  
  body('extraDays')
    .notEmpty().withMessage('تعداد روز اضافی الزامی است')
    .isInt({ min: 1, max: 30 }).withMessage('تعداد روز اضافی باید بین ۱ تا ۳۰ باشد'),
  
  body('reason')
    .notEmpty().withMessage('دلیل تمدید الزامی است')
    .trim()
    .isLength({ max: 500 }).withMessage('دلیل نمی‌تواند بیش از ۵۰۰ کاراکتر باشد')
];

const cancelDealValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  
  body('reason')
    .notEmpty().withMessage('دلیل لغو الزامی است')
    .trim()
    .isLength({ max: 500 }).withMessage('دلیل نمی‌تواند بیش از ۵۰۰ کاراکتر باشد')
];

const rateDealValidator = [
  param('id')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  
  body('rating')
    .notEmpty().withMessage('امتیاز الزامی است')
    .isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  
  body('qualityScore')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('امتیاز کیفیت باید بین ۱ تا ۱۰۰ باشد'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('نظر نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد')
];

const listDealsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('تعداد در هر صفحه باید بین ۱ تا ۱۰۰ باشد'),
  
  query('status')
    .optional()
    .isIn([
      'pending_payment', 'payment_received', 'in_progress',
      'shipped', 'delivered', 'completed', 'disputed', 'cancelled', 'refunded'
    ]).withMessage('وضعیت نامعتبر است'),
  
  query('role')
    .optional()
    .isIn(['buyer', 'seller']).withMessage('نقش نامعتبر است')
];

module.exports = {
  createDealValidator,
  dealIdValidator,
  confirmDealValidator,
  shipDealValidator,
  extendDealValidator,
  cancelDealValidator,
  rateDealValidator,
  listDealsValidator
};
