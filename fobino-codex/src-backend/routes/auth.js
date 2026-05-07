const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { registerValidator, loginValidator, verifyCodeValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator } = require('../validators/authValidator');
const { loginLimiter, smsLimiter, smsDailyLimiter } = require('../middleware/rateLimit');

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginLimiter, loginValidator, validate, authController.login);
router.post('/verify', verifyCodeValidator, validate, authController.verify);
router.post('/resend-code', smsLimiter, smsDailyLimiter, authController.resendCode);
router.post('/forgot-password', smsLimiter, smsDailyLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
router.post('/change-password', protect, changePasswordValidator, validate, authController.changePassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
