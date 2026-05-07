const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
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

  location: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    default: 0
  },

  inspectionFee: {
    type: Number,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },

  paymentTransactionId: String,
  paidAt: Date,

  result: {
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
      'paid',
      'inspected',
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

inspectionSchema.index({ deal: 1 });
inspectionSchema.index({ buyer: 1 });
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Inspection', inspectionSchema);