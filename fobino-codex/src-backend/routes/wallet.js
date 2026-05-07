const express = require('express');
const router = express.Router();

const walletController = require('../controllers/walletController');
const walletLedgerController = require('../controllers/walletLedgerController');
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const { requireLevel } = require('../middleware/roles');

router.get('/', protect, walletController.getWallet);
router.get('/balance', protect, walletController.getBalance);

// Finalized wallet dashboard API
router.get('/summary', protect, walletLedgerController.getWalletSummary);
router.get('/ledger', protect, walletLedgerController.getWalletLedger);
router.get('/ledger/:id', protect, walletLedgerController.getWalletLedgerItem);

// Backward compatibility
router.get('/transactions', protect, walletController.getTransactions);

router.post('/deposit', protect, paymentLimiter, walletController.deposit);
router.get('/deposit/verify', walletController.verifyDeposit);
router.post('/withdraw', protect, requireLevel(4), walletController.requestWithdrawal);

module.exports = router;