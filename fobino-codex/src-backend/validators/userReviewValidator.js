const { body, param, query } = require('express-validator');

const createReviewValidator = [
  body('dealId')
    .notEmpty().withMessage('شناسه معامله الزامی است')
    .isMongoId().withMessage('شناسه معامله نامعتبر است'),
  body('rating')
    .notEmpty().withMessage('امتیاز الزامی است')
    .isInt({ min: 1, max: 5 }).withMessage('امتیاز باید بین ۱ تا ۵ باشد'),
  body('text')
    .notEmpty().withMessage('متن نظر الزامی است')
    .trim()
    .isLength({ min: 3, max: 1000 }).withMessage('متن نظر باید بین ۳ تا ۱۰۰۰ کاراکتر باشد')
];

const userReviewsValidator = [
  param('userId')
    .isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('تعداد در هر صفحه باید بین ۱ تا ۵۰ باشد'),
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('فیلتر امتیاز باید بین ۱ تا ۵ باشد')
];

const dealReviewEligibilityValidator = [
  param('dealId')
    .isMongoId().withMessage('شناسه معامله نامعتبر است')
];

module.exports = {
  createReviewValidator,
  userReviewsValidator,
  dealReviewEligibilityValidator
};
