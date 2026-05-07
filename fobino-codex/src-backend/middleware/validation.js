const { validationResult } = require('express-validator');
const Joi = require('joi');

// Express-validator middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'داده‌های ورودی نامعتبر است',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Joi validation middleware factory
const validateJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'داده‌های ورودی نامعتبر است',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

const newShemas= {
  pagination:Joi.object({
    page:Joi.number().integer().min(1).default(1),
    limit:Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string(),

  }),
  phone: Joi.string().pattern(/^09\d{9}$/).message('email is not correct')
      
}
// Common Joi schemas
const schemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Phone number
  phone: Joi.string()
    .pattern(/^09\d{9}$/)
    .message('شماره تلفن نامعتبر است'),

  // Email
  email: Joi.string()
    .email()
    .message('ایمیل نامعتبر است'),

  // Password
  password: Joi.string()
    .min(6)
    .message('رمز عبور باید حداقل ۶ کاراکتر باشد'),

  // ObjectId
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .message('شناسه نامعتبر است'),

  // Shaba
  shaba: Joi.string()
    .pattern(/^IR\d{24}$/)
    .message('شماره شبا نامعتبر است'),

  // Card number
  cardNumber: Joi.string()
    .pattern(/^\d{16}$/)
    .message('شماره کارت نامعتبر است'),

  // Price
  price: Joi.number()
    .min(0)
    .message('قیمت نمی‌تواند منفی باشد'),

  // Quantity
  quantity: Joi.number()
    .min(0)
    .message('مقدار نمی‌تواند منفی باشد'),

  // Registration
  register: Joi.object({
    phone: Joi.string().pattern(/^09\d{9}$/).required()
      .messages({
        'string.pattern.base': 'شماره تلفن نامعتبر است',
        'any.required': 'شماره تلفن الزامی است'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        'any.required': 'رمز عبور الزامی است'
      }),
    firstName: Joi.string().max(50)
      .messages({ 'string.max': 'نام نمی‌تواند بیش از ۵۰ کاراکتر باشد' }),
    lastName: Joi.string().max(50)
      .messages({ 'string.max': 'نام خانوادگی نمی‌تواند بیش از ۵۰ کاراکتر باشد' })
  }),

  // Login
  login: Joi.object({
    phone: Joi.string().pattern(/^09\d{9}$/).required()
      .messages({
        'string.pattern.base': 'شماره تلفن نامعتبر است',
        'any.required': 'شماره تلفن الزامی است'
      }),
    password: Joi.string().required()
      .messages({ 'any.required': 'رمز عبور الزامی است' })
  }),

  // Create Post
  createPost: Joi.object({
    type: Joi.string().valid('sell', 'buy').required()
      .messages({ 'any.required': 'نوع آگهی الزامی است' }),
    title: Joi.string().max(200).required()
      .messages({
        'string.max': 'عنوان نمی‌تواند بیش از ۲۰۰ کاراکتر باشد',
        'any.required': 'عنوان آگهی الزامی است'
      }),
    description: Joi.string().max(5000).required()
      .messages({
        'string.max': 'توضیحات نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد',
        'any.required': 'توضیحات آگهی الزامی است'
      }),
    category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({ 'any.required': 'دسته‌بندی الزامی است' }),
    subCategory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    pricePerUnit: Joi.number().min(0),
    unit: Joi.string().valid('ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box'),
    minOrder: Joi.number().min(0),
    availableQuantity: Joi.number().min(0),
    quantity: Joi.number().min(0),
    maxPricePerUnit: Joi.number().min(0),
    deliveryDays: Joi.number().min(1),
    paymentMethod: Joi.string().valid('cash', 'credit', 'both'),
    brand: Joi.string().max(100),
    specifications: Joi.object(),
    tags: Joi.array().items(Joi.string()),
    deliveryAddress: Joi.object({
      province: Joi.string(),
      city: Joi.string(),
      address: Joi.string()
    }),
    deliveryLocation: Joi.object({
      province: Joi.string(),
      city: Joi.string()
    })
  }),

  // Create Offer
  createOffer: Joi.object({
    pricePerUnit: Joi.number().min(0).required()
      .messages({ 'any.required': 'قیمت واحد الزامی است' }),
    quantity: Joi.number().min(0).required()
      .messages({ 'any.required': 'مقدار الزامی است' }),
    unit: Joi.string().valid('ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box').required(),
    deliveryDays: Joi.number().min(1).required()
      .messages({ 'any.required': 'مدت تحویل الزامی است' }),
    paymentMethod: Joi.string().valid('cash', 'credit', 'installment'),
    terms: Joi.string().max(2000),
    notes: Joi.string().max(1000),
    deliveryAddress: Joi.object({
      province: Joi.string(),
      city: Joi.string(),
      address: Joi.string()
    })
  }),

  // Create Deal
  createDeal: Joi.object({
    offerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({ 'any.required': 'شناسه پیشنهاد الزامی است' }),
    deliveryAddress: Joi.object({
      province: Joi.string().required(),
      city: Joi.string().required(),
      address: Joi.string().required(),
      postalCode: Joi.string(),
      receiverName: Joi.string(),
      receiverPhone: Joi.string().pattern(/^09\d{9}$/)
    })
  }),

  // Withdrawal
  withdrawal: Joi.object({
    amount: Joi.number().min(500000).required()
      .messages({
        'number.min': 'حداقل مبلغ برداشت ۵۰۰,۰۰۰ ریال است',
        'any.required': 'مبلغ الزامی است'
      }),
    shaba: Joi.string().pattern(/^IR\d{24}$/).required()
      .messages({
        'string.pattern.base': 'شماره شبا نامعتبر است',
        'any.required': 'شماره شبا الزامی است'
      }),
    bankName: Joi.string().required()
      .messages({ 'any.required': 'نام بانک الزامی است' }),
    accountHolder: Joi.string().required()
      .messages({ 'any.required': 'نام صاحب حساب الزامی است' })
  })
};

module.exports = {
  validate,
  validateJoi,
  schemas
};
