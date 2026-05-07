const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  // Sender
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related Post
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  
  // Campaign Details
  campaignName: {
    type: String,
    maxlength: 100
  },
  message: {
    type: String,
    required: [true, 'متن پیام الزامی است'],
    maxlength: [500, 'متن پیام نمی‌تواند بیش از ۵۰۰ کاراکتر باشد']
  },
  
  // Recipients
  recipients: [{
    phone: {
      type: String,
      required: true,
      match: [/^09\d{9}$/, 'شماره تلفن نامعتبر است']
    },
    name: String,
    inviteCode: {
      type: String,
      unique: true,
      sparse: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'clicked', 'registered', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    clickedAt: Date,
    registeredAt: Date,
    failedReason: String,
    
    // If recipient registered
    registeredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Chat created from invitation
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  }],
  
  // Statistics
  stats: {
    totalRecipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    registered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  
  // Pricing
  pricing: {
    costPerMessage: { type: Number, default: 15000 },
    totalCost: Number,
    transactionId: String,
    paidAt: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending_payment', 'processing', 'completed', 'cancelled', 'partial'],
    default: 'pending_payment'
  },
  
  // Schedule
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
invitationSchema.index({ sender: 1, createdAt: -1 });
invitationSchema.index({ post: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ 'recipients.inviteCode': 1 });
invitationSchema.index({ 'recipients.phone': 1 });

// Generate invite codes before saving
invitationSchema.pre('save', function(next) {
  this.recipients.forEach(recipient => {
    if (!recipient.inviteCode) {
      recipient.inviteCode = crypto.randomBytes(8).toString('hex');
    }
  });
  
  // Update stats
  this.stats.totalRecipients = this.recipients.length;
  this.stats.sent = this.recipients.filter(r => r.status !== 'pending').length;
  this.stats.delivered = this.recipients.filter(r => ['delivered', 'clicked', 'registered'].includes(r.status)).length;
  this.stats.clicked = this.recipients.filter(r => ['clicked', 'registered'].includes(r.status)).length;
  this.stats.registered = this.recipients.filter(r => r.status === 'registered').length;
  this.stats.failed = this.recipients.filter(r => r.status === 'failed').length;
  
  next();
});

// Calculate total cost
invitationSchema.methods.calculateCost = function() {
  return this.recipients.length * this.pricing.costPerMessage;
};

// Mark recipient as sent
invitationSchema.methods.markSent = async function(phone) {
  const recipient = this.recipients.find(r => r.phone === phone);
  if (recipient) {
    recipient.status = 'sent';
    recipient.sentAt = new Date();
    await this.save();
  }
};

// Mark recipient as delivered
invitationSchema.methods.markDelivered = async function(phone) {
  const recipient = this.recipients.find(r => r.phone === phone);
  if (recipient) {
    recipient.status = 'delivered';
    recipient.deliveredAt = new Date();
    await this.save();
  }
};

// Mark recipient as clicked
invitationSchema.methods.markClicked = async function(inviteCode) {
  const recipient = this.recipients.find(r => r.inviteCode === inviteCode);
  if (recipient && !['clicked', 'registered'].includes(recipient.status)) {
    recipient.status = 'clicked';
    recipient.clickedAt = new Date();
    await this.save();
  }
  return recipient;
};

// Mark recipient as registered
invitationSchema.methods.markRegistered = async function(inviteCode, userId, chatId = null) {
  const recipient = this.recipients.find(r => r.inviteCode === inviteCode);
  if (recipient) {
    recipient.status = 'registered';
    recipient.registeredAt = new Date();
    recipient.registeredUser = userId;
    if (chatId) recipient.chat = chatId;
    await this.save();
  }
  return recipient;
};

// Mark recipient as failed
invitationSchema.methods.markFailed = async function(phone, reason) {
  const recipient = this.recipients.find(r => r.phone === phone);
  if (recipient) {
    recipient.status = 'failed';
    recipient.failedReason = reason;
    await this.save();
  }
};

// Get invite link
invitationSchema.methods.getInviteLink = function(inviteCode) {
  const baseUrl = process.env.FRONTEND_URL || 'https://fobino.com';
  return `${baseUrl}/invite/${inviteCode}`;
};

// Static method to find by invite code
invitationSchema.statics.findByInviteCode = async function(inviteCode) {
  return this.findOne({ 'recipients.inviteCode': inviteCode })
    .populate('sender', 'firstName lastName profileImage')
    .populate('post', 'title images type pricePerUnit');
};

// Static method to get sender stats
invitationSchema.statics.getSenderStats = async function(senderId) {
  const invitations = await this.find({ sender: senderId });
  
  return invitations.reduce((acc, inv) => ({
    totalCampaigns: acc.totalCampaigns + 1,
    totalRecipients: acc.totalRecipients + inv.stats.totalRecipients,
    totalSent: acc.totalSent + inv.stats.sent,
    totalDelivered: acc.totalDelivered + inv.stats.delivered,
    totalClicked: acc.totalClicked + inv.stats.clicked,
    totalRegistered: acc.totalRegistered + inv.stats.registered,
    totalCost: acc.totalCost + (inv.pricing.totalCost || 0)
  }), {
    totalCampaigns: 0,
    totalRecipients: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalClicked: 0,
    totalRegistered: 0,
    totalCost: 0
  });
};

module.exports = mongoose.model('Invitation', invitationSchema);
