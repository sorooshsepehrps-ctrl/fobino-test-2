const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  // Related entities
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  
  // Parties
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Offer Details
  pricePerUnit: {
    type: Number,
    required: [true, 'قیمت واحد الزامی است'],
    min: [0, 'قیمت نمی‌تواند منفی باشد']
  },
  quantity: {
    type: Number,
    required: [true, 'مقدار الزامی است'],
    min: [0, 'مقدار نمی‌تواند منفی باشد']
  },
  unit: {
    type: String,
    enum: ['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box'],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  
  // Delivery
  deliveryDays: {
    type: Number,
    required: [true, 'مدت تحویل الزامی است'],
    min: [1, 'حداقل مدت تحویل ۱ روز است']
  },
  deliveryAddress: {
    province: String,
    city: String,
    address: String
  },
  
  // Payment Terms
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'installment'],
    default: 'cash'
  },
  paymentTerms: String,
  
  // Multi-stage delivery
  isMultiStage: { type: Boolean, default: false },
  stages: [{
    stageNumber: Number,
    quantity: Number,
    deliveryDays: Number,
    price: Number,
    description: String
  }],
  
  // Additional terms
  terms: String,
  notes: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled'],
    default: 'pending'
  },
  
  // Response
  response: {
    message: String,
    respondedAt: Date
  },
  
  // Counter offer
  counterOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  parentOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  },
  
  // Deal created from this offer
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  
  // Message in chat
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
offerSchema.index({ post: 1 });
offerSchema.index({ chat: 1 });
offerSchema.index({ sender: 1 });
offerSchema.index({ receiver: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ expiresAt: 1 });

// Calculate total price before saving
offerSchema.pre('save', function(next) {
  if (this.isModified('pricePerUnit') || this.isModified('quantity')) {
    this.totalPrice = this.pricePerUnit * this.quantity;
  }
  next();
});

// Check if offer is expired
offerSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Accept offer
offerSchema.methods.accept = async function(message = '') {
  if (this.status !== 'pending') {
    throw new Error('این پیشنهاد قابل پذیرش نیست');
  }
  if (this.isExpired()) {
    this.status = 'expired';
    await this.save();
    throw new Error('این پیشنهاد منقضی شده است');
  }
  
  this.status = 'accepted';
  this.response = {
    message,
    respondedAt: new Date()
  };
  await this.save();
  
  // Update post stats
  const Post = mongoose.model('Post');
  await Post.findByIdAndUpdate(this.post, {
    $inc: { 'stats.offers': 1 }
  });
  
  return this;
};

// Reject offer
offerSchema.methods.reject = async function(message = '') {
  if (this.status !== 'pending') {
    throw new Error('این پیشنهاد قابل رد نیست');
  }
  
  this.status = 'rejected';
  this.response = {
    message,
    respondedAt: new Date()
  };
  await this.save();
  return this;
};

// Create counter offer
offerSchema.methods.createCounterOffer = async function(counterData) {
  if (this.status !== 'pending') {
    throw new Error('نمی‌توان برای این پیشنهاد پیشنهاد متقابل ارسال کرد');
  }
  
  this.status = 'countered';
  await this.save();
  
  const counterOffer = new this.constructor({
    ...counterData,
    post: this.post,
    chat: this.chat,
    sender: this.receiver,
    receiver: this.sender,
    parentOffer: this._id
  });
  
  await counterOffer.save();
  
  this.counterOffer = counterOffer._id;
  await this.save();
  
  return counterOffer;
};

// Cancel offer
offerSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('این پیشنهاد قابل لغو نیست');
  }
  
  this.status = 'cancelled';
  await this.save();
  return this;
};

// Get formatted summary
offerSchema.methods.getSummary = function() {
  const unitLabels = {
    ton: 'تن', kg: 'کیلوگرم', gram: 'گرم',
    meter: 'متر', sqm: 'متر مربع', piece: 'عدد',
    pack: 'بسته', roll: 'رول', liter: 'لیتر', box: 'جعبه'
  };
  
  return {
    pricePerUnit: `${this.pricePerUnit.toLocaleString()} ریال`,
    quantity: `${this.quantity} ${unitLabels[this.unit] || this.unit}`,
    totalPrice: `${this.totalPrice.toLocaleString()} ریال`,
    deliveryDays: `${this.deliveryDays} روز`
  };
};

module.exports = mongoose.model('Offer', offerSchema);
