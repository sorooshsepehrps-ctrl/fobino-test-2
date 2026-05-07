/* backend/src/validators/chatValidator.js */
const { body, param, query } = require('express-validator');

// Define all validators first, then export them
const chatIdValidator = [
  param('id')  // ← Changed from 'chatId' to 'id' to match route parameter
    .notEmpty().withMessage('شناسه گفتگو الزامی است')
    .isMongoId().withMessage('شناسه گفتگو نامعتبر است')
    .customSanitizer(value => {
      console.log('Validating chat ID:', value); // Optional debug
      return value;
    })
];

const postIdValidator = [
  param('postId')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است')
];

const createChatValidator = [
  body('postId')
    .notEmpty().withMessage('شناسه آگهی الزامی است')
    .isMongoId().withMessage('شناسه آگهی نامعتبر است'),
  
  body('initialMessage')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('پیام اولیه باید بین ۱ تا ۱۰۰۰ کاراکتر باشد')
];

const sendMessageValidator = [
  body('content')
    .notEmpty().withMessage('متن پیام الزامی است')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('پیام باید بین ۱ تا ۵۰۰۰ کاراکتر باشد'),
  
  body('type')
    .optional()
    .isIn(['text', 'image', 'offer', 'deal']).withMessage('نوع پیام نامعتبر است'),
  
  body('replyTo')
    .optional()
    .isMongoId().withMessage('شناسه پاسخ نامعتبر است')
];

const quickChatValidator = [
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('پیام باید بین ۱ تا ۱۰۰۰ کاراکتر باشد')
];

const setTypingValidator = [
  body('isTyping')
    .notEmpty().withMessage('وضعیت تایپ الزامی است')
    .isBoolean().withMessage('وضعیت تایپ باید true یا false باشد')
];

const closeChatValidator = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('دلیل بستن گفتگو نمی‌تواند بیش از ۵۰۰ کاراکتر باشد')
];

module.exports = {
  chatIdValidator,
  postIdValidator,
  createChatValidator,
  sendMessageValidator,
  quickChatValidator,
  setTypingValidator,
  closeChatValidator
};