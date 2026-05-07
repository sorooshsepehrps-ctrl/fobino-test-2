/* backend/src/models/Post.js */
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['sell', 'buy'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'عنوان آگهی الزامی است'],
    trim: true,
    maxlength: [200, 'عنوان نمی‌تواند بیش از ۲۰۰ کاراکتر باشد']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'توضیحات آگهی الزامی است'],
    maxlength: [5000, 'توضیحات نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد']
  },

  // === HIERARCHICAL CATEGORIES ===
  categoryLevel1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categoryLevel2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categoryLevel3: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  // === POST ENHANCEMENTS ===
  isNardeban: {
    type: Boolean,
    default: false
  },
  nardebanExpiresAt: Date,
  nardebanPayment: {
    amount: Number,
    transactionId: String,
    paidAt: Date,
    duration: { type: Number, default: 24 } // hours
  },
  
  isSpecial: {
    type: Boolean,
    default: false
  },
  specialExpiresAt: Date,
  specialPayment: {
    amount: Number,
    transactionId: String,
    paidAt: Date,
    duration: { type: Number, default: 168 } // 7 days
  },

  // === COMMON FIELDS ===
status: {
  type: String,
  enum: ['active', 'inactive', 'pending', 'sold', 'expired', 'deleted', 'rejected', 'draft'],
  default: 'pending'
},
  rejectionReason: String,
  
  // Featured (platform featured, different from user-paid enhancements)
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  featuredUntil: Date,
  
  // Statistics
  stats: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    offers: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    contactViews: { type: Number, default: 0 }
  },
  
  // Contact access tracking - NEW FIELD
  contactAccessHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accessedAt: {
      type: Date,
      default: Date.now
    },
    quotaUsed: {
      type: Boolean,
      default: true
    }
  }],
  
  // Tags for search
  keywords: [{
    type: String,
    maxlength: [50, 'کلمه کلیدی نمی‌تواند بیش از ۵۰ کاراکتر باشد']
  }],

  // Expiry
  expiresAt: Date,
  
  // === SELL POST SPECIFIC FIELDS ===
  productName: {
    type: String,
    required: function() { return this.type === 'sell'; },
    maxlength: [100, 'نام محصول نمی‌تواند بیش از ۱۰۰ کاراکتر باشد']
  },
  brand: {
    type: String,
    required: function() { return this.type === 'sell'; },
    maxlength: [50, 'برند نمی‌تواند بیش از ۵۰ کاراکتر باشد']
  },
  productType: {
    type: String,
    enum: ['new', 'used', 'refurbished', 'wholesale', 'retail']
  },
  
  // Location
  province: {
    type: String
  },
  city: {
    type: String
  },
  address: String,
  
  // Sales Options
  dropShipping: {
    type: Boolean,
    default: false
  },
  needsMarketer: {
    type: Boolean,
    default: false
  },
  marketerPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Product Details
  unit: {
    type: String,
    enum: ['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box', 'container', 'pallet'],
    default: 'kg'
  },
  availableQuantity: {
    type: Number,
    min: [0, 'موجودی نمی‌تواند منفی باشد']
  },
  minOrder: {
    type: Number,
    min: [0, 'حداقل سفارش نمی‌تواند منفی باشد']
  },
  minPricePerUnit: {
    type: Number,
    min: [0, 'حداقل قیمت نمی‌تواند منفی باشد']
  },
  maxPricePerUnit: {
    type: Number,
    min: [0, 'حداکثر قیمت نمی‌تواند منفی باشد']
  },
  
  // Discount
  hasDiscount: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  discountUntil: Date,
  
  // Images (up to 8 total - 4 product + 4 certificate)
  productImages: [{
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ['product', 'certificate', 'factory', 'other'],
      default: 'product'
    },
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Key Features
  keyFeatures: [{
    name: {
      type: String,
      required: true,
      maxlength: [50, 'نام ویژگی نمی‌تواند بیش از ۵۰ کاراکتر باشد']
    },
    value: {
      type: String,
      required: true,
      maxlength: [100, 'مقدار ویژگی نمی‌تواند بیش از ۱۰۰ کاراکتر باشد']
    }
  }],

  // === BUY POST SPECIFIC FIELDS ===
  neededProductName: {
    type: String,
    required: function() { return this.type === 'buy'; },
    maxlength: [100, 'نام محصول مورد نیاز نمی‌تواند بیش از ۱۰۰ کاراکتر باشد']
  },
  neededProductType: {
    type: String,
    required: function() { return this.type === 'buy'; },
    maxlength: [100, 'نوع محصول مورد نیاز نمی‌تواند بیش از ۱۰۰ کاراکتر باشد']
  },
  
  // Quantity and Unit for Buy Post
  neededQuantity: {
    type: Number,
    min: [0, 'میزان نیازمندی نمی‌تواند منفی باشد']
  },
  neededUnit: {
    type: String,
    enum: ['ton', 'kg', 'gram', 'meter', 'sqm', 'piece', 'pack', 'roll', 'liter', 'box', 'container', 'pallet'],
    default: 'kg'
  },
  
  // Usage Type
  usageType: {
    type: String,
    enum: ['domestic', 'export', 'both'],
    default: 'domestic'
  },
  
  // Expiry Date for Request
  requestExpiry: Date,
  
  // Payment Methods for Buy Post
  paymentMethods: [{
    type: String,
    enum: ['cash', 'fobino_secure', 'installment', 'credit', 'other']
  }],
  
  // Delivery Location for Buy Post
  deliveryProvince: String,
  deliveryCity: String,
  deliveryAddress: String,
  
  // Maximum Price (for Buy Post)
  maxBudget: {
    type: Number,
    min: [0, 'بودجه نمی‌تواند منفی باشد']
  },
  
  // Additional Requirements
  additionalRequirements: String,

  // International
  isInternational: { type: Boolean, default: false },
  currencies: [{
    currency: { type: String, enum: ['IRR', 'USD', 'EUR', 'AED', 'TRY'] },
    price: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ user: 1 });
postSchema.index({ type: 1 });
postSchema.index({ categoryLevel1: 1 });
postSchema.index({ categoryLevel2: 1 });
postSchema.index({ categoryLevel3: 1 });
postSchema.index({ status: 1 });
postSchema.index({ isNardeban: -1, nardebanExpiresAt: -1 });
postSchema.index({ isSpecial: -1, specialExpiresAt: -1 });
postSchema.index({ isFeatured: -1, featuredUntil: -1 });
postSchema.index({ province: 1, city: 1 });
postSchema.index({ deliveryProvince: 1, deliveryCity: 1 });
postSchema.index({ minPricePerUnit: 1 });
postSchema.index({ maxPricePerUnit: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ slug: 1 });
postSchema.index({ keywords: 1 });
postSchema.index({ expiresAt: 1 });
postSchema.index({ 'stats.views': -1 });
postSchema.index({ 'contactAccessHistory.user': 1 }); // NEW INDEX

// Text index for search
postSchema.index({ 
  title: 'text', 
  description: 'text', 
  productName: 'text',
  neededProductName: 'text',
  brand: 'text',
  keywords: 'text'
}, {
  weights: {
    title: 10,
    productName: 8,
    neededProductName: 8,
    brand: 5,
    keywords: 3,
    description: 1
  },
  name: 'PostTextIndex'
});

// Virtual for primary image
postSchema.virtual('primaryImage').get(function() {
  if (!this.productImages || this.productImages.length === 0) return null;
  const primary = this.productImages.find(img => img.isPrimary);
  return primary ? primary.url : this.productImages[0].url;
});

// Virtual for display price
postSchema.virtual('displayPrice').get(function() {
  if (this.type === 'sell') {
    if (this.minPricePerUnit && this.maxPricePerUnit) {
      if (this.minPricePerUnit === this.maxPricePerUnit) {
        return `${this.minPricePerUnit?.toLocaleString()} ریال`;
      }
      return `${this.minPricePerUnit?.toLocaleString()} - ${this.maxPricePerUnit?.toLocaleString()} ریال`;
    }
    return 'توافقی';
  }
  
  if (this.type === 'buy' && this.maxBudget) {
    return `تا ${this.maxBudget.toLocaleString()} ریال`;
  }
  
  return 'توافقی';
});

// Virtual for checking if nardeban/special is active
postSchema.virtual('isNardebanActive').get(function() {
  return this.isNardeban && (!this.nardebanExpiresAt || this.nardebanExpiresAt > new Date());
});

postSchema.virtual('isSpecialActive').get(function() {
  return this.isSpecial && (!this.specialExpiresAt || this.specialExpiresAt > new Date());
});

// Virtual for priority score (for sorting)
postSchema.virtual('priorityScore').get(function() {
  let score = 0;
  if (this.isNardebanActive) score += 1000;
  if (this.isSpecialActive) score += 500;
  if (this.isFeatured) score += 100;
  
  // Add score based on remaining time
  if (this.expiresAt) {
    const daysLeft = Math.ceil((this.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 3) score += 50; // Urgent posts
  }
  
  return score;
});

// Virtual for contact access count
postSchema.virtual('contactAccessCount').get(function() {
  return this.contactAccessHistory ? this.contactAccessHistory.length : 0;
});

// Virtual for unique contact viewers count
postSchema.virtual('uniqueContactViewers').get(function() {
  if (!this.contactAccessHistory || this.contactAccessHistory.length === 0) {
    return 0;
  }
  const uniqueUserIds = new Set(
    this.contactAccessHistory.map(access => access.user.toString())
  );
  return uniqueUserIds.size;
});

// Generate slug before saving
postSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('title')) {
    const slugify = require('slugify');
    const baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      locale: 'fa'
    });
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Set default expiry if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

// Update user stats after save
postSchema.post('save', async function() {
  if (this.isNew) {
    await mongoose.model('User').findByIdAndUpdate(this.user, {
      $inc: { 'stats.totalPosts': 1 }
    });
  }
});

// Methods
postSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  await this.save();
};

postSchema.methods.incrementContactViews = async function() {
  this.stats.contactViews += 1;
  await this.save();
};

postSchema.methods.addKeyword = async function(keyword) {
  if (!this.keywords.includes(keyword)) {
    this.keywords.push(keyword);
    await this.save();
  }
};

postSchema.methods.addKeyFeature = async function(name, value) {
  this.keyFeatures.push({ name, value });
  await this.save();
};

postSchema.methods.addProductImage = async function(imageData) {
  // Check if we can add more images (max 8)
  if (this.productImages.length >= 8) {
    throw new Error('حداکثر ۸ تصویر می‌توانید آپلود کنید');
  }
  
  this.productImages.push(imageData);
  await this.save();
};

postSchema.methods.setPrimaryImage = async function(imageIndex) {
  if (imageIndex >= 0 && imageIndex < this.productImages.length) {
    // Reset all to non-primary
    this.productImages.forEach(img => {
      img.isPrimary = false;
    });
    
    // Set the selected one as primary
    this.productImages[imageIndex].isPrimary = true;
    await this.save();
  }
};

postSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Check if user has accessed contact details
postSchema.methods.hasUserAccessedContacts = function(userId) {
  if (!this.contactAccessHistory || this.contactAccessHistory.length === 0) {
    return false;
  }
  return this.contactAccessHistory.some(
    access => access.user.toString() === userId.toString()
  );
};

// Record contact access
postSchema.methods.recordContactAccess = async function(userId, usedQuota = true) {
  const existingAccess = this.contactAccessHistory?.find(
    access => access.user.toString() === userId.toString()
  );
  
  if (existingAccess) {
    // Update existing access
    existingAccess.accessedAt = new Date();
    existingAccess.quotaUsed = existingAccess.quotaUsed || usedQuota;
  } else {
    // Add new access
    if (!this.contactAccessHistory) {
      this.contactAccessHistory = [];
    }
    this.contactAccessHistory.push({
      user: userId,
      accessedAt: new Date(),
      quotaUsed: usedQuota
    });
  }
  
  // Increment contact views
  this.stats.contactViews += 1;
  
  return this.save();
};

// Get user's contact access info
postSchema.methods.getUserContactAccessInfo = function(userId) {
  if (!this.contactAccessHistory || this.contactAccessHistory.length === 0) {
    return null;
  }
  
  const userAccess = this.contactAccessHistory.find(
    access => access.user.toString() === userId.toString()
  );
  
  return userAccess || null;
};

// Check if can activate nardeban
postSchema.methods.canActivateNardeban = function() {
  return this.status === 'active' && !this.isNardebanActive;
};

// Check if can activate special
postSchema.methods.canActivateSpecial = function() {
  return this.status === 'active' && !this.isSpecialActive;
};

// Activate nardeban
postSchema.methods.activateNardeban = async function(durationHours = 24, paymentData = {}) {
  this.isNardeban = true;
  this.nardebanExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  this.nardebanPayment = {
    amount: 100000, // 10,000 Toman = 100,000 Rials
    transactionId: paymentData.transactionId,
    paidAt: paymentData.paidAt || new Date(),
    duration: durationHours
  };
  await this.save();
};

// Activate special
postSchema.methods.activateSpecial = async function(durationHours = 168, paymentData = {}) {
  this.isSpecial = true;
  this.specialExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  this.specialPayment = {
    amount: 50000, // 5,000 Toman = 50,000 Rials
    transactionId: paymentData.transactionId,
    paidAt: paymentData.paidAt || new Date(),
    duration: durationHours
  };
  await this.save();
};

// Static methods
postSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

postSchema.statics.findByCategory = function(categoryLevel3Id, options = {}) {
  const query = { 
    categoryLevel3: categoryLevel3Id,
    status: 'active',
    expiresAt: { $gt: new Date() }
  };
  
  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

postSchema.statics.findNardebanPosts = function() {
  return this.find({
    isNardeban: true,
    nardebanExpiresAt: { $gt: new Date() },
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ nardebanExpiresAt: -1 });
};

postSchema.statics.findSpecialPosts = function() {
  return this.find({
    isSpecial: true,
    specialExpiresAt: { $gt: new Date() },
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ specialExpiresAt: -1 });
};

postSchema.statics.findExpiredNardeban = function() {
  return this.find({
    isNardeban: true,
    nardebanExpiresAt: { $lt: new Date() }
  });
};

postSchema.statics.findExpiredSpecial = function() {
  return this.find({
    isSpecial: true,
    specialExpiresAt: { $lt: new Date() }
  });
};

postSchema.statics.findPostsWithContactAccessByUser = function(userId) {
  return this.find({
    'contactAccessHistory.user': userId
  }).populate('user', 'firstName lastName');
};

module.exports = mongoose.model('Post', postSchema);














