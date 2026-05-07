const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'شماره تلفن الزامی است'],
    unique: true,
    match: [/^09\d{9}$/, 'شماره تلفن نامعتبر است']
  },
  publicSlug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    maxlength: 80
  },
  password: {
    type: String,
    minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
    select: false
  },
  
  // User Type: حقیقی (individual) or حقوقی (company)
  userType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  
  // Individual user info
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'نام نمی‌تواند بیش از ۵۰ کاراکتر باشد']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'نام خانوادگی نمی‌تواند بیش از ۵۰ کاراکتر باشد']
  },
  
  // Company info (for حقوقی users)
  companyInfo: {
    companyName: String,
    economicCode: String, // کد اقتصادی
    nationalId: String,   // شناسه ملی
    registrationNumber: String // شماره ثبت
  },
  
  email: {
    type: String,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'ایمیل نامعتبر است']
  },
  website: String,
  profileImage: String,
  businessCard: String,
  galleryImages: [String], // تصاویر مرتبط
  certificates: [String],  // مدارک من
  about: {
    type: String,
    maxlength: [2000, 'توضیحات نمی‌تواند بیش از ۲۰۰۰ کاراکتر باشد']
  },
  
  publicProfile: {
    bio: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    avatar: {
      url: String,
      publicId: String
    },
    city: String,
    province: String,
    website: String,
    socialLinks: {
      instagram: String,
      linkedin: String,
      telegram: String,
      website: String
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },

  profileCompletionPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  identityVerificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },

  producerVerificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },

  // Display settings
  showPhoneToSellers: {
    type: Boolean,
    default: false
  },
  sellerStatus: {
    type: String,
    enum: ['available', 'busy', 'away', 'offline'],
    default: 'available'
  },
  wantsCollaboration: {
    type: Boolean,
    default: false
  },

  // User Levels (0-5)
  // Level 0: Basic registration
  // Level 1: National card uploaded (کارت ملی)
  // Level 2: Bank info verified (شبا) - Required for posts
  // Level 3-5: Additional verifications
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  levelVerifications: {
    level1: { // کارت ملی
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String
    },
    level2: { // شماره شبا
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String
    },
    level3: { // مدارک تکمیلی
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String
    },
    level4: { // تایید نهایی
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String
    },
    level5: { // VIP
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
      submittedAt: Date,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String
    }
  },

  // Identity Documents
  documents: {
    nationalCard: String,
    birthCertificate: String,
    selfieWithCard: String,
    businessLicense: String,
    businessPhotos: [String],
    catalog: String,
    shabaNumber: String,
    bankCardImage: String
  },

  // Bank Information
  bankInfo: {
    shaba: {
      type: String,
      match: [/^IR\d{24}$/, 'شماره شبا نامعتبر است']
    },
    bankName: String,
    cardNumber: {
      type: String,
      match: [/^\d{16}$/, 'شماره کارت نامعتبر است']
    },
    accountHolder: String
  },

  // Scores
  scores: {
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    productQuality: { type: Number, default: 50, min: 0, max: 100 },
    responseRate: { type: Number, default: 100, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 }
  },

  reviewStats: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    fiveStarsCount: { type: Number, default: 0, min: 0 },
    fourStarsCount: { type: Number, default: 0, min: 0 },
    threeStarsCount: { type: Number, default: 0, min: 0 },
    twoStarsCount: { type: Number, default: 0, min: 0 },
    oneStarCount: { type: Number, default: 0, min: 0 }
  },

  // Statistics
  stats: {
    totalPosts: { type: Number, default: 0 },
    totalDeals: { type: Number, default: 0 },
    successfulDeals: { type: Number, default: 0 },
    failedDeals: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending'],
    default: 'active'
  },
  banInfo: {
    isBanned: { type: Boolean, default: false },
    reason: String,
    bannedUntil: Date,
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Roles
  roles: [{
    type: String,
    enum: ['user', 'support', 'judge', 'admin'],
    default: 'user'
  }],

  // Marketer Status
  isMarketer: {
    type: Boolean,
    default: false
  },
  marketerVerification: {
    status: { 
      type: String, 
      enum: ['not_requested', 'pending', 'approved', 'rejected'], 
      default: 'not_requested' 
    },
    requestedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Dropshipping Status
  isProvider: {
    type: Boolean,
    default: false
  },
  isDropshipper: {
    type: Boolean,
    default: false
  },
  providerVerifiedAt: Date,
  dropshipperVerifiedAt: Date,

  // Location
  location: {
    province: String,
    city: String,
    address: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Verifications
  verifications: {
    phone: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    identity: { type: Boolean, default: false },
    business: { type: Boolean, default: false },
    bank: { type: Boolean, default: false }
  },

  // Phone Verification
  phoneVerification: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },

  // Password Reset
  passwordReset: {
    token: String,
    expiresAt: Date
  },

  // Login tracking
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,

  // Refresh Token
  refreshToken: String,

  // Settings
  settings: {
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'fa' },
    currency: { type: String, default: 'IRR' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'location.province': 1, 'location.city': 1 });
userSchema.index({ status: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ level: 1 });
userSchema.index({ identityVerificationStatus: 1 });
userSchema.index({ producerVerificationStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name / display name
userSchema.virtual('fullName').get(function() {
  if (this.userType === 'company' && this.companyInfo?.companyName) {
    return this.companyInfo.companyName;
  }
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || 'کاربر فوبینو';
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const fields = [
    { check: this.phone, weight: 10 },
    { check: this.firstName, weight: 10 },
    { check: this.lastName, weight: 10 },
    { check: this.profileImage, weight: 15 },
    { check: this.about, weight: 15 },
    { check: this.location?.province, weight: 10 },
    { check: this.location?.city, weight: 10 },
    { check: this.location?.address, weight: 10 },
    { check: this.email, weight: 5 },
    { check: this.website, weight: 5 }
  ];
  fields.forEach(f => { if (f.check) completion += f.weight; });
  return completion;
});

// Virtual for membership duration in days
userSchema.virtual('membershipDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

userSchema.pre('validate', function(next) {
  if (!this.publicSlug) {
    const baseName =
      this.publicProfile?.businessName ||
      this.companyInfo?.companyName ||
      [this.firstName, this.lastName].filter(Boolean).join(' ') ||
      'user';

    const baseSlug = slugify(baseName, {
      lower: true,
      strict: true,
      trim: true,
      locale: 'fa'
    }) || 'user';

    const suffix = this._id ? this._id.toString().slice(-6) : Math.random().toString(36).slice(2, 8);
    this.publicSlug = `${baseSlug}-${suffix}`;
  }

  if (!this.publicProfile) this.publicProfile = {};

  if (!this.publicProfile.bio && this.about) this.publicProfile.bio = this.about;
  if (!this.publicProfile.businessName && this.companyInfo?.companyName) {
    this.publicProfile.businessName = this.companyInfo.companyName;
  }
  if (!this.publicProfile.avatar?.url && this.profileImage) {
    this.publicProfile.avatar = { url: this.profileImage };
  }
  if (!this.publicProfile.city && this.location?.city) this.publicProfile.city = this.location.city;
  if (!this.publicProfile.province && this.location?.province) this.publicProfile.province = this.location.province;
  if (!this.publicProfile.website && this.website) this.publicProfile.website = this.website;

  this.profileCompletionPercent = this.profileCompletion;

  if (this.verifications?.identity || this.level >= 1) {
    this.identityVerificationStatus = 'verified';
  } else if (
    this.levelVerifications?.level1?.status === 'pending' ||
    this.levelVerifications?.level2?.status === 'pending'
  ) {
    this.identityVerificationStatus = 'pending';
  }

  if (this.providerVerifiedAt) {
    this.producerVerificationStatus = 'verified';
  } else if (this.isProvider) {
    this.producerVerificationStatus = 'pending';
  }

  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // 1 hour
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    publicSlug: this.publicSlug,
    profileImage: this.profileImage,
    publicProfile: {
      bio: this.publicProfile?.bio || this.about,
      businessName: this.publicProfile?.businessName || this.companyInfo?.companyName,
      avatar: this.publicProfile?.avatar?.url ? this.publicProfile.avatar : { url: this.profileImage },
      city: this.publicProfile?.city || this.location?.city,
      province: this.publicProfile?.province || this.location?.province,
      website: this.publicProfile?.website || this.website,
      socialLinks: this.publicProfile?.socialLinks || {},
      isPublic: this.publicProfile?.isPublic !== false
    },
    level: this.level,
    profileCompletionPercent: this.profileCompletionPercent || this.profileCompletion,
    identityVerificationStatus: this.identityVerificationStatus,
    producerVerificationStatus: this.producerVerificationStatus,
    scores: this.scores,
    reviewStats: this.reviewStats,
    stats: {
      totalDeals: this.stats.totalDeals,
      successfulDeals: this.stats.successfulDeals
    },
    verifications: this.verifications,
    location: {
      province: this.location?.province,
      city: this.location?.city
    },
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

// userSchema.methods.getPublicProfile =()=>{
//   return{
//     user._Id: 1,
//     user.role: 'admin',
//     user.method:'wholesalor',

//   }
// }


// userShcama.method=()=>{
//   return {
//    user._id:`${new user.id}`,

//   }
// }



// useEffect(() => {
//     const fetchColors = async () => {
//       const token = getToken();
//       if (!token) return;
      
//       try {
//         const response = await getColors(token);  
        
//       if(user.id !== 'admin'){
//           res.json.stringify('user not found')
//       }     
        
//         const colorList = response.results || response || [];
        
//         // Enhance colors with default color codes
//         const enhancedColors = enhanceColorData(colorList);
//         setAvailableColors(enhancedColors);
//       } catch (err) {
//         console.error('Failed to fetch colors:', err);
//       }
//     };
    
//     fetchColors();
//   }, [getToken, enhanceColorData]);
