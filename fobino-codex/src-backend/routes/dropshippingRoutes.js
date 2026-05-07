const express = require('express');
const router = express.Router();
const { protect, restrictTo, restrictDropshippingTo } = require('../middleware/auth');

const dropshippingProductController = require('../controllers/dropshippingProductController');
const dropshippingRFPController = require('../controllers/dropshippingRFPController');
const visitCardController = require('../controllers/visitCardController');
const providerRatingController = require('../controllers/providerRatingController');
const dropshippingAgreementController = require('../controllers/dropshippingAgreementController');

router.use(protect);

// Dropshipping Products Routes
router.post('/products', restrictDropshippingTo('provider'), dropshippingProductController.createProduct);
router.get('/products/my-products', restrictDropshippingTo('provider'), dropshippingProductController.getMyProducts);
router.get('/products/browse', restrictDropshippingTo('dropshipper'), dropshippingProductController.getAllProductsForDropshippers);
router.get('/products/:id', dropshippingProductController.getProductById);
router.put('/products/:id', restrictDropshippingTo('provider'), dropshippingProductController.updateProduct);
router.delete('/products/:id', restrictDropshippingTo('provider'), dropshippingProductController.deleteProduct);
router.patch('/products/:id/stock', restrictDropshippingTo('provider'), dropshippingProductController.updateStock);
router.get('/products/:id/rfps', restrictDropshippingTo('provider'), dropshippingProductController.getProductRFPs);

// Dropshipping RFP Routes
router.post('/rfps', restrictDropshippingTo('dropshipper'), dropshippingRFPController.createRFP);
router.get('/rfps', dropshippingRFPController.getMyRFPs);
router.get('/rfps/:id', dropshippingRFPController.getRFPById);
router.patch('/rfps/:id/approve', dropshippingRFPController.approveRFP);
router.patch('/rfps/:id/edit', dropshippingRFPController.editRFP);
router.patch('/rfps/:id/reject', dropshippingRFPController.rejectRFP);
router.post('/rfps/:id/payment', restrictDropshippingTo('dropshipper'), dropshippingRFPController.processPayment);
router.patch('/rfps/:id/ship', restrictDropshippingTo('provider'), dropshippingRFPController.markShipped);
router.patch('/rfps/:id/confirm-delivery', dropshippingRFPController.confirmDelivery);

// Visit Card Routes
router.post('/visit-cards', restrictDropshippingTo('dropshipper'), visitCardController.createVisitCard);
router.get('/visit-cards/me', visitCardController.getMyVisitCard);
router.get('/visit-cards/code/:code', visitCardController.getVisitCardByCode);
router.put('/visit-cards/me', visitCardController.updateVisitCard);
router.post('/visit-cards/track-click/:code', visitCardController.trackClick);
router.post('/visit-cards/track-share', visitCardController.trackShare);

// Admin routes for visit cards
router.get('/visit-cards/admin/pending', restrictTo('admin'), visitCardController.getAllPendingVisitCards);
router.patch('/visit-cards/:id/verify', restrictTo('admin'), visitCardController.verifySocialMedia);
router.patch('/visit-cards/:id/reject', restrictTo('admin'), visitCardController.rejectVisitCard);

// Provider Rating Routes
router.post('/ratings', restrictDropshippingTo('dropshipper'), providerRatingController.createRating);
router.get('/ratings/provider/:providerId', providerRatingController.getProviderRatings);
router.get('/ratings/me', providerRatingController.getMyRatings);
router.put('/ratings/:id', restrictDropshippingTo('dropshipper'), providerRatingController.updateRating);
router.post('/ratings/:id/respond', restrictDropshippingTo('provider'), providerRatingController.respondToRating);
router.post('/ratings/:id/helpful', providerRatingController.markHelpful);
router.delete('/ratings/:id', restrictDropshippingTo('dropshipper'), providerRatingController.deleteRating);

// Dropshipping Agreement Routes
router.post('/agreements', dropshippingAgreementController.createAgreement);
router.get('/agreements/me', dropshippingAgreementController.getMyAgreement);
router.put('/agreements/me', dropshippingAgreementController.updateAgreement);

// Admin routes for agreements
router.get('/agreements/admin/pending', restrictTo('admin'), dropshippingAgreementController.getAllPendingAgreements);
router.patch('/agreements/:id/approve', restrictTo('admin'), dropshippingAgreementController.approveAgreement);
router.patch('/agreements/:id/reject', restrictTo('admin'), dropshippingAgreementController.rejectAgreement);
router.patch('/agreements/:id/suspend', restrictTo('admin'), dropshippingAgreementController.suspendAgreement);
router.patch('/agreements/:id/terminate', restrictTo('admin'), dropshippingAgreementController.terminateAgreement);
router.post('/agreements/:id/notes', restrictTo('admin'), dropshippingAgreementController.addNote);

module.exports = router;
