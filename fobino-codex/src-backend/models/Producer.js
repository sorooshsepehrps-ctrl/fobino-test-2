const mongoose = require('mongoose');

const producerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Company/Facility Info
  companyName: {
    type: String,
    required: [true, 'نام شرکت الزامی است'],
    maxlength: 200
  },
  companyNameEn: String,
  registrationNumber: String,
  nationalId: String,
  economicCode: String,
  
  // Contact Info
  contact: {
    phone: String,
    fax: String,
    email: String,
    website: String
  },
  
  // Address
  address: {
    province: String,
    city: String,
    street: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Facility Info
  facility: {
    type: {
      type: String,
      enum: ['factory', 'workshop', 'warehouse', 'farm', 'mine', 'other'],
      required: true
    },
    area: Number,  // Square meters
    employees: Number,
    yearEstablished: Number,
    description: String,
    photos: [{
      url: String,
      publicId: String,
      caption: String
    }],
    equipments: [String],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      documentUrl: String
    }]
  },
  
  // Production Info
  production: {
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    products: [{
      name: String,
      description: String,
      monthlyCapacity: Number,
      unit: String,
      minOrder: Number
    }],
    monthlyCapacity: String,
    exportCapacity: Boolean,
    exportCountries: [String]
  },
  
  // Catalog
  catalog: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  
  // Annual Needs
  annualNeeds: [{
    year: Number,
    items: [{
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      productName: String,
      quantity: Number,
      unit: String,
      specifications: String,
      estimatedBudget: Number,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent']
      },
      deadline: Date,
      status: {
        type: String,
        enum: ['pending', 'sourcing', 'fulfilled', 'cancelled'],
        default: 'pending'
      }
    }],
    submittedAt: Date
  }],
  
  // Consultation Sessions
  consultations: [{
    type: {
      type: String,
      enum: ['export', 'import', 'marketing', 'technical', 'financial', 'legal']
    },
    requestedAt: Date,
    scheduledAt: Date,
    consultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['requested', 'scheduled', 'completed', 'cancelled'],
      default: 'requested'
    },
    notes: String,
    rating: Number,
    feedback: String
  }],
  
  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'pending'
  },
  
  // Badge
  badge: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'none'
  },
  
  // Statistics
  stats: {
    totalDeals: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
producerSchema.index({ user: 1 });
producerSchema.index({ companyName: 'text', companyNameEn: 'text' });
producerSchema.index({ 'production.categories': 1 });
producerSchema.index({ status: 1 });
producerSchema.index({ isVerified: 1 });
producerSchema.index({ badge: 1 });

// Get facility type label
producerSchema.methods.getFacilityTypeLabel = function() {
  const labels = {
    factory: 'کارخانه',
    workshop: 'کارگاه',
    warehouse: 'انبار',
    farm: 'مزرعه',
    mine: 'معدن',
    other: 'سایر'
  };
  return labels[this.facility.type] || this.facility.type;
};

// Add annual need
producerSchema.methods.addAnnualNeed = async function(year, items) {
  const existingYear = this.annualNeeds.find(n => n.year === year);
  
  if (existingYear) {
    existingYear.items.push(...items);
    existingYear.submittedAt = new Date();
  } else {
    this.annualNeeds.push({
      year,
      items,
      submittedAt: new Date()
    });
  }
  
  return this.save();
};

// Request consultation
producerSchema.methods.requestConsultation = async function(type, notes = '') {
  this.consultations.push({
    type,
    requestedAt: new Date(),
    notes,
    status: 'requested'
  });
  
  return this.save();
};

// Update badge based on performance
producerSchema.methods.updateBadge = async function() {
  const { totalDeals, totalRevenue, successRate, rating } = this.stats;
  
  let newBadge = 'none';
  
  if (totalDeals >= 100 && successRate >= 95 && rating >= 4.5) {
    newBadge = 'platinum';
  } else if (totalDeals >= 50 && successRate >= 90 && rating >= 4.0) {
    newBadge = 'gold';
  } else if (totalDeals >= 20 && successRate >= 85 && rating >= 3.5) {
    newBadge = 'silver';
  } else if (totalDeals >= 5 && successRate >= 80) {
    newBadge = 'bronze';
  }
  
  if (this.badge !== newBadge) {
    this.badge = newBadge;
    await this.save();
  }
  
  return newBadge;
};

// Static method to get producers by category
producerSchema.statics.getByCategory = async function(categoryId, options = {}) {
  const { page = 1, limit = 20 } = options;
  
  const query = {
    'production.categories': categoryId,
    status: 'active',
    isVerified: true
  };
  
  const total = await this.countDocuments(query);
  const producers = await this.find(query)
    .sort({ badge: -1, 'stats.rating': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'firstName lastName profileImage')
    .lean();
  
  return {
    producers,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  };
};

module.exports = mongoose.model('Producer', producerSchema);
