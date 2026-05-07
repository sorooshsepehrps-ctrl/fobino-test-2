const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', subscriptionController.getPlans);
router.get('/verify', subscriptionController.verifyPayment);

// Protected routes
router.get('/my', protect, subscriptionController.getMySubscription);
router.get('/me', protect, subscriptionController.getMySubscription);
router.get('/limits', protect, subscriptionController.checkLimits);
router.get('/usage', protect, subscriptionController.getUsage);
router.get('/contact-access', protect, subscriptionController.checkContactAccess);
router.post('/purchase', protect, subscriptionController.purchase);
router.post('/purchase-contact-quota', protect, subscriptionController.purchaseContactQuota);
router.post('/upgrade', protect, subscriptionController.upgrade);
router.post('/cancel', protect, subscriptionController.cancel);
router.post('/extra', protect, subscriptionController.purchaseExtra);
router.post('/quota', protect, subscriptionController.purchaseExtra);

module.exports = router;
