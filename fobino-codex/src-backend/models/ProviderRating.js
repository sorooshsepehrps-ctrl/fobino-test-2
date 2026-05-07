const mongoose = require('mongoose');

const providerRatingSchema = new mongoose.Schema({
  rfp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DropshippingRFP',
    required: true,
    index: true
  },
  
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  dropshipper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DropshippingProduct',
    required: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  productQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  
  packaging: {
    type: Number,
    min: 1,
    max: 5
  },
  
  deliverySpeed: {
    type: Number,
    min: 1,
    max: 5
  },
  
  communication: {
    type: Number,
    min: 1,
    max: 5
  },
  
  comment: {
    type: String,
    maxlength: 1000
  },
  
  images: [{
    url: String,
    publicId: String
  }],
  
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden'],
    default: 'published'
  },
  
  providerResponse: {
    comment: String,
    respondedAt: Date
  },
  
  helpful: {
    type: Number,
    default: 0
  },
  
  notHelpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

providerRatingSchema.index({ provider: 1, status: 1 });
providerRatingSchema.index({ rfp: 1 }, { unique: true });

providerRatingSchema.statics.calculateProviderAverageRating = async function(providerId) {
  const ratings = await this.find({ 
    provider: providerId, 
    status: 'published' 
  });
  
  if (ratings.length === 0) return null;
  
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / ratings.length;
  
  const avgProductQuality = ratings.reduce((sum, r) => sum + (r.productQuality || 0), 0) / ratings.length;
  const avgPackaging = ratings.reduce((sum, r) => sum + (r.packaging || 0), 0) / ratings.length;
  const avgDeliverySpeed = ratings.reduce((sum, r) => sum + (r.deliverySpeed || 0), 0) / ratings.length;
  const avgCommunication = ratings.reduce((sum, r) => sum + (r.communication || 0), 0) / ratings.length;
  
  return {
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: ratings.length,
    productQuality: Math.round(avgProductQuality * 10) / 10,
    packaging: Math.round(avgPackaging * 10) / 10,
    deliverySpeed: Math.round(avgDeliverySpeed * 10) / 10,
    communication: Math.round(avgCommunication * 10) / 10
  };
};

module.exports = mongoose.model('ProviderRating', providerRatingSchema);
