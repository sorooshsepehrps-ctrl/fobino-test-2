const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealNumber: {
    type: String,
    unique: true
  },

  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Store the roles that were used when creating this deal (for chats without predefined roles)
dealRoles: {
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  explicitlySet: {
    type: Boolean,
    default: false
  }
},

  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },

  tradeContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeContract'
  },

  category: {
    level1: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    level2: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    level3: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  unit: {
    type: String,
    enum: ['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box'],
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  terms: String,

  paymentMethod: {
    type: String,
    enum: ['fobino_secure', 'credit', 'tahator', 'cash'],
    required: true
  },

  preContract: {
    percentage: { type: Number, min: 1, max: 100 },
    amount: { type: Number, default: 0 },
    transactionId: String,
    depositedAt: Date
  },

  commission: {
    rate: { type: Number, default: 1 },
    amount: { type: Number, default: 0 }
  },

  financials: {
    escrowAmount: { type: Number, default: 0 },
    platformFeeAmount: { type: Number, default: 0 },
    sellerNetAmount: { type: Number, default: 0 },
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
      'pending',
      'open',
      'shipped',
      'delivered',
      'confirmed',
      'completed',
      'disputed',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },

  shipping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipping'
  },
  inspection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inspection'
  },

  dispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },

  cancellation: {
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundTransactionId: String
  },

  history: [{
    action: String,
    status: String,
    description: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],

  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
dealSchema.index({ dealNumber: 1 });
dealSchema.index({ buyer: 1 });
dealSchema.index({ seller: 1 });
dealSchema.index({ chat: 1 });
dealSchema.index({ status: 1 });
dealSchema.index({ status: 1, completedAt: -1 });
dealSchema.index({ createdAt: -1 });
dealSchema.index({ 'dealRoles.buyer': 1 });
dealSchema.index({ 'dealRoles.seller': 1 });

// Virtuals
dealSchema.virtual('isCompleted').get(function() {
  return ['confirmed', 'completed'].includes(this.status) || Boolean(this.completedAt);
});

dealSchema.virtual('isReviewable').get(function() {
  return ['confirmed', 'completed'].includes(this.status) || Boolean(this.completedAt);
});

// Method to get effective buyer (considering deal-specific roles)
dealSchema.methods.getEffectiveBuyer = function() {
  if (this.dealRoles && this.dealRoles.explicitlySet && this.dealRoles.buyer) {
    return this.dealRoles.buyer;
  }
  return this.buyer;
};

// Method to get effective seller (considering deal-specific roles)
dealSchema.methods.getEffectiveSeller = function() {
  if (this.dealRoles && this.dealRoles.explicitlySet && this.dealRoles.seller) {
    return this.dealRoles.seller;
  }
  return this.seller;
};

// Method to check if user is buyer for this specific deal
dealSchema.methods.isBuyer = function(userId) {
  const effectiveBuyer = this.getEffectiveBuyer();
  return effectiveBuyer && effectiveBuyer.toString() === userId.toString();
};

// Method to check if user is seller for this specific deal
dealSchema.methods.isSeller = function(userId) {
  const effectiveSeller = this.getEffectiveSeller();
  return effectiveSeller && effectiveSeller.toString() === userId.toString();
};

// Method to check if user is participant in this deal
dealSchema.methods.isParticipant = function(userId) {
  return this.isBuyer(userId) || this.isSeller(userId);
};

// Pre-save middleware
dealSchema.pre('save', async function(next) {
  if (this.isNew && !this.dealNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.dealNumber = `FD${year}${month}${count.toString().padStart(6, '0')}`;
  }

  if (this.isNew || this.isModified('pricePerUnit') || this.isModified('count')) {
    this.totalPrice = this.pricePerUnit * this.count;
  }

  if (this.paymentMethod === 'fobino_secure') {
    this.commission.amount = Math.floor(this.totalPrice * (this.commission.rate / 100));
    if (this.preContract?.percentage) {
      this.preContract.amount = Math.floor(this.totalPrice * (this.preContract.percentage / 100));
    }

    if (this.preContract?.amount) {
      this.financials.escrowAmount = this.preContract.amount;
      this.financials.platformFeeAmount = Math.floor(
        this.preContract.amount * (this.commission.rate / 100)
      );
      this.financials.sellerNetAmount =
        this.financials.escrowAmount - this.financials.platformFeeAmount;
    }
  }

  // Set dealRoles if not already set and creating a deal without predefined chat roles
  if (this.isNew && !this.dealRoles.explicitlySet) {
    // Check if chat has predefined roles
    const Chat = mongoose.model('Chat');
    const chat = await Chat.findById(this.chat);
    const buyerParticipant = chat?.participants?.find(p => p.role === 'buyer');
    const sellerParticipant = chat?.participants?.find(p => p.role === 'seller');
    
    // If chat doesn't have predefined roles, use the buyer/seller from the deal
    if (!buyerParticipant || !sellerParticipant) {
      this.dealRoles = {
        buyer: this.buyer,
        seller: this.seller,
        explicitlySet: true
      };
    }
  }

  next();
});

// Method to add history entry
dealSchema.methods.addHistory = async function(action, status, description, userId, metadata = {}) {
  this.history.push({
    action,
    status,
    description,
    performedBy: userId,
    performedAt: new Date(),
    metadata
  });
  await this.save();
};

dealSchema.methods.openDispute = async function(disputeId, userId, reason) {
  this.status = 'disputed';
  this.dispute = disputeId;

  await this.addHistory('dispute_opened', 'disputed', reason, userId);

  return this.save();
};

module.exports = mongoose.model('Deal', dealSchema);