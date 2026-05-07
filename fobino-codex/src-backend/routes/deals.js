const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const shippingController = require('../controllers/shippingController');
const inspectionController = require('../controllers/inspectionController');
const { protect } = require('../middleware/auth');

// Deal CRUD
router.get('/', protect, dealController.getDeals);
router.get('/reviewable', protect, dealController.getReviewableDeals);
router.post('/', protect, dealController.createDeal);
router.get('/:id', protect, dealController.getDeal);
router.get('/:id/timeline', protect, dealController.getTimeline);

// Deal status transitions
router.post('/:id/verify', protect, dealController.verifyDeal);
router.post('/:id/ship', protect, dealController.shipDeal);
router.post('/:id/deliver', protect, dealController.deliverDeal);
router.post('/:id/confirm', protect, dealController.confirmDeal);
router.post('/:id/cancel', protect, dealController.cancelDeal);
router.post('/:id/dispute', protect, dealController.openDispute);

// Shipping add-on (buyer endpoints)
router.get('/:id/shipping', protect, shippingController.getShipping);
router.post('/:id/shipping', protect, shippingController.requestShipping);
router.post('/:id/shipping/respond', protect, shippingController.respondToShippingPrice);
router.post('/:id/shipping/request-factor', protect, shippingController.requestShippingFactor);

// Inspection add-on (buyer endpoints)
router.get('/:id/inspection', protect, inspectionController.getInspection);
router.post('/:id/inspection', protect, inspectionController.requestInspection);
router.post('/:id/inspection/pay', protect, inspectionController.payInspection);
router.post('/:id/inspection/request-factor', protect, inspectionController.requestInspectionFactor);

module.exports = router;
