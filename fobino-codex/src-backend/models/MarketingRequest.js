const mongoose = require('mongoose');

const marketingRequestSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  productName: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  brand: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  images: [{
    url: String,
    publicId: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  catalogue: {
    url: String,
    publicId: String,
    fileName: String
  },
  
  priceVolumes: [{
    volume: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box', 'container', 'pallet'],
      required: true
    }
  }],
  
  cityOfProduction: {
    province: String,
    city: String
  },
  
  shippingTimeAvailable: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    }
  },
  
  specifications: [{
    key: {
      type: String,
      required: true,
      maxlength: 100
    },
    value: {
      type: String,
      required: true,
      maxlength: 200
    }
  }],
  
  paymentTypes: [{
    type: String,
    enum: ['fobino_secure', 'cash'],
    required: true
  }],
  
  categories: {
    level1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    level2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    },
    level3: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    }
  },
  
  commissionPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  acceptedBy: [{
    marketer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    acceptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  stats: {
    views: { type: Number, default: 0 },
    interested: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

marketingRequestSchema.index({ seller: 1 });
marketingRequestSchema.index({ status: 1 });
marketingRequestSchema.index({ 'acceptedBy.marketer': 1 });
marketingRequestSchema.index({ 'categories.level1': 1 });
marketingRequestSchema.index({ 'categories.level2': 1 });
marketingRequestSchema.index({ 'categories.level3': 1 });
marketingRequestSchema.index({ createdAt: -1 });

marketingRequestSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : this.images[0].url;
});

marketingRequestSchema.virtual('rfps', {
  ref: 'RFP',
  localField: '_id',
  foreignField: 'marketingRequest'
});

marketingRequestSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  await this.save();
};

marketingRequestSchema.methods.acceptByMarketer = async function(marketerId) {
  const alreadyAccepted = this.acceptedBy?.some(entry => entry.marketer.toString() === marketerId.toString());
  if (alreadyAccepted) {
    return;
  }
  this.acceptedBy.push({ marketer: marketerId, acceptedAt: new Date() });
  await this.save();
};

module.exports = mongoose.model('MarketingRequest', marketingRequestSchema);
