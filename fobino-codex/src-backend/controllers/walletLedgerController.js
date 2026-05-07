
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const { presentTransaction } = require('../utils/transactionPresenter');
const {
  buildLedgerQuery,
  buildLedgerOptions,
  buildAppliedFilters,
} = require('../utils/ledgerQueryBuilder');

const DROPSHIPPING_FLOWS = ['block', 'incoming_pending', 'incoming_released', 'refund', 'fee'];

function buildDropshippingSummary(transactions = [], role = 'provider') {
  let blockedTotal = 0;
  let releasedTotal = 0;
  let refundedTotal = 0;
  let feeTotal = 0;
  let pendingIncomingTotal = 0;
  let grossSalesTotal = 0;

  for (const tx of transactions) {
    const gross = Math.abs(tx.grossAmount || tx.amount || 0);
    const net = Math.abs(tx.netAmount || tx.amount || 0);
    const fee = Math.abs(tx.feeAmount || 0);

    if (tx.flow === 'block') blockedTotal += gross;
    if (tx.flow === 'incoming_pending' && tx.settlementStatus === 'blocked_for_future_release') {
      pendingIncomingTotal += net;
    }
    if (tx.flow === 'incoming_released' && tx.status === 'completed') {
      releasedTotal += net;
      grossSalesTotal += gross;
    }
    if (tx.flow === 'refund' && tx.status === 'completed') refundedTotal += gross;
    if (tx.flow === 'fee' && tx.status === 'completed') feeTotal += fee || gross;
  }

  return role === 'provider'
    ? {
        pendingIncomingTotal,
        releasedTotal,
        feeTotal,
        grossSalesTotal,
        transactionsCount: transactions.length,
      }
    : {
        blockedTotal,
        refundedTotal,
        completedPaymentsTotal: blockedTotal - refundedTotal,
        transactionsCount: transactions.length,
      };
}

async function getFinanceSummary(req, res, role) {
  const wallet = await Wallet.getOrCreateWallet(req.user._id);

  const query = {
    user: req.user._id,
    visibleToUser: true,
    domain: 'dropshipping',
  };

  const transactions = await Transaction.find(query).lean();

  return response.success(
    res,
    {
      balances: wallet.getBalance('IRR'),
      finance: buildDropshippingSummary(transactions, role),
      availableFilters: {
        domain: ['dropshipping'],
        flow: DROPSHIPPING_FLOWS,
        settlementStatus: [
          'blocked_for_future_release',
          'released_to_beneficiary',
          'refunded',
          'completed',
        ],
      },
    },
    'خلاصه مالی دراپ‌شیپینگ دریافت شد'
  );
}

async function getFinanceLedger(req, res) {
  const mergedQuery = {
    ...req.query,
    domain: 'dropshipping',
  };

  const query = buildLedgerQuery(req.user._id, mergedQuery);

  if (req.query.rfpId) {
    query.relatedDropshippingRFP = req.query.rfpId;
  }

  const { page, limit, skip, sort } = buildLedgerOptions(req.query);
  const appliedFilters = buildAppliedFilters(mergedQuery);

  const [wallet, total, transactions] = await Promise.all([
    Wallet.getOrCreateWallet(req.user._id),
    Transaction.countDocuments(query),
    Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('relatedDropshippingRFP', 'rfpCode status paymentStatus settlementStatus quantity agreedShipmentDateJalali')
      .lean(),
  ]);

  const items = transactions.map((tx) => presentTransaction(tx));

  return response.ledgerResponse(
    res,
    {
      items,
      balances: wallet.getBalance('IRR'),
      filters: appliedFilters,
      availableFilters: {
        domains: ['dropshipping'],
        flows: DROPSHIPPING_FLOWS,
        statuses: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
        settlementStatuses: [
          'blocked_for_future_release',
          'released_to_beneficiary',
          'refunded',
          'completed',
        ],
        sorts: ['newest', 'oldest', 'amount_desc', 'amount_asc'],
      },
      summary: {
        count: items.length,
        page,
        limit,
      },
    },
    {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    'لجر مالی دراپ‌شیپینگ دریافت شد'
  );
}

exports.getWalletSummary = asyncHandler(async (req, res) => {
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  return response.ledgerSummary(
    res,
    {
      ...wallet.getBalance('IRR'),
      currency: 'IRR',
    },
    'خلاصه کیف پول دریافت شد'
  );
});

exports.getWalletLedger = asyncHandler(async (req, res) => {
  const query = buildLedgerQuery(req.user._id, req.query);
  const { page, limit, skip, sort } = buildLedgerOptions(req.query);
  const appliedFilters = buildAppliedFilters(req.query);

  const [wallet, total, transactions] = await Promise.all([
    Wallet.getOrCreateWallet(req.user._id),
    Transaction.countDocuments(query),
    Transaction.find(query).sort(sort).skip(skip).limit(limit).lean(),
  ]);

  const items = transactions.map((tx) => presentTransaction(tx));

  return response.ledgerResponse(
    res,
    {
      items,
      balances: wallet.getBalance('IRR'),
      filters: appliedFilters,
      summary: { count: items.length, page, limit },
    },
    { total, page, limit, pages: Math.ceil(total / limit) },
    'لجر کیف پول دریافت شد'
  );
});

exports.getWalletLedgerItem = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    visibleToUser: true,
  })
    .populate('relatedDropshippingRFP', 'rfpCode status paymentStatus settlementStatus quantity agreedShipmentDateJalali')
    .lean();

  if (!transaction) return response.notFound(res, 'تراکنش یافت نشد');

  return response.success(res, { item: presentTransaction(transaction) }, 'جزئیات تراکنش دریافت شد');
});

exports.getDropshippingProviderFinanceSummary = asyncHandler(async (req, res) => {
  return getFinanceSummary(req, res, 'provider');
});

exports.getDropshippingProviderFinanceLedger = asyncHandler(async (req, res) => {
  return getFinanceLedger(req, res);
});

exports.getDropshippingDropshipperFinanceSummary = asyncHandler(async (req, res) => {
  return getFinanceSummary(req, res, 'dropshipper');
});

exports.getDropshippingDropshipperFinanceLedger = asyncHandler(async (req, res) => {
  return getFinanceLedger(req, res);
});
