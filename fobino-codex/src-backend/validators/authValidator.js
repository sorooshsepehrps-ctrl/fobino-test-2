const { body, param, query } = require('express-validator');

const registerValidator = [
  body('phone')
    .notEmpty().withMessage('شماره تلفن الزامی است')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن نامعتبر است'),
  
  body('password')
    .notEmpty().withMessage('رمز عبور الزامی است')
    .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('نام نمی‌تواند بیش از ۵۰ کاراکتر باشد'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('نام خانوادگی نمی‌تواند بیش از ۵۰ کاراکتر باشد')
];

const loginValidator = [
  body('phone')
    .notEmpty().withMessage('شماره تلفن الزامی است')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن نامعتبر است')
];

const verifyCodeValidator = [
  body('phone')
    .notEmpty().withMessage('شماره تلفن الزامی است')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن نامعتبر است'),
  
  body('code')
    .notEmpty().withMessage('کد تایید الزامی است')
    .isLength({ min: 6, max: 6 }).withMessage('کد تایید باید ۶ رقم باشد')
];

const forgotPasswordValidator = [
  body('phone')
    .notEmpty().withMessage('شماره تلفن الزامی است')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن نامعتبر است')
];

const resetPasswordValidator = [
  body('phone')
    .notEmpty().withMessage('شماره تلفن الزامی است')
    .matches(/^09\d{9}$/).withMessage('شماره تلفن نامعتبر است'),
  
  body('code')
    .notEmpty().withMessage('کد تایید الزامی است')
    .isLength({ min: 6, max: 6 }).withMessage('کد تایید باید ۶ رقم باشد'),
  
  body('newPassword')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد')
];

const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('توکن بازیابی الزامی است')
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('رمز عبور فعلی الزامی است'),
  
  body('newPassword')
    .notEmpty().withMessage('رمز عبور جدید الزامی است')
    .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد')
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
  changePasswordValidator
};
