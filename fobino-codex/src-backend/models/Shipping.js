const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema({
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    required: true
  },

  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  shippingCity: {
    type: String,
    required: true,
    trim: true
  },

  deliveryCity: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    default: 0
  },
  
  shippingFee: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },

  settlementStatus: {
    type: String,
    enum: ['none', 'paid'],
    default: 'none'
  },

  paymentTransactionId: String,
  paidAt: Date,

  trackingCode: {
    type: String,
    trim: true
  },
  
  factor: {
    imageUrl: String,
    cloudinaryId: String,
    uploadedAt: Date
  },

  status: {
    type: String,
    enum: [
      'pending',
      'estimated',
      'agreed',
      'disagreed',
      'shipped',
      'waiting_for_factor',
      'factored'
    ],
    default: 'pending'
  },

  history: [{
    action: String,
    status: String,
    description: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

shippingSchema.index({ deal: 1 });
shippingSchema.index({ buyer: 1 });
shippingSchema.index({ status: 1 });
shippingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Shipping', shippingSchema);