const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification Details
  type: {
    type: String,
    enum: [
      'new_message',
      'new_chat',
      'new_offer',
      'offer_accepted',
      'offer_rejected',
      'offer_countered',
      'deal_created',
      'deal_updated',
      'payment_received',
      'product_shipped',
      'delivery_confirmed',
      'deal_completed',
      'dispute_opened',
      'dispute_resolved',
      'subscription_expiring',
      'subscription_expired',
      'verification_approved',
      'verification_rejected',
      'new_post',
      'post_approved',
      'post_rejected',
      'withdrawal_processed',
      'withdrawal_rejected',
      'system',
      'promotion'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Related entities
  data: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    extra: mongoose.Schema.Types.Mixed
  },
  
  // Action URL
  actionUrl: String,
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: Date,
  
  // Delivery status
  delivered: {
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  
  // Expiry
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, type, title, message, data = {}, actionUrl = null) {
  const notification = new this({
    user: userId,
    type,
    title,
    message,
    data,
    actionUrl
  });
  
  return notification.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  
  const query = { user: userId };
  if (unreadOnly) query.isRead = false;
  
  const total = await this.countDocuments(query);
  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  return {
    notifications,
    unreadCount: await this.getUnreadCount(userId),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

// Notification templates
notificationSchema.statics.templates = {
  newMessage: (senderName) => ({
    title: 'پیام جدید',
    message: `${senderName} پیام جدیدی برای شما ارسال کرد`
  }),
  newChat: ({ senderName, postTitle }) => ({
    title: 'گفتگوی جدید',
    message: `${senderName} گفتگوی جدیدی برای آگهی "${postTitle}" ایجاد کرد`
  }),
  newOffer: (postTitle) => ({
    title: 'پیشنهاد جدید',
    message: `پیشنهاد جدیدی برای آگهی "${postTitle}" دریافت کردید`
  }),
  offerAccepted: (postTitle) => ({
    title: 'پیشنهاد پذیرفته شد',
    message: `پیشنهاد شما برای آگهی "${postTitle}" پذیرفته شد`
  }),
  offerRejected: (postTitle) => ({
    title: 'پیشنهاد رد شد',
    message: `پیشنهاد شما برای آگهی "${postTitle}" رد شد`
  }),
  dealCreated: (dealNumber) => ({
    title: 'معامله جدید',
    message: `معامله ${dealNumber} ایجاد شد`
  }),
  paymentReceived: (amount) => ({
    title: 'پرداخت دریافت شد',
    message: `مبلغ ${amount.toLocaleString()} ریال دریافت شد`
  }),
  productShipped: (dealNumber) => ({
    title: 'محصول ارسال شد',
    message: `محصول معامله ${dealNumber} ارسال شد`
  }),
  deliveryConfirmed: (dealNumber) => ({
    title: 'تحویل تایید شد',
    message: `تحویل محصول معامله ${dealNumber} تایید شد`
  }),
  disputeOpened: (dealNumber) => ({
    title: 'اختلاف ثبت شد',
    message: `برای معامله ${dealNumber} اختلاف ثبت شد`
  }),
  subscriptionExpiring: (daysLeft) => ({
    title: 'اشتراک در حال انقضا',
    message: `اشتراک شما تا ${daysLeft} روز دیگر منقضی می‌شود`
  }),
  verificationApproved: (level) => ({
    title: 'احراز هویت تایید شد',
    message: `احراز هویت سطح ${level} شما تایید شد`
  }),
  verificationRejected: (reason) => ({
    title: 'احراز هویت رد شد',
    message: `احراز هویت شما رد شد: ${reason}`
  })
};

module.exports = mongoose.model('Notification', notificationSchema);
