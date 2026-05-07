const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  // Dispute Number
  disputeNumber: {
    type: String,
    unique: true
  },
  
  // Related Deal
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },
  
  // Parties
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
  
  // Who opened the dispute
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Dispute Details
  reason: {
    type: String,
    enum: [
      'product_not_received',
      'product_damaged',
      'wrong_product',
      'quality_issue',
      'quantity_mismatch',
      'late_delivery',
      'seller_no_response',
      'buyer_no_response',
      'payment_issue',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: [true, 'توضیحات اختلاف الزامی است'],
    maxlength: [5000, 'توضیحات نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد']
  },
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'message', 'tracking']
    },
    url: String,
    publicId: String,
    description: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_review', 'pending_response', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Assigned Judge
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Responses from parties
  responses: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    evidence: [{
      type: { type: String },
      url: String,
      description: String
    }],
    respondedAt: { type: Date, default: Date.now }
  }],
  
  // Verdict
  verdict: {
    decision: {
      type: String,
      enum: ['buyer', 'seller', 'shared', 'cancel']
    },
    buyerShare: { type: Number, min: 0, max: 100 },
    sellerShare: { type: Number, min: 0, max: 100 },
    reason: String,
    details: String,
    issuedAt: Date,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Execution of verdict
  execution: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'executed', 'failed'],
      default: 'pending'
    },
    buyerAmount: Number,
    sellerAmount: Number,
    executedAt: Date,
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionIds: [String],
    notes: String
  },
  
  // Appeal
  appeal: {
    isAppealed: { type: Boolean, default: false },
    appealedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appealedAt: Date,
    appealReason: String,
    appealStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected']
    },
    appealVerdict: {
      decision: String,
      reason: String,
      issuedAt: Date,
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  
  // Timeline
  timeline: [{
    action: String,
    description: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now }
  }],
  
  // Resolution
  resolvedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
disputeSchema.index({ disputeNumber: 1 });
disputeSchema.index({ deal: 1 });
disputeSchema.index({ buyer: 1 });
disputeSchema.index({ seller: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ assignedTo: 1 });
disputeSchema.index({ createdAt: -1 });

// Generate dispute number
disputeSchema.pre('save', async function(next) {
  if (this.isNew && !this.disputeNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.disputeNumber = `DSP${year}${month}${count.toString().padStart(5, '0')}`;
  }
  next();
});

// Add timeline entry
disputeSchema.methods.addTimeline = async function(action, description, userId) {
  this.timeline.push({
    action,
    description,
    performedBy: userId,
    performedAt: new Date()
  });
  await this.save();
};

// Assign to judge
disputeSchema.methods.assignJudge = async function(judgeId) {
  this.assignedTo = judgeId;
  this.assignedAt = new Date();
  this.status = 'assigned';
  
  await this.addTimeline('assigned', 'اختلاف به داور تخصیص داده شد', judgeId);
  
  return this.save();
};

// Add response
disputeSchema.methods.addResponse = async function(userId, message, evidence = []) {
  this.responses.push({
    from: userId,
    message,
    evidence,
    respondedAt: new Date()
  });
  
  if (this.status === 'pending_response') {
    this.status = 'in_review';
  }
  
  await this.addTimeline('response_added', 'پاسخ جدید ثبت شد', userId);
  
  return this.save();
};

// Issue verdict
disputeSchema.methods.issueVerdict = async function(decision, buyerShare, sellerShare, reason, details, judgeId) {
  this.verdict = {
    decision,
    buyerShare,
    sellerShare,
    reason,
    details,
    issuedAt: new Date(),
    issuedBy: judgeId
  };
  this.status = 'resolved';
  this.resolvedAt = new Date();
  
  await this.addTimeline('verdict_issued', `رأی صادر شد: ${decision}`, judgeId);
  
  return this.save();
};

// Execute verdict
disputeSchema.methods.executeVerdict = async function(buyerAmount, sellerAmount, transactionIds, adminId) {
  this.execution = {
    status: 'executed',
    buyerAmount,
    sellerAmount,
    executedAt: new Date(),
    executedBy: adminId,
    transactionIds
  };
  this.status = 'closed';
  
  await this.addTimeline('verdict_executed', 'رأی اجرا شد', adminId);
  
  return this.save();
};

// Appeal
disputeSchema.methods.fileAppeal = async function(userId, reason) {
  if (this.appeal.isAppealed) {
    throw new Error('درخواست تجدیدنظر قبلاً ثبت شده است');
  }
  
  this.appeal = {
    isAppealed: true,
    appealedBy: userId,
    appealedAt: new Date(),
    appealReason: reason,
    appealStatus: 'pending'
  };
  this.status = 'in_review';
  
  await this.addTimeline('appeal_filed', 'درخواست تجدیدنظر ثبت شد', userId);
  
  return this.save();
};

// Get reason label
disputeSchema.methods.getReasonLabel = function() {
  const labels = {
    product_not_received: 'محصول دریافت نشده',
    product_damaged: 'محصول آسیب دیده',
    wrong_product: 'محصول اشتباه',
    quality_issue: 'مشکل کیفیت',
    quantity_mismatch: 'عدم تطابق مقدار',
    late_delivery: 'تاخیر در تحویل',
    seller_no_response: 'عدم پاسخگویی فروشنده',
    buyer_no_response: 'عدم پاسخگویی خریدار',
    payment_issue: 'مشکل پرداخت',
    other: 'سایر'
  };
  return labels[this.reason] || this.reason;
};

module.exports = mongoose.model('Dispute', disputeSchema);
