const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { protect } = require('../middleware/auth');
const { isJudge, isAdmin } = require('../middleware/roles');
const { uploadMultipleDocuments } = require('../middleware/upload');

router.get('/', protect, disputeController.getDisputes);
router.get('/:id', protect, disputeController.getDispute);
router.post('/:id/response', protect, uploadMultipleDocuments, disputeController.addResponse);
router.post('/:id/evidence', protect, uploadMultipleDocuments, disputeController.uploadEvidence);
router.post('/:id/appeal', protect, disputeController.fileAppeal);

// Judge/Admin routes
router.post('/:id/assign', protect, isAdmin, disputeController.assignJudge);
router.post('/:id/verdict', protect, isJudge, disputeController.issueVerdict);
router.post('/:id/execute', protect, isAdmin, disputeController.executeVerdict);

module.exports = router;
