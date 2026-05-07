


const express = require('express');
const router = express.Router();
const { protect, restrictTo, restrictDropshippingTo } = require('../middleware/auth');

const dropshippingProductController = require('../controllers/dropshippingProductController');
const dropshippingRFPController = require('../controllers/dropshippingRFPController');
const dropshippingAgreementController = require('../controllers/dropshippingAgreementController');
const dropshippingRatingController = require('../controllers/dropshippingRatingController');
const dropshippingAdminController = require('../controllers/dropshippingAdminController');
const walletLedgerController = require('../controllers/walletLedgerController');
const visitCardController = require('../controllers/visitCardController');

router.use(protect);

// Verification / agreements
router.post('/verification', dropshippingAgreementController.createAgreement);
router.post('/agreements', dropshippingAgreementController.createAgreement);
router.get('/agreements/me', dropshippingAgreementController.getMyAgreement);
router.put('/agreements/me', dropshippingAgreementController.updateAgreement);

router.get('/agreements/admin/pending', restrictTo('admin'), dropshippingAgreementController.getAllPendingAgreements);
router.patch('/agreements/:id/approve', restrictTo('admin'), dropshippingAgreementController.approveAgreement);
router.patch('/agreements/:id/reject', restrictTo('admin'), dropshippingAgreementController.rejectAgreement);
router.patch('/agreements/:id/suspend', restrictTo('admin'), dropshippingAgreementController.suspendAgreement);
router.patch('/agreements/:id/terminate', restrictTo('admin'), dropshippingAgreementController.terminateAgreement);
router.patch('/agreements/:id/unsuspend', restrictTo('admin'), dropshippingAgreementController.unsuspendAgreement);
router.post('/agreements/:id/notes', restrictTo('admin'), dropshippingAgreementController.addNote);

// Dashboard summaries
router.get('/provider/dashboard-summary', restrictDropshippingTo('provider'), dropshippingProductController.getProviderDashboardSummary);
router.get('/dropshipper/dashboard-summary', restrictDropshippingTo('dropshipper'), dropshippingProductController.getDropshipperDashboardSummary);

// Products
router.post('/products', restrictDropshippingTo('provider'), dropshippingProductController.createProduct);
router.get('/products/my-products', restrictDropshippingTo('provider'), dropshippingProductController.getMyProducts);
router.get('/products/browse', restrictDropshippingTo('dropshipper'), dropshippingProductController.getAllProductsForDropshippers);
router.get('/products/:id', dropshippingProductController.getProductById);
router.put('/products/:id', restrictDropshippingTo('provider'), dropshippingProductController.updateProduct);
router.delete('/products/:id', restrictDropshippingTo('provider'), dropshippingProductController.deleteProduct);
router.patch('/products/:id/stock', restrictDropshippingTo('provider'), dropshippingProductController.updateStock);
router.patch('/products/:id/toggle-status', restrictDropshippingTo('provider'), dropshippingProductController.toggleProductStatus);
router.get('/products/:id/rfps', restrictDropshippingTo('provider'), dropshippingProductController.getProductRFPs);

// Dropshipper accepted products
router.get('/dropshipper/accepted-products', restrictDropshippingTo('dropshipper'), dropshippingProductController.getAcceptedProductsForDropshipper);
router.get('/dropshipper/accepted-products/:id', restrictDropshippingTo('dropshipper'), dropshippingProductController.getAcceptedProductDetailForDropshipper);

// RFPs
router.post('/rfps', restrictDropshippingTo('dropshipper'), dropshippingRFPController.createRFP);
router.get('/rfps', dropshippingRFPController.getMyRFPs);
router.get('/rfps/:id', dropshippingRFPController.getRFPById);
router.get('/rfps/:id/timeline', dropshippingRFPController.getRFPTimeline);
router.patch('/rfps/:id/approve', dropshippingRFPController.approveRFP);
router.patch('/rfps/:id/edit', dropshippingRFPController.editRFP);
router.patch('/rfps/:id/reject', dropshippingRFPController.rejectRFP);
router.post('/rfps/:id/payment', restrictDropshippingTo('dropshipper'), dropshippingRFPController.processPayment);
router.patch('/rfps/:id/ship', restrictDropshippingTo('provider'), dropshippingRFPController.markShipped);
router.patch('/rfps/:id/confirm-delivery', dropshippingRFPController.confirmDelivery);

// Ratings
router.post('/ratings', dropshippingRatingController.createRating);
router.get('/ratings/me/stats', dropshippingRatingController.getMyReceivedRatingStats);

// Finance
router.get('/provider/finance/summary', restrictDropshippingTo('provider'), walletLedgerController.getDropshippingProviderFinanceSummary);
router.get('/provider/finance/ledger', restrictDropshippingTo('provider'), walletLedgerController.getDropshippingProviderFinanceLedger);
router.get('/dropshipper/finance/summary', restrictDropshippingTo('dropshipper'), walletLedgerController.getDropshippingDropshipperFinanceSummary);
router.get('/dropshipper/finance/ledger', restrictDropshippingTo('dropshipper'), walletLedgerController.getDropshippingDropshipperFinanceLedger);

// Visit card routes (unchanged)
router.post('/visit-cards', restrictDropshippingTo('dropshipper'), visitCardController.createVisitCard);
router.get('/visit-cards/me', visitCardController.getMyVisitCard);
router.get('/visit-cards/code/:code', visitCardController.getVisitCardByCode);
router.put('/visit-cards/me', visitCardController.updateVisitCard);
router.post('/visit-cards/track-click/:code', visitCardController.trackClick);
router.post('/visit-cards/track-share', visitCardController.trackShare);
router.get('/visit-cards/admin/pending', restrictTo('admin'), visitCardController.getAllPendingVisitCards);
router.patch('/visit-cards/:id/verify', restrictTo('admin'), visitCardController.verifySocialMedia);
router.patch('/visit-cards/:id/reject', restrictTo('admin'), visitCardController.rejectVisitCard);

// Admin late list
router.get('/admin/late-rfps', restrictTo('admin'), dropshippingAdminController.getLateRFPs);

module.exports = router;
