const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Ticket Number
  ticketNumber: {
    type: String,
    unique: true
  },
  
  // User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Ticket Details
  subject: {
    type: String,
    required: [true, 'موضوع تیکت الزامی است'],
    maxlength: [200, 'موضوع نمی‌تواند بیش از ۲۰۰ کاراکتر باشد']
  },
  category: {
    type: String,
    enum: [
      'general',
      'technical',
      'payment',
      'subscription',
      'verification',
      'deal',
      'dispute',
      'report',
      'suggestion',
      'other'
    ],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Initial message
  message: {
    type: String,
    required: [true, 'پیام تیکت الزامی است'],
    maxlength: [5000, 'پیام نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد']
  },
  
  // Attachments
  attachments: [{
    url: String,
    publicId: String,
    name: String,
    type: String,
    size: Number
  }],
  
  // Related entities
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  relatedDispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  
  // Status
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Responses
  responses: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: {
      type: String,
      required: true,
      maxlength: 5000
    },
    attachments: [{
      url: String,
      name: String,
      type: String
    }],
    isStaff: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Rating
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  },
  
  // Timestamps
  firstResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  
  // Internal notes (visible only to staff)
  internalNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Tags
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });

// Generate ticket number
ticketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    }) + 1;
    this.ticketNumber = `TK${year}${month}${day}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for response count
ticketSchema.virtual('responseCount').get(function() {
  return this.responses.length;
});

// Virtual for average response time
ticketSchema.virtual('responseTime').get(function() {
  if (!this.firstResponseAt) return null;
  return this.firstResponseAt - this.createdAt;
});

// Assign ticket
ticketSchema.methods.assign = async function(staffId) {
  this.assignedTo = staffId;
  this.assignedAt = new Date();
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  return this.save();
};

// Add response
ticketSchema.methods.addResponse = async function(userId, message, attachments = [], isStaff = false) {
  this.responses.push({
    user: userId,
    message,
    attachments,
    isStaff,
    createdAt: new Date()
  });
  
  if (!this.firstResponseAt && isStaff) {
    this.firstResponseAt = new Date();
  }
  
  // Update status based on who responded
  if (isStaff) {
    this.status = 'waiting_user';
  } else if (this.status === 'waiting_user') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Add internal note
ticketSchema.methods.addInternalNote = async function(staffId, note) {
  this.internalNotes.push({
    note,
    addedBy: staffId,
    addedAt: new Date()
  });
  return this.save();
};

// Resolve ticket
ticketSchema.methods.resolve = async function(staffId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

// Close ticket
ticketSchema.methods.close = async function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

// Reopen ticket
ticketSchema.methods.reopen = async function() {
  this.status = 'open';
  this.resolvedAt = null;
  this.closedAt = null;
  return this.save();
};

// Rate ticket
ticketSchema.methods.rate = async function(score, feedback) {
  this.rating = {
    score,
    feedback,
    ratedAt: new Date()
  };
  return this.save();
};

// Get category label
ticketSchema.methods.getCategoryLabel = function() {
  const labels = {
    general: 'عمومی',
    technical: 'فنی',
    payment: 'پرداخت',
    subscription: 'اشتراک',
    verification: 'احراز هویت',
    deal: 'معامله',
    dispute: 'اختلاف',
    report: 'گزارش',
    suggestion: 'پیشنهاد',
    other: 'سایر'
  };
  return labels[this.category] || this.category;
};

// Get priority label
ticketSchema.methods.getPriorityLabel = function() {
  const labels = {
    low: 'کم',
    medium: 'متوسط',
    high: 'زیاد',
    urgent: 'فوری'
  };
  return labels[this.priority] || this.priority;
};

module.exports = mongoose.model('Ticket', ticketSchema);
