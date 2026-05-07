const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_created', 'user_updated', 'user_banned', 'user_unbanned',
      'user_verified', 'user_rejected', 'user_role_changed',
      
      // Post actions
      'post_approved', 'post_rejected', 'post_deleted', 'post_featured',
      
      // Deal actions
      'deal_updated', 'deal_cancelled', 'escrow_released', 'escrow_refunded',
      
      // Subscription actions
      'subscription_updated', 'subscription_cancelled',
      
      // Financial actions
      'withdrawal_approved', 'withdrawal_rejected', 'deposit_manual',
      
      // Dispute actions
      'dispute_assigned', 'dispute_verdict', 'dispute_executed',
      
      // Category actions
      'category_created', 'category_updated', 'category_deleted',
      
      // System actions
      'system_config_updated', 'exchange_rate_updated',
      
      // Support actions
      'ticket_responded', 'ticket_closed', 'chat_intervened'
    ]
  },
  
  // Target entity
  targetType: {
    type: String,
    enum: ['user', 'post', 'deal', 'subscription', 'dispute', 'ticket', 
           'category', 'transaction', 'chat', 'system']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  
  // Description
  description: {
    type: String,
    required: true
  },
  
  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    reason: String,
    notes: String
  },
  
  // Severity
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Indexes
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1 });
adminLogSchema.index({ createdAt: -1 });

// Static method to create log
adminLogSchema.statics.log = async function(adminId, action, targetType, targetId, description, options = {}) {
  const log = new this({
    admin: adminId,
    action,
    targetType,
    targetId,
    description,
    changes: options.changes || {},
    metadata: {
      ip: options.ip,
      userAgent: options.userAgent,
      reason: options.reason,
      notes: options.notes
    },
    severity: options.severity || 'info'
  });
  
  return log.save();
};

// Static method to get admin activity
adminLogSchema.statics.getAdminActivity = async function(adminId, options = {}) {
  const { page = 1, limit = 50, action, startDate, endDate } = options;
  
  const query = { admin: adminId };
  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const total = await this.countDocuments(query);
  const logs = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  return {
    logs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  };
};

// Static method to get logs for target
adminLogSchema.statics.getTargetLogs = async function(targetType, targetId) {
  return this.find({ targetType, targetId })
    .sort({ createdAt: -1 })
    .populate('admin', 'firstName lastName')
    .lean();
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
