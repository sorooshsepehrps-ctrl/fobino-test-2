const Notification = require('../models/Notification');
const { kavenegar } = require('../config/sms');
const { sendEmail, emailTemplates } = require('../config/email');
const logger = require('../utils/logger');

class NotificationService {
  // Create notification
  async create(userId, type, title, message, data = {}, actionUrl = null) {
    try {
      const notification = await Notification.createNotification(
        userId, type, title, message, data, actionUrl
      );

      // Emit to socket if user is online
      this.emitToUser(userId, 'new_notification', notification);

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Create notification from template
  async createFromTemplate(userId, templateName, templateData, data = {}, actionUrl = null) {
    const templates = Notification.templates;
    const normalizedTemplateName = this.normalizeTemplateName(templateName);
    const templateFactory = templates[templateName] || templates[normalizedTemplateName];
    
    if (!templateFactory) {
      throw new Error(`Template ${templateName} not found`);
    }

    const template = templateFactory(templateData);
    return this.create(userId, templateName, template.title, template.message, data, actionUrl);
  }

  normalizeTemplateName(templateName) {
    if (!templateName || !templateName.includes('_')) return templateName;
    return templateName.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  // Send push notification (placeholder for future implementation)
  async sendPush(userId, title, message, data = {}) {
    // TODO: Implement push notification with Firebase or similar service
    logger.info('Push notification:', { userId, title, message, data });
    return { success: true };
  }

  // Send SMS notification
  async sendSMS(phone, message) {
    try {
      const result = await kavenegar.send(phone, message);
      return result;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmailNotification(email, subject, html, text) {
    try {
      const result = await sendEmail({ to: email, subject, html, text });
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify new message
  async notifyNewMessage(userId, senderName, chatId) {
    return this.createFromTemplate(
      userId,
      'new_message',
      senderName,
      { chatId },
      `/chats/${chatId}`
    );
  }

  // Notify new offer
  async notifyNewOffer(userId, postTitle, offerId, postId) {
    return this.createFromTemplate(
      userId,
      'new_offer',
      postTitle,
      { offerId, postId },
      `/posts/${postId}`
    );
  }

  // Notify offer accepted
  async notifyOfferAccepted(userId, postTitle, offerId, dealId) {
    return this.createFromTemplate(
      userId,
      'offer_accepted',
      postTitle,
      { offerId, dealId },
      `/deals/${dealId}`
    );
  }

  // Notify new chat created
  async notifyNewChat(userId, senderName, chatId, postTitle) {
    return this.createFromTemplate(
      userId,
      'new_chat',
      { senderName, postTitle },
      { chatId },
      `/chats/${chatId}`
    );
  }

  // Notify offer rejected
  async notifyOfferRejected(userId, postTitle, offerId) {
    return this.createFromTemplate(
      userId,
      'offer_rejected',
      postTitle,
      { offerId },
      null
    );
  }

  // Notify deal created
  async notifyDealCreated(userId, dealNumber, dealId) {
    return this.createFromTemplate(
      userId,
      'deal_created',
      dealNumber,
      { dealId },
      `/deals/${dealId}`
    );
  }

  // Notify payment received
  async notifyPaymentReceived(userId, amount, dealId) {
    return this.createFromTemplate(
      userId,
      'payment_received',
      amount,
      { dealId },
      `/deals/${dealId}`
    );
  }

  // Notify product shipped
  async notifyProductShipped(userId, dealNumber, dealId) {
    return this.createFromTemplate(
      userId,
      'product_shipped',
      dealNumber,
      { dealId },
      `/deals/${dealId}`
    );
  }

  // Notify delivery confirmed
  async notifyDeliveryConfirmed(userId, dealNumber, dealId) {
    return this.createFromTemplate(
      userId,
      'delivery_confirmed',
      dealNumber,
      { dealId },
      `/deals/${dealId}`
    );
  }

  // Notify dispute opened
  async notifyDisputeOpened(userId, dealNumber, disputeId, dealId) {
    return this.createFromTemplate(
      userId,
      'dispute_opened',
      dealNumber,
      { disputeId, dealId },
      `/disputes/${disputeId}`
    );
  }

  // Notify subscription expiring
  async notifySubscriptionExpiring(userId, daysLeft) {
    return this.createFromTemplate(
      userId,
      'subscription_expiring',
      daysLeft,
      {},
      '/subscription'
    );
  }

  // Notify verification approved
  async notifyVerificationApproved(userId, level) {
    return this.createFromTemplate(
      userId,
      'verification_approved',
      level,
      {},
      '/profile/verification'
    );
  }

  // Notify verification rejected
  async notifyVerificationRejected(userId, reason) {
    return this.createFromTemplate(
      userId,
      'verification_rejected',
      reason,
      {},
      '/profile/verification'
    );
  }


  async notifySubscriptionPurchased(userId, planName, subscriptionId) {
    return this.create(
      userId,
      'system',
      'اشتراک فعال شد',
      `اشتراک ${planName} شما با موفقیت فعال شد`,
      { extra: { subscriptionId, planName } },
      '/dashboard/subscription'
    );
  }

  async notifyProducerVerificationStatus(userId, { level, action, reason }) {
    const isApproved = action === 'approve';
    const isResubmit = action === 'request_resubmit';
    const title = isApproved
      ? 'سطح احراز تولیدکننده تایید شد'
      : isResubmit
        ? 'اصلاح احراز تولیدکننده لازم است'
        : 'سطح احراز تولیدکننده رد شد';
    const message = isApproved
      ? `سطح ${level} احراز تولیدکننده شما تایید شد`
      : `${isResubmit ? 'برای ادامه احراز تولیدکننده اصلاحات لازم است' : `سطح ${level} احراز تولیدکننده شما رد شد`}${reason ? `: ${reason}` : ''}`;

    return this.create(
      userId,
      isApproved ? 'verification_approved' : 'verification_rejected',
      title,
      message,
      { extra: { level, action, reason } },
      '/dashboard/producer-verification'
    );
  }

  async notifyProducerVisitScheduled(userId, { scheduledAt }) {
    const scheduledLabel = scheduledAt ? new Date(scheduledAt).toLocaleString('fa-IR') : 'زمان تعیین‌شده';
    return this.create(
      userId,
      'system',
      'بازدید حضوری تولیدی زمان‌بندی شد',
      `بازدید حضوری احراز تولیدکننده برای ${scheduledLabel} زمان‌بندی شد`,
      { extra: { scheduledAt } },
      '/dashboard/producer-verification'
    );
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    return Notification.getUserNotifications(userId, options);
  }

  // Mark as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      throw new Error('نوتیفیکیشن یافت نشد');
    }

    return notification.markAsRead();
  }

  // Mark all as read
  async markAllAsRead(userId) {
    return Notification.markAllAsRead(userId);
  }

  // Get unread count
  async getUnreadCount(userId) {
    return Notification.getUnreadCount(userId);
  }

  // Emit to user via socket
  emitToUser(userId, event, data) {
    const io = global.io;
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Broadcast to all users
  broadcast(event, data) {
    const io = global.io;
    if (io) {
      io.emit(event, data);
    }
  }
}

module.exports = new NotificationService();
