const express = require('express');
const router = express.Router();
const {
  createRFP,
  getMyRFPs,
  getRFPById,
  approveRFP,
  editRFP,
  rejectRFP
} = require('../controllers/rfpController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRFP);

router.get('/my-rfps', protect, getMyRFPs);

router.get('/:id', protect, getRFPById);

router.post('/:id/approve', protect, approveRFP);

router.put('/:id/edit', protect, editRFP);

router.post('/:id/reject', protect, rejectRFP);

module.exports = router;
