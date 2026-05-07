const mongoose = require('mongoose');

const tradeContractSchema = new mongoose.Schema({
  rfp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: true
  },

  marketingRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingRequest',
    required: true
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  marketer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  contractCode: {
    type: String,
    unique: true,
    required: true
  },

  contractTerms: {
    productName: String,
    quantity: Number,
    unit: String,
    pricePerUnit: Number,
    totalPrice: Number,
    deliveryTime: String,
    paymentTerms: String,
    warranties: String,
    additionalServices: [String]
  },

  commission: {
    percent: Number,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'deposited', 'released', 'released_with_fee', 'refunded'],
      default: 'pending'
    },
    depositedAt: Date,
    releasedAt: Date,
    fobinoFee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      default: 0
    }
  },

  financials: {
    commissionGrossAmount: { type: Number, default: 0 },
    platformFeeAmount: { type: Number, default: 0 },
    marketerNetAmount: { type: Number, default: 0 },
    settlementStatus: {
      type: String,
      enum: [
        'none',
        'blocked_for_future_release',
        'released_to_beneficiary',
        'refunded_to_buyer',
        'cancelled'
      ],
      default: 'none'
    }
  },

  status: {
    type: String,
    enum: [
      'waiting_buyer',
      'buyer_connected',
      'buyer_approved',
      'buyer_rejected',
      'commission_deposited',
      'contacts_shared',
      'deal_created',
      'completed',
      'cancelled'
    ],
    default: 'waiting_buyer'
  },

  buyerApproval: {
    approved: { type: Boolean, default: false },
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },

  commissionDeposit: {
    transactionId: String,
    amount: Number,
    depositedAt: Date,
    walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },

  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },

  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },

  paymentMethodUsed: {
    type: String,
    enum: ['fobino_secure', 'external', 'unknown'],
    default: 'unknown'
  },

  timeline: [{
    event: String,
    description: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],

  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tradeContractSchema.index({ contractCode: 1 });
tradeContractSchema.index({ seller: 1 });
tradeContractSchema.index({ marketer: 1 });
tradeContractSchema.index({ buyer: 1 });
tradeContractSchema.index({ rfp: 1 });
tradeContractSchema.index({ status: 1 });
tradeContractSchema.index({ createdAt: -1 });

tradeContractSchema.pre('validate', async function(next) {
  if (this.isNew && !this.contractCode) {
    const code = `TC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.contractCode = code;
  }
  next();
});

tradeContractSchema.methods.addToTimeline = function(event, description, userId, metadata = {}) {
  this.timeline.push({
    event,
    description,
    performedBy: userId,
    timestamp: new Date(),
    metadata
  });
};

tradeContractSchema.methods.connectBuyer = async function(buyerId) {
  this.buyer = buyerId;
  this.status = 'buyer_connected';
  this.addToTimeline('buyer_connected', 'Buyer connected to contract', buyerId);
  await this.save();
};

tradeContractSchema.methods.approveBuyer = async function() {
  this.buyerApproval.approved = true;
  this.buyerApproval.approvedAt = new Date();
  this.status = 'buyer_approved';
  this.addToTimeline('buyer_approved', 'Buyer approved the contract', this.buyer);
  await this.save();
};

tradeContractSchema.methods.rejectBuyer = async function(reason) {
  this.buyerApproval.approved = false;
  this.buyerApproval.rejectedAt = new Date();
  this.buyerApproval.rejectionReason = reason;
  this.status = 'buyer_rejected';
  this.addToTimeline('buyer_rejected', 'Buyer rejected the contract', this.buyer, { reason });
  await this.save();
};

tradeContractSchema.methods.depositCommission = async function(transactionId, amount, walletTransactionId) {
  this.commissionDeposit = {
    transactionId,
    amount,
    depositedAt: new Date(),
    walletTransactionId
  };
  this.commission.status = 'deposited';
  this.commission.depositedAt = new Date();
  this.commission.netAmount = amount;
  this.status = 'commission_deposited';

  this.financials = {
    commissionGrossAmount: amount,
    platformFeeAmount: 0,
    marketerNetAmount: amount,
    settlementStatus: 'blocked_for_future_release'
  };

  this.addToTimeline('commission_deposited', 'Commission deposited by buyer', this.buyer, { amount });
  await this.save();
};

tradeContractSchema.methods.shareContacts = async function(chatId) {
  this.chat = chatId;
  this.status = 'contacts_shared';
  this.addToTimeline('contacts_shared', 'Contacts shared between buyer and seller');
  await this.save();
};

tradeContractSchema.methods.createDeal = async function(dealId) {
  this.deal = dealId;
  this.status = 'deal_created';
  this.addToTimeline('deal_created', 'Deal created', null, { dealId });
  await this.save();
};

tradeContractSchema.methods.markPaymentMethod = async function(paymentMethod) {
  this.paymentMethodUsed = paymentMethod;
  await this.save();
};

tradeContractSchema.methods.releaseCommission = async function(usedFobinoSecure = true) {
  if (!usedFobinoSecure) {
    const feePercent = 10;
    this.commission.fobinoFee = Math.floor(this.commission.amount * (feePercent / 100));
    this.commission.status = 'released_with_fee';
  } else {
    this.commission.fobinoFee = 0;
    this.commission.status = 'released';
  }

  this.commission.releasedAt = new Date();
  this.status = 'completed';
  this.completedAt = new Date();

  const netCommission = this.commission.amount - this.commission.fobinoFee;
  this.commission.netAmount = netCommission;

  this.financials = {
    commissionGrossAmount: this.commission.amount,
    platformFeeAmount: this.commission.fobinoFee,
    marketerNetAmount: netCommission,
    settlementStatus: 'released_to_beneficiary'
  };

  this.addToTimeline('commission_released', 'Commission released to marketer', null, {
    grossCommission: this.commission.amount,
    fobinoFee: this.commission.fobinoFee,
    netCommission,
    usedFobinoSecure
  });

  await this.save();
  return netCommission;
};

tradeContractSchema.methods.cancel = async function(reason, userId) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  if (this.commission?.status === 'deposited') {
    this.commission.status = 'refunded';
  }

  this.financials = {
    commissionGrossAmount: this.commission?.amount || 0,
    platformFeeAmount: 0,
    marketerNetAmount: 0,
    settlementStatus: 'refunded_to_buyer'
  };

  this.addToTimeline('cancelled', 'Contract cancelled', userId, { reason });
  await this.save();
};

module.exports = mongoose.model('TradeContract', tradeContractSchema);