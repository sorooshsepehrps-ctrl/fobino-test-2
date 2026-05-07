const mongoose = require('mongoose');

const visitCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  cardCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  
  logo: {
    url: String,
    publicId: String
  },
  
  socialMedia: [{
    platform: {
      type: String,
      enum: ['instagram', 'telegram', 'whatsapp', 'facebook', 'twitter', 'linkedin', 'website'],
      required: true
    },
    username: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  description: {
    type: String,
    maxlength: 500
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending',
    index: true
  },
  
  stats: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },
  
  rejectionReason: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

visitCardSchema.pre('save', async function(next) {
  if (this.isNew && !this.cardCode) {
    const count = await this.constructor.countDocuments();
    this.cardCode = `VC-${Date.now()}-${count + 1}`;
  }
  next();
});

visitCardSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

visitCardSchema.methods.incrementShares = function() {
  this.stats.shares += 1;
  return this.save();
};

visitCardSchema.methods.incrementClicks = function() {
  this.stats.clicks += 1;
  return this.save();
};

visitCardSchema.methods.verifySocialMedia = function(platformIndex, adminId) {
  if (this.socialMedia[platformIndex]) {
    this.socialMedia[platformIndex].verified = true;
    this.socialMedia[platformIndex].verifiedAt = new Date();
    this.socialMedia[platformIndex].verifiedBy = adminId;
  }
  return this.save();
};

module.exports = mongoose.model('VisitCard', visitCardSchema);
