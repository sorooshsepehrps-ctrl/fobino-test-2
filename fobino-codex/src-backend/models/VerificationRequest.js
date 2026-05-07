const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Target level
  targetLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  currentLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  
  // Documents based on target level
  documents: {
    // Level 1: Basic Profile (automatically completed)
    
    // Level 2: Identity Verification
    nationalCard: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    birthCertificate: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    selfieWithCard: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    
    // Level 3: Business Verification
    businessLicense: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    businessPhotos: [{
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    catalog: {
      url: String,
      publicId: String,
      uploadedAt: Date
    },
    
    // Level 4: Bank Verification
    bankCardImage: {
      url: String,
      publicId: String,
      uploadedAt: Date
    }
  },
  
  // Additional Info
  additionalInfo: {
    // For Level 2
    nationalCode: String,
    birthDate: Date,
    fatherName: String,
    
    // For Level 3
    businessName: String,
    businessType: String,
    businessAddress: String,
    employeeCount: Number,
    yearEstablished: Number,
    
    // For Level 4
    shaba: String,
    bankName: String,
    cardNumber: String,
    accountHolder: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'requires_resubmit'],
    default: 'pending'
  },
  
  // Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  
  // Rejection
  rejectionReason: String,
  rejectionDetails: String,
  
  // Resubmit tracking
  resubmitCount: { type: Number, default: 0 },
  previousSubmissions: [{
    submittedAt: Date,
    status: String,
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date
  }],
  
  // Notes
  adminNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
verificationRequestSchema.index({ user: 1, targetLevel: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ createdAt: -1 });

// Required documents per level
verificationRequestSchema.statics.requiredDocuments = {
  2: ['nationalCard', 'selfieWithCard'],
  3: ['businessLicense'],
  4: ['bankCardImage']
};

verificationRequestSchema.statics.requiredInfo = {
  2: ['nationalCode'],
  3: ['businessName', 'businessType'],
  4: ['shaba', 'bankName', 'cardNumber', 'accountHolder']
};

// Validate documents for level
verificationRequestSchema.methods.validateDocuments = function() {
  const required = this.constructor.requiredDocuments[this.targetLevel] || [];
  const missing = [];
  
  for (const doc of required) {
    if (!this.documents[doc] || !this.documents[doc].url) {
      missing.push(doc);
    }
  }
  
  return { isValid: missing.length === 0, missing };
};

// Validate additional info for level
verificationRequestSchema.methods.validateInfo = function() {
  const required = this.constructor.requiredInfo[this.targetLevel] || [];
  const missing = [];
  
  for (const field of required) {
    if (!this.additionalInfo[field]) {
      missing.push(field);
    }
  }
  
  return { isValid: missing.length === 0, missing };
};

// Submit for review
verificationRequestSchema.methods.submit = async function() {
  const docValidation = this.validateDocuments();
  const infoValidation = this.validateInfo();
  
  if (!docValidation.isValid || !infoValidation.isValid) {
    throw new Error(`مدارک ناقص: ${[...docValidation.missing, ...infoValidation.missing].join(', ')}`);
  }
  
  this.status = 'pending';
  return this.save();
};

// Approve request
verificationRequestSchema.methods.approve = async function(adminId) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  
  // Update user level
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, {
    level: this.targetLevel,
    levelStatus: 'approved',
    [`verifications.${this.getLevelVerificationField()}`]: true
  });
  
  return this.save();
};

// Reject request
verificationRequestSchema.methods.reject = async function(adminId, reason, details = '') {
  // Save current submission to history
  this.previousSubmissions.push({
    submittedAt: this.createdAt,
    status: 'rejected',
    rejectionReason: reason,
    reviewedBy: adminId,
    reviewedAt: new Date()
  });
  
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.rejectionDetails = details;
  
  // Update user
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, {
    levelStatus: 'rejected'
  });
  
  return this.save();
};

// Request resubmit
verificationRequestSchema.methods.requestResubmit = async function(adminId, reason) {
  this.status = 'requires_resubmit';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.resubmitCount += 1;
  
  return this.save();
};

// Get level verification field
verificationRequestSchema.methods.getLevelVerificationField = function() {
  const fields = {
    2: 'identity',
    3: 'business',
    4: 'bank'
  };
  return fields[this.targetLevel] || 'identity';
};

// Add admin note
verificationRequestSchema.methods.addNote = async function(adminId, note) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    addedAt: new Date()
  });
  return this.save();
};

// Static method to get pending requests
verificationRequestSchema.statics.getPendingRequests = async function(options = {}) {
  const { page = 1, limit = 20, targetLevel } = options;
  
  const query = { status: { $in: ['pending', 'in_review'] } };
  if (targetLevel) query.targetLevel = targetLevel;
  
  const total = await this.countDocuments(query);
  const requests = await this.find(query)
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'firstName lastName phone email profileImage')
    .lean();
  
  return {
    requests,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  };
};

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
