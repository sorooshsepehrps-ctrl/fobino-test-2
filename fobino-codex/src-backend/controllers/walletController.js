const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { zarinpal } = require('../config/payment');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const logger = require('../utils/logger');
const ledgerService = require('../services/transactionLedgerService');
const { presentTransaction } = require('../utils/transactionPresenter');

exports.getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  return response.success(res, { wallet });
});

exports.getBalance = asyncHandler(async (req, res) => {
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  const { currency = 'IRR' } = req.query;
  const balance = wallet.getBalance(currency);
  return response.success(res, { balance, currency });
});

exports.deposit = asyncHandler(async (req, res) => {
  const { amount, gateway = 'zarinpal' } = req.body;

  if (!amount || Number(amount) < 10000) {
    return response.error(res, 'حداقل مبلغ شارژ ۱۰,۰۰۰ ریال است', 400);
  }

  const wallet = await Wallet.getOrCreateWallet(req.user._id);

  const transaction = await ledgerService.recordWalletDepositInitiated({
    userId: req.user._id,
    walletId: wallet._id,
    amount: Number(amount),
    gatewayName: gateway,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      source: 'walletController.deposit',
    },
  });

  const callbackUrl = `${process.env.BASE_URL}/api/wallet/deposit/verify`;
  const result = await zarinpal.request(
    Number(amount),
    'شارژ کیف پول فوبینو',
    callbackUrl,
    req.user.phone
  );

  if (!result.success) {
    await ledgerService.failWalletDeposit({
      transaction,
      reason: 'خطا در اتصال به درگاه',
    });

    return response.error(res, 'خطا در اتصال به درگاه پرداخت', 500);
  }

  transaction.gateway = {
    ...(transaction.gateway || {}),
    name: gateway,
    authority: result.authority,
  };
  await transaction.save();

  return response.success(res, {
    paymentUrl: result.url,
    transactionId: transaction._id,
    authority: result.authority,
  });
});

exports.verifyDeposit = asyncHandler(async (req, res) => {
  const { Authority, Status } = req.query;

  logger.info('Wallet deposit verification started', {
    authority: Authority?.substring(0, 10) + '...',
    status: Status,
  });

  const transaction = await Transaction.findOne({
    'gateway.authority': Authority,
    type: 'deposit',
    status: 'pending',
  });

  if (!transaction) {
    return res.redirect(
      `${process.env.CORS_ORIGIN}/dashboard/wallet?status=failed&error=transaction_not_found`
    );
  }

  if (Status !== 'OK') {
    await ledgerService.failWalletDeposit({
      transaction,
      reason: 'پرداخت توسط کاربر لغو شد',
    });

    return res.redirect(
      `${process.env.CORS_ORIGIN}/dashboard/wallet?status=failed&error=cancelled`
    );
  }

  try {
    const result = await zarinpal.verify(Authority, Math.abs(transaction.amount));
    if (!result.success) {
      await ledgerService.failWalletDeposit({
        transaction,
        reason: 'تایید تراکنش توسط درگاه ناموفق بود',
      });

      return res.redirect(
        `${process.env.CORS_ORIGIN}/dashboard/wallet?status=failed&error=verification_failed`
      );
    }

    const wallet = await Wallet.findById(transaction.wallet);
    if (!wallet) {
      await ledgerService.failWalletDeposit({
        transaction,
        reason: 'کیف پول کاربر پیدا نشد',
      });

      return res.redirect(
        `${process.env.CORS_ORIGIN}/dashboard/wallet?status=failed&error=wallet_not_found`
      );
    }

    await wallet.deposit(Math.abs(transaction.amount), transaction.currency || 'IRR');

    await ledgerService.completeWalletDeposit({
      transaction,
      wallet,
      refId: result.refId,
      cardPan: result.cardPan,
      gatewayFee: result.fee,
    });

    return res.redirect(
      `${process.env.CORS_ORIGIN}/dashboard/wallet?status=success&amount=${Math.abs(
        transaction.amount
      )}&refId=${result.refId}`
    );
  } catch (error) {
    logger.error('Wallet verify deposit error', {
      message: error.message,
      authority: Authority,
    });

    await ledgerService.failWalletDeposit({
      transaction,
      reason: 'خطا در پردازش تایید تراکنش',
    });

    return res.redirect(
      `${process.env.CORS_ORIGIN}/dashboard/wallet?status=failed&error=server_error`
    );
  }
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, shaba, bankName, accountHolder } = req.body;
  const normalizedAmount = Number(amount);
  const MIN = 500000;
  const MAX = 500000000;

  if (!normalizedAmount || normalizedAmount < MIN || normalizedAmount > MAX) {
    return response.error(
      res,
      `مبلغ برداشت باید بین ${MIN.toLocaleString()} تا ${MAX.toLocaleString()} ریال باشد`,
      400
    );
  }

  if (!shaba || !bankName || !accountHolder) {
    return response.error(res, 'اطلاعات بانکی کامل نیست', 400);
  }

  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  wallet.assertSufficientAvailableBalance(normalizedAmount, 'IRR');

  await wallet.blockAmount(normalizedAmount, 'IRR');

  const transaction = await ledgerService.recordWithdrawalRequested({
    userId: req.user._id,
    walletId: wallet._id,
    amount: normalizedAmount,
    shaba,
    bankName,
    accountHolder,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      source: 'walletController.requestWithdrawal',
    },
  });

  return response.created(
    res,
    {
      transaction: presentTransaction(transaction.toObject()),
      balances: wallet.getBalance('IRR'),
    },
    'درخواست برداشت با موفقیت ثبت شد'
  );
});

exports.getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    startDate,
    endDate,
    domain,
    flow,
  } = req.query;

  const result = await Transaction.getUserTransactions(req.user._id, {
    page,
    limit,
    type,
    status,
    startDate,
    endDate,
    domain,
    flow,
  });

  const wallet = await Wallet.getOrCreateWallet(req.user._id);

  return response.paginated(
    res,
    {
      transactions: result.transactions.map(presentTransaction),
      balances: wallet.getBalance('IRR'),
    },
    result.pagination
  );
});