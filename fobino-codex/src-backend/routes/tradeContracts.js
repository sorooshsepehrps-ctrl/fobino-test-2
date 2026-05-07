const express = require('express');
const router = express.Router();
const {
  createTradeContract,
  connectBuyerToContract,
  approveBuyerContract,
  rejectBuyerContract,
  depositCommission,
  getMyContracts,
  getContractById,
  markContractPaymentMethod,
  releaseCommission,
  cancelContract
} = require('../controllers/tradeContractController');
const { protect } = require('../middleware/auth');

router.post('/rfp/:rfpId', protect, createTradeContract);

router.post('/connect', protect, connectBuyerToContract);

router.post('/:id/approve', protect, approveBuyerContract);

router.post('/:id/reject', protect, rejectBuyerContract);

router.post('/:id/deposit-commission', protect, depositCommission);

router.get('/my-contracts', protect, getMyContracts);

router.get('/:id', protect, getContractById);

router.post('/:id/payment-method', protect, markContractPaymentMethod);

router.post('/:id/release-commission', protect, releaseCommission);

router.post('/:id/cancel', protect, cancelContract);

module.exports = router;
