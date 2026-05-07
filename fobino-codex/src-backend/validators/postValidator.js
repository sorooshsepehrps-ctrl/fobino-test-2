const { body, param, query } = require('express-validator');

const createPostValidator = [
  body('type')
    .notEmpty().withMessage('نوع آگهی الزامی است')
    .isIn(['sell', 'buy']).withMessage('نوع آگهی نامعتبر است'),
  
  body('title')
    .notEmpty().withMessage('عنوان آگهی الزامی است')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('عنوان باید بین ۵ تا ۲۰۰ کاراکتر باشد'),
  
  body('description')
    .notEmpty().withMessage('توضیحات آگهی الزامی است')
    .trim()
    .isLength({ min: 20, max: 5000 }).withMessage('توضیحات باید بین ۲۰ تا ۵۰۰۰ کاراکتر باشد'),
  
  body('categoryLevel1')
    .notEmpty().withMessage('دسته‌بندی سطح ۱ الزامی است')
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۱ نامعتبر است'),
  
  body('categoryLevel2')
    .optional()
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۲ نامعتبر است'),
  
  body('categoryLevel3')
    .optional()
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۳ نامعتبر است'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'pending']).withMessage('وضعیت نامعتبر است'),
  
  // === SELL POST VALIDATION ===
  body('productName')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('نام محصول برای آگهی فروش الزامی است')
    .trim()
    .isLength({ max: 100 }).withMessage('نام محصول نمی‌تواند بیش از ۱۰۰ کاراکتر باشد'),
  
  body('brand')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('برند محصول برای آگهی فروش الزامی است')
    .trim()
    .isLength({ max: 50 }).withMessage('برند نمی‌تواند بیش از ۵۰ کاراکتر باشد'),
  
  body('productType')
    .optional()
    .isIn(['new', 'used', 'refurbished', 'wholesale', 'retail'])
    .withMessage('نوع محصول نامعتبر است'),
  
  body('province')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('استان برای آگهی فروش الزامی است')
    .trim(),
  
  body('city')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('شهر برای آگهی فروش الزامی است')
    .trim(),
  
  body('unit')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('واحد محصول برای آگهی فروش الزامی است')
    .isIn(['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box', 'container', 'pallet'])
    .withMessage('واحد نامعتبر است'),
  
  body('availableQuantity')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('میزان موجودی برای آگهی فروش الزامی است')
    .isFloat({ min: 0 }).withMessage('میزان موجودی باید عدد مثبت باشد'),
  
  body('minOrder')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('حداقل سفارش برای آگهی فروش الزامی است')
    .isFloat({ min: 0 }).withMessage('حداقل سفارش باید عدد مثبت باشد'),
  
  body('minPricePerUnit')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('حداقل قیمت برای آگهی فروش الزامی است')
    .isFloat({ min: 0 }).withMessage('حداقل قیمت باید عدد مثبت باشد'),
  
  body('maxPricePerUnit')
    .if(body('type').equals('sell'))
    .notEmpty().withMessage('حداکثر قیمت برای آگهی فروش الزامی است')
    .isFloat({ min: 0 }).withMessage('حداکثر قیمت باید عدد مثبت باشد'),
  
  body('dropShipping')
    .optional()
    .isBoolean().withMessage('دراپ شیپینگ باید true یا false باشد'),
  
  body('needsMarketer')
    .optional()
    .isBoolean().withMessage('نیاز به بازاریاب باید true یا false باشد'),
  
  body('marketerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('درصد بازاریاب باید بین ۰ تا ۱۰۰ باشد'),
  
  body('hasDiscount')
    .optional()
    .isBoolean().withMessage('تخفیف باید true یا false باشد'),
  
  body('discountPercentage')
    .if(body('hasDiscount').equals('true'))
    .isFloat({ min: 0, max: 100 }).withMessage('درصد تخفیف باید بین ۰ تا ۱۰۰ باشد'),
  
  body('discountUntil')
    .if(body('hasDiscount').equals('true'))
    .isISO8601().withMessage('تاریخ تخفیف باید معتبر باشد'),
  
  // === BUY POST VALIDATION ===
  body('neededProductName')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('نام محصول مورد نیاز برای آگهی خرید الزامی است')
    .trim()
    .isLength({ max: 100 }).withMessage('نام محصول مورد نیاز نمی‌تواند بیش از ۱۰۰ کاراکتر باشد'),
  
  body('neededProductType')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('نوع محصول مورد نیاز برای آگهی خرید الزامی است')
    .trim()
    .isLength({ max: 100 }).withMessage('نوع محصول مورد نیاز نمی‌تواند بیش از ۱۰۰ کاراکتر باشد'),
  
  body('neededQuantity')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('میزان نیازمندی برای آگهی خرید الزامی است')
    .isFloat({ min: 0 }).withMessage('میزان نیازمندی باید عدد مثبت باشد'),
  
  body('neededUnit')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('واحد محصول برای آگهی خرید الزامی است')
    .isIn(['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box', 'container', 'pallet'])
    .withMessage('واحد نامعتبر است'),
  
  body('usageType')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('نوع مصرف برای آگهی خرید الزامی است')
    .isIn(['domestic', 'commercial', 'export']).withMessage('نوع مصرف نامعتبر است'),
  
  body('requestExpiry')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('تاریخ انقضای درخواست برای آگهی خرید الزامی است')
    .isISO8601().withMessage('تاریخ انقضا باید معتبر باشد')
    .custom(value => new Date(value) > new Date()).withMessage('تاریخ انقضا باید در آینده باشد'),
  
  body('paymentMethods')
    .optional()
    .isArray().withMessage('روش‌های پرداخت باید آرایه باشد'),
  
  body('paymentMethods.*')
    .optional()
    .isIn(['cash', 'fobino_secure', 'installment', 'credit', 'other'])
    .withMessage('روش پرداخت نامعتبر است'),
  
  body('deliveryProvince')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('استان تحویل برای آگهی خرید الزامی است')
    .trim(),
  
  body('deliveryCity')
    .if(body('type').equals('buy'))
    .notEmpty().withMessage('شهر تحویل برای آگهی خرید الزامی است')
    .trim(),
  
  body('maxBudget')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداکثر بودجه باید عدد مثبت باشد'),
  
  // Key features validation
  body('keyFeatures')
    .optional()
    .isArray().withMessage('ویژگی‌های کلیدی باید آرایه باشد'),
  
  body('keyFeatures.*')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('ویژگی کلیدی نمی‌تواند بیش از ۱۰۰ کاراکتر باشد'),
  
  // Keywords validation
  body('keywords')
    .optional()
    .isArray().withMessage('کلمات کلیدی باید آرایه باشد'),
  
  body('keywords.*')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('هر کلمه کلیدی نمی‌تواند بیش از ۵۰ کاراکتر باشد'),
  
  // Expiry
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('تاریخ انقضا باید معتبر باشد')
    .custom(value => new Date(value) > new Date()).withMessage('تاریخ انقضا باید در آینده باشد'),
  
  // International validation
  // body('isInternational')
  //   .optional()
  //   .isBoolean().withMessage('بین‌المللی باید true یا false باشد'),
  
  // body('currencies')
  //   .optional()
  //   .isArray().withMessage('ارزها باید آرایه باشد'),
  
  // body('currencies.*.currency')
  //   .optional()
  //   .isIn(['IRR', 'USD', 'EUR', 'AED', 'TRY']).withMessage('ارز نامعتبر است'),
  
  // body('currencies.*.price')
  //   .optional()
  //   .isFloat({ min: 0 }).withMessage('قیمت باید عدد مثبت باشد')
];

const updatePostValidator = [
  param('id')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('عنوان باید بین ۵ تا ۲۰۰ کاراکتر باشد'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 }).withMessage('توضیحات باید بین ۲۰ تا ۵۰۰۰ کاراکتر باشد'),
  
  body('minPricePerUnit')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداقل قیمت باید عدد مثبت باشد'),
  
  body('maxPricePerUnit')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداکثر قیمت باید عدد مثبت باشد'),
  
  body('availableQuantity')
    .optional()
    .isFloat({ min: 0 }).withMessage('موجودی باید عدد مثبت باشد'),
  
  body('minOrder')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداقل سفارش باید عدد مثبت باشد'),
  
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('درصد تخفیف باید بین ۰ تا ۱۰۰ باشد'),
  
  body('discountUntil')
    .optional()
    .isISO8601().withMessage('تاریخ تخفیف باید معتبر باشد'),
  
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('تاریخ انقضا باید معتبر باشد')
    .custom(value => new Date(value) > new Date()).withMessage('تاریخ انقضا باید در آینده باشد'),
  
  body('status')
    .optional()
    .isIn(['draft', 'active', 'sold', 'expired']).withMessage('وضعیت نامعتبر است')
];

const postIdValidator = [
  param('id')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است')
];

const listPostsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('تعداد در هر صفحه باید بین ۱ تا ۱۰۰ باشد'),
  
  query('type')
    .optional()
    .isIn(['sell', 'buy']).withMessage('نوع آگهی نامعتبر است'),
  
  query('categoryLevel1')
    .optional()
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۱ نامعتبر است'),
  
  query('categoryLevel2')
    .optional()
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۲ نامعتبر است'),
  
  query('categoryLevel3')
    .optional()
    .isMongoId().withMessage('شناسه دسته‌بندی سطح ۳ نامعتبر است'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداقل قیمت باید عدد مثبت باشد'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('حداکثر قیمت باید عدد مثبت باشد'),
  
  query('province')
    .optional()
    .trim(),
  
  query('city')
    .optional()
    .trim(),
  
  query('sort')
    .optional()
    .isIn(['priority', 'newest', 'cheapest', 'expensive', 'ending', 'popular'])
    .withMessage('مرتب‌سازی نامعتبر است'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('ترتیب مرتب‌سازی نامعتبر است'),
  
  query('status')
    .optional()
    .isIn(['active', 'pending', 'sold', 'expired', 'draft', 'all'])
    .withMessage('وضعیت نامعتبر است'),
  
  query('nardeban')
    .optional()
    .isBoolean().withMessage('نردبان باید true یا false باشد'),
  
  query('special')
    .optional()
    .isBoolean().withMessage('ویژه باید true یا false باشد'),
  
  query('featured')
    .optional()
    .isBoolean().withMessage('برگزیده باید true یا false باشد')
];

const searchPostsValidator = [
  query('q')
    .notEmpty().withMessage('عبارت جستجو الزامی است')
    .trim()
    .isLength({ min: 2 }).withMessage('عبارت جستجو باید حداقل ۲ کاراکتر باشد'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('تعداد در هر صفحه باید بین ۱ تا ۱۰۰ باشد')
];

const nardebanValidator = [
  param('id')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است'),
  
  body('duration')
    .optional()
    .isInt({ min: 1, max: 168 }).withMessage('مدت زمان باید بین ۱ تا ۱۶۸ ساعت باشد')
];

const specialValidator = [
  param('id')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است'),
  
  body('duration')
    .optional()
    .isInt({ min: 1, max: 720 }).withMessage('مدت زمان باید بین ۱ تا ۷۲۰ ساعت باشد')
];

const extendPostValidator = [
  param('id')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است'),
  
  body('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('تعداد روز باید بین ۱ تا ۳۶۵ باشد')
];

module.exports = {
  createPostValidator,
  updatePostValidator,
  postIdValidator,
  listPostsValidator,
  searchPostsValidator,
  nardebanValidator,
  specialValidator,
  extendPostValidator
};
