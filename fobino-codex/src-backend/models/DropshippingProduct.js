const mongoose = require('mongoose');

const dropshippingProductSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  productName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  brand: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  images: [{
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  }],
  
  retailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  location: {
    province: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    postalCode: String
  },
  
  shippingTime: {
    value: { type: Number, required: true },
    unit: { 
      type: String, 
      enum: ['روز', 'هفته', 'ماه'],
      required: true 
    }
  },
  
  specifications: [{
    key: String,
    value: String
  }],
  
  categories: {
    level1: {
      id: mongoose.Schema.Types.ObjectId,
      name: String
    },
    level2: {
      id: mongoose.Schema.Types.ObjectId,
      name: String
    },
    level3: {
      id: mongoose.Schema.Types.ObjectId,
      name: String
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
    index: true
  },
  
  stats: {
    views: { type: Number, default: 0 },
    requests: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 }
  },
  
  providerCommission: {
    type: Number,
    default: 90,
    min: 0,
    max: 100
  },
  
  fobinoFeePercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

dropshippingProductSchema.virtual('primaryImage').get(function() {
  const primary = this.images?.find(img => img.isPrimary);
  return primary || this.images?.[0];
});

dropshippingProductSchema.virtual('rfps', {
  ref: 'DropshippingRFP',
  localField: '_id',
  foreignField: 'product'
});

dropshippingProductSchema.index({ provider: 1, status: 1 });
dropshippingProductSchema.index({ productName: 'text', description: 'text', brand: 'text' });

dropshippingProductSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

dropshippingProductSchema.methods.incrementRequests = function() {
  this.stats.requests += 1;
  return this.save();
};

dropshippingProductSchema.methods.updateStock = function(quantity) {
  this.stockQuantity += quantity;
  if (this.stockQuantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.status === 'out_of_stock') {
    this.status = 'active';
  }
  return this.save();
};

module.exports = mongoose.model('DropshippingProduct', dropshippingProductSchema);
