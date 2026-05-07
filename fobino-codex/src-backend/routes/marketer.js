const express = require('express');
const router = express.Router();
const {
  requestMarketerVerification,
  approveMarketerVerification,
  rejectMarketerVerification,
  getPendingMarketerRequests,
  getMyMarketerStatus
} = require('../controllers/marketerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.post('/request-verification', protect, requestMarketerVerification);

router.get('/my-status', protect, getMyMarketerStatus);

router.get('/pending-requests', protect, authorize('admin'), getPendingMarketerRequests);

router.post('/:userId/approve', protect, authorize('admin'), approveMarketerVerification);

router.post('/:userId/reject', protect, authorize('admin'), rejectMarketerVerification);

module.exports = router;
