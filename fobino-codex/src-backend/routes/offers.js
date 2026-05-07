const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

router.post('/', protect, offerController.createOffer);
router.get('/:id', protect, offerController.getOffer);
router.post('/:id/accept', protect, offerController.acceptOffer);
router.post('/:id/reject', protect, offerController.rejectOffer);
router.post('/:id/counter', protect, offerController.counterOffer);
router.post('/:id/cancel', protect, offerController.cancelOffer);

module.exports = router;
