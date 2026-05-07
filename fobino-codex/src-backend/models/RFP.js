const mongoose = require('mongoose');

const rfpSchema = new mongoose.Schema({
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
  
  clientInfo: {
    companyName: String,
    industry: String,
    province: String,
    city: String,
    estimatedOrderSize: Number,
    estimatedBudget: Number,
    requirementsDescription: String,
    timeline: String,
    additionalNotes: String
  },
  
  proposedTerms: {
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
    amount: Number
  },
  
  status: {
    type: String,
    enum: [
      'draft',
      'waiting_seller_approval',
      'waiting_marketer_approval',
      'seller_editing',
      'marketer_editing',
      'approved',
      'rejected_by_seller',
      'rejected_by_marketer'
    ],
    default: 'draft'
  },
  
  negotiationHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'edited', 'approved', 'rejected'],
      required: true
    },
    changes: mongoose.Schema.Types.Mixed,
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  currentVersion: {
    type: Number,
    default: 1
  },
  
  approvedBySeller: {
    type: Boolean,
    default: false
  },
  
  approvedByMarketer: {
    type: Boolean,
    default: false
  },
  
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

rfpSchema.index({ marketingRequest: 1 });
rfpSchema.index({ seller: 1 });
rfpSchema.index({ marketer: 1 });
rfpSchema.index({ status: 1 });
rfpSchema.index({ createdAt: -1 });

rfpSchema.virtual('tradeContract', {
  ref: 'TradeContract',
  localField: '_id',
  foreignField: 'rfp',
  justOne: true
});

rfpSchema.methods.addToHistory = function(userId, action, changes, comment) {
  this.negotiationHistory.push({
    editedBy: userId,
    action,
    changes,
    comment,
    timestamp: new Date()
  });
  this.currentVersion += 1;
};

rfpSchema.methods.submitForSellerApproval = async function(marketerId) {
  this.status = 'waiting_seller_approval';
  this.approvedByMarketer = true;
  this.approvedBySeller = false;
  this.addToHistory(marketerId, 'edited', this.toObject(), 'RFP submitted for seller approval');
  await this.save();
};

rfpSchema.methods.approveAsSeller = async function(sellerId) {
  this.approvedBySeller = true;
  this.addToHistory(sellerId, 'approved', {}, 'RFP approved by seller');
  
  if (this.approvedByMarketer && this.approvedBySeller) {
    this.status = 'approved';
    this.approvedAt = new Date();
  } else {
    this.status = 'waiting_marketer_approval';
  }
  
  await this.save();
};

rfpSchema.methods.approveAsMarketer = async function(marketerId) {
  this.approvedByMarketer = true;
  this.addToHistory(marketerId, 'approved', {}, 'RFP approved by marketer');
  
  if (this.approvedByMarketer && this.approvedBySeller) {
    this.status = 'approved';
    this.approvedAt = new Date();
  } else {
    this.status = 'waiting_seller_approval';
  }
  
  await this.save();
};

rfpSchema.methods.editAsSeller = async function(sellerId, updates, comment) {
  Object.assign(this, updates);
  this.approvedBySeller = false;
  this.approvedByMarketer = false;
  this.status = 'waiting_marketer_approval';
  this.addToHistory(sellerId, 'edited', updates, comment);
  await this.save();
};

rfpSchema.methods.editAsMarketer = async function(marketerId, updates, comment) {
  Object.assign(this, updates);
  this.approvedBySeller = false;
  this.approvedByMarketer = false;
  this.status = 'waiting_seller_approval';
  this.addToHistory(marketerId, 'edited', updates, comment);
  await this.save();
};

rfpSchema.methods.rejectAsSeller = async function(sellerId, reason) {
  this.status = 'rejected_by_seller';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.addToHistory(sellerId, 'rejected', {}, reason);
  await this.save();
};

rfpSchema.methods.rejectAsMarketer = async function(marketerId, reason) {
  this.status = 'rejected_by_marketer';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.addToHistory(marketerId, 'rejected', {}, reason);
  await this.save();
};

module.exports = mongoose.model('RFP', rfpSchema);
