const { param } = require('express-validator');

const IDENTIFIER_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$/;

const publicIdentifierValidator = [
  param('identifier')
    .trim()
    .notEmpty().withMessage('شناسه عمومی کاربر الزامی است')
    .custom((value) => {
      const raw = String(value || '').trim();
      const isObjectId = /^[a-f\d]{24}$/i.test(raw);
      if (isObjectId || IDENTIFIER_REGEX.test(raw)) return true;
      throw new Error('شناسه عمومی کاربر نامعتبر است');
    })
];

const userIdValidator = [
  param('userId')
    .isMongoId().withMessage('شناسه کاربر نامعتبر است')
];

module.exports = {
  publicIdentifierValidator,
  userIdValidator,
};
