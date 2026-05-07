const mongoose = require('mongoose');

const dropshippingAgreementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  role: {
    type: String,
    enum: ['provider', 'dropshipper'],
    required: true
  },
  
  agreementVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  
  termsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  
  acceptedAt: {
    type: Date
  },
  
  ipAddress: {
    type: String
  },
  
  userAgent: {
    type: String
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'terminated'],
    default: 'pending',
    index: true
  },
  
  businessInfo: {
    businessName: { type: String, required: true },
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership'],
      required: true
    },
    registrationNumber: String,
    taxId: String,
    address: {
      province: String,
      city: String,
      street: String,
      postalCode: String
    },
    phone: String,
    email: String
  },
  
  bankInfo: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    iban: String,
    shabaNumber: String
  },
  
  identityVerification: {
    nationalIdCard: {
      url: String,
      publicId: String,
      verified: { type: Boolean, default: false }
    },
    businessLicense: {
      url: String,
      publicId: String,
      verified: { type: Boolean, default: false }
    },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  commissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  
  suspensionReason: String,
  suspendedAt: Date,
  
  terminationReason: String,
  terminatedAt: Date,
  
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

dropshippingAgreementSchema.methods.activate = function(adminId) {
  this.status = 'active';
  this.termsAccepted = true;
  this.acceptedAt = new Date();
  this.identityVerification.verified = true;
  this.identityVerification.verifiedAt = new Date();
  this.identityVerification.verifiedBy = adminId;
  return this.save();
};

dropshippingAgreementSchema.methods.suspend = function(reason) {
  this.status = 'suspended';
  this.suspensionReason = reason;
  this.suspendedAt = new Date();
  return this.save();
};

dropshippingAgreementSchema.methods.terminate = function(reason) {
  this.status = 'terminated';
  this.terminationReason = reason;
  this.terminatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('DropshippingAgreement', dropshippingAgreementSchema);
