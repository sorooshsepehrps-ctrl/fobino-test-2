const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const shippingController = require('../controllers/shippingController');
const inspectionController = require('../controllers/inspectionController');
const adminProducerVerificationController = require('../controllers/adminProducerVerificationController');
const { protect } = require('../middleware/auth');
const { isAdmin, isAdminOrSupport } = require('../middleware/roles');
const { adminLimiter } = require('../middleware/rateLimit');

router.use(protect, isAdmin, adminLimiter);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Verification
router.get('/verifications', adminController.getVerificationRequests);
router.post('/verifications/:id/approve', adminController.approveVerification);
router.post('/verifications/:id/reject', adminController.rejectVerification);


// Producer verification management
router.get('/producer-verifications', adminProducerVerificationController.list);
router.get('/producer-verifications/:id', adminProducerVerificationController.getOne);
router.patch('/producer-verifications/:id/level/:level/approve', adminProducerVerificationController.approveLevel);
router.patch('/producer-verifications/:id/level/:level/reject', adminProducerVerificationController.rejectLevel);
router.patch('/producer-verifications/:id/level/:level/request-resubmit', adminProducerVerificationController.requestResubmit);
router.patch('/producer-verifications/:id/level/3/schedule', adminProducerVerificationController.scheduleVisit);
router.patch('/producer-verifications/:id/level/3/mark-visited', adminProducerVerificationController.markVisited);
router.post('/producer-verifications/:id/notes', adminProducerVerificationController.addNote);

// Posts
router.get('/posts', adminController.getPosts);
router.put('/posts/:id', adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);

// Financial
router.get('/withdrawals', adminController.getWithdrawals);
router.post('/withdrawals/:id/process', adminController.processWithdrawal);

// Shipping management
router.get('/shipping', shippingController.getShippingRequests);
router.post('/shipping/:id/estimate', shippingController.estimateShippingPrice);
router.post('/shipping/:id/ship', shippingController.adminShipOrder);
router.post('/shipping/:id/factor', shippingController.uploadShippingFactor);

// Inspection management
router.get('/inspections', inspectionController.getInspectionRequests);
router.post('/inspections/:id/estimate', inspectionController.estimateInspectionPrice);
router.post('/inspections/:id/result', inspectionController.provideInspectionResult);
router.post('/inspections/:id/factor', inspectionController.uploadInspectionFactor);



router.patch(
  '/withdrawals/:transactionId/approve',
  adminController.approveWithdrawal
);

router.patch(
  '/withdrawals/:transactionId/reject',
 
  adminController.rejectWithdrawal
);




module.exports = router;



















