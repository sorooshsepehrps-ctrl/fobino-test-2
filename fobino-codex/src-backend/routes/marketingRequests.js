const express = require('express');
const router = express.Router();
const {
  createMarketingRequest,
  getMyMarketingRequests,
  getMarketingRequestById,
  updateMarketingRequest,
  deleteMarketingRequest,
  getAllMarketingRequestsForMarketers,
  acceptMarketingRequest,
  getMyAcceptedRequests
} = require('../controllers/marketingRequestController');
const { protect } = require('../middleware/auth');
const { uploadMarketingRequest } = require('../middleware/upload');

router.post('/', protect, uploadMarketingRequest, createMarketingRequest);

router.get('/my-requests', protect, getMyMarketingRequests);

router.get('/accepted-requests', protect, getMyAcceptedRequests);

router.get('/for-marketers', protect, getAllMarketingRequestsForMarketers);

router.get('/:id', protect, getMarketingRequestById);

router.put('/:id', protect, updateMarketingRequest);

router.delete('/:id', protect, deleteMarketingRequest);

router.post('/:id/accept', protect, acceptMarketingRequest);

module.exports = router;
