const mongoose = require('mongoose');
const {
  TRANSACTION_DOMAINS,
  TRANSACTION_FLOWS,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_IMPACTS,
  SETTLEMENT_STATUSES,
  COUNTERPARTY_ROLES,
  REFERENCE_TYPES,
  LEGACY_TYPES,
} = require('../constants/transactionTypes');

const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },

    // Backward-compatible legacy type
    type: {
      type: String,
      enum: LEGACY_TYPES,
      required: true,
    },

    // New ledger taxonomy
    domain: {
      type: String,
      enum: TRANSACTION_DOMAINS,
      default: 'wallet',
      index: true,
    },

    flow: {
      type: String,
      enum: TRANSACTION_FLOWS,
      default: 'info',
      index: true,
    },

    direction: {
      type: String,
      enum: TRANSACTION_DIRECTIONS,
      default: 'info',
      index: true,
    },

    impact: {
      type: String,
      enum: TRANSACTION_IMPACTS,
      default: 'no_balance_change',
    },

    amount: {
      type: Number,
      required: true,
    },

    grossAmount: {
      type: Number,
      default: null,
    },

    netAmount: {
      type: Number,
      default: null,
    },

    feeAmount: {
      type: Number,
      default: 0,
    },

    commissionAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      enum: ['IRR', 'USD', 'EUR', 'AED'],
      default: 'IRR',
    },

    balanceAfter: Number,

    description: String,

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
      default: 'pending',
      index: true,
    },

    settlementStatus: {
      type: String,
      enum: SETTLEMENT_STATUSES,
      default: 'pending',
      index: true,
    },

    referenceId: {
      type: String,
      trim: true,
      index: true,
    },

    referenceType: {
      type: String,
      enum: REFERENCE_TYPES,
      default: 'system',
      index: true,
    },

    payerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    beneficiaryUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    counterpartyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    counterpartyRole: {
      type: String,
      enum: COUNTERPARTY_ROLES,
      default: 'none',
    },

    visibleToUser: {
      type: Boolean,
      default: true,
      index: true,
    },

    isInformational: {
      type: Boolean,
      default: false,
      index: true,
    },

    relatedDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
    },

    relatedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },

    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },

    relatedTradeContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeContract',
    },

    relatedInspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
    },

    relatedShipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipping',
    },

    relatedDropshippingRFP: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingRFP',
    },

    gateway: {
      name: String,
      authority: String,
      refId: String,
      cardPan: String,
      fee: Number,
    },

    withdrawal: {
      shaba: String,
      bankName: String,
      accountHolder: String,
      processedAt: Date,
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
      trackingCode: String,
    },

    exchange: {
      fromCurrency: String,
      toCurrency: String,
      rate: Number,
      convertedAmount: Number,
    },

    display: {
      title: String,
      subtitle: String,
      explainer: String,
      badge: String,
      previewNetAmount: Number,
      previewFeeAmount: Number,
    },

    timeline: {
      initiatedAt: Date,
      pendingAt: Date,
      settledAt: Date,
      failedAt: Date,
      cancelledAt: Date,
    },

    metadata: {
      ip: String,
      userAgent: String,
      notes: String,
      source: String,
      returnTo: String,
      actorId: String,
      actorType: String,
      tags: [String],
    },

    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ domain: 1, flow: 1, createdAt: -1 });
transactionSchema.index({ status: 1, settlementStatus: 1 });
transactionSchema.index({ referenceType: 1, referenceId: 1 });
transactionSchema.index({ relatedDeal: 1 });
transactionSchema.index({ relatedTradeContract: 1 });
transactionSchema.index({ relatedSubscription: 1 });
transactionSchema.index({ relatedPost: 1 });
transactionSchema.index({ visibleToUser: 1, createdAt: -1 });

transactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    const date = new Date();
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.transactionNumber = `TXN${timestamp}${random}`;
  }

  if (!this.timeline) {
    this.timeline = {};
  }

  if (this.isNew && !this.timeline.initiatedAt) {
    this.timeline.initiatedAt = new Date();
  }

  next();
});

transactionSchema.methods.complete = async function (refId = null) {
  this.status = 'completed';
  this.settlementStatus = 'completed';
  this.completedAt = new Date();
  this.timeline = this.timeline || {};
  this.timeline.settledAt = new Date();

  if (refId) {
    this.gateway = this.gateway || {};
    this.gateway.refId = refId;
  }

  return this.save();
};

transactionSchema.methods.fail = async function (reason = '') {
  this.status = 'failed';
  this.settlementStatus = 'failed';
  this.failedAt = new Date();
  this.timeline = this.timeline || {};
  this.timeline.failedAt = new Date();

  this.metadata = this.metadata || {};
  if (reason) {
    this.metadata.notes = reason;
  }

  return this.save();
};

transactionSchema.methods.cancel = async function (reason = '') {
  this.status = 'cancelled';
  this.settlementStatus = 'cancelled';
  this.cancelledAt = new Date();
  this.timeline = this.timeline || {};
  this.timeline.cancelledAt = new Date();

  this.metadata = this.metadata || {};
  if (reason) {
    this.metadata.notes = reason;
  }

  return this.save();
};

transactionSchema.statics.createDeposit = async function (userId, walletId, amount, gateway = null) {
  const transaction = new this({
    user: userId,
    wallet: walletId,
    type: 'deposit',
    domain: 'wallet',
    flow: 'deposit_init',
    direction: 'in',
    impact: 'no_balance_change',
    amount,
    grossAmount: amount,
    netAmount: amount,
    currency: 'IRR',
    description: 'شارژ کیف پول',
    referenceType: 'deposit',
    status: 'pending',
    settlementStatus: 'pending',
    gateway: gateway ? { name: gateway } : null,
    display: {
      title: 'شارژ کیف پول',
      subtitle: 'در انتظار پرداخت',
      explainer: 'پس از تایید درگاه، مبلغ به موجودی قابل استفاده کیف پول اضافه می‌شود.',
      badge: 'pending',
      previewNetAmount: amount,
    },
  });

  return transaction.save();
};

transactionSchema.statics.createWithdrawal = async function (
  userId,
  walletId,
  amount,
  shaba,
  bankName,
  accountHolder
) {
  const transaction = new this({
    user: userId,
    wallet: walletId,
    type: 'withdrawal',
    domain: 'withdrawal',
    flow: 'withdraw_request',
    direction: 'hold',
    impact: 'available_to_blocked',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: 'درخواست برداشت از کیف پول',
    referenceType: 'withdrawal',
    status: 'pending',
    settlementStatus: 'pending',
    withdrawal: { shaba, bankName, accountHolder },
    display: {
      title: 'درخواست برداشت',
      subtitle: 'در انتظار بررسی',
      explainer: 'این مبلغ از موجودی قابل استفاده کم و تا زمان بررسی مسدود شده است.',
      badge: 'pending',
      previewNetAmount: Math.abs(amount),
    },
  });

  return transaction.save();
};

transactionSchema.statics.createPostEnhancement = async function (
  userId,
  walletId,
  amount,
  postId,
  description,
  enhancementType = 'nardeban'
) {
  const transaction = new this({
    user: userId,
    wallet: walletId,
    type: 'post_enhancement',
    domain: 'post',
    flow: 'wallet_payment',
    direction: 'out',
    impact: 'available_decrease',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description:
      description ||
      `${enhancementType === 'nardeban' ? 'فعال‌سازی نردبان' : 'فعال‌سازی ویژه'} برای آگهی`,
    referenceType: 'post',
    relatedPost: postId,
    status: 'completed',
    settlementStatus: 'completed',
    completedAt: new Date(),
  });

  return transaction.save();
};

transactionSchema.statics.createSubscription = async function (
  userId,
  walletId,
  amount,
  subscriptionId,
  planName
) {
  const transaction = new this({
    user: userId,
    wallet: walletId,
    type: 'subscription',
    domain: 'subscription',
    flow: 'wallet_payment',
    direction: 'out',
    impact: 'available_decrease',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `خرید اشتراک ${planName}`,
    referenceType: 'subscription',
    relatedSubscription: subscriptionId,
    status: 'completed',
    settlementStatus: 'completed',
    completedAt: new Date(),
  });

  return transaction.save();
};

transactionSchema.statics.getUserTransactions = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    startDate,
    endDate,
    domain,
    flow,
  } = options;

  const query = { user: userId, visibleToUser: true };

  if (type) query.type = type;
  if (status) query.status = status;
  if (domain) query.domain = domain;
  if (flow) query.flow = flow;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 20, 1);

  const total = await this.countDocuments(query);
  const transactions = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .populate('relatedPost', 'title')
    .populate('relatedSubscription', 'plan planName amount paymentMethod status')
    .populate('relatedDeal', 'dealNumber')
    .populate('relatedTradeContract', 'contractCode status commission')
    .populate('counterpartyUser', 'firstName lastName companyName phone')
    .lean();

  return {
    transactions,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

// add near the bottom before module.exports

transactionSchema.statics.getPendingWithdrawals = async function (options = {}) {
  const { page = 1, limit = 20 } = options;
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 20, 1);

  const query = {
    type: 'withdrawal',
    flow: 'withdraw_request',
    status: 'pending',
  };

  const total = await this.countDocuments(query);
  const items = await this.find(query)
    .sort({ createdAt: 1 })
    .skip((currentPage - 1) * currentLimit)
    .limit(currentLimit)
    .populate('user', 'firstName lastName companyName phone email')
    .lean();

  return {
    items,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      pages: Math.ceil(total / currentLimit),
    },
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);









