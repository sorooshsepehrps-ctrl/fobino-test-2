const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // NEW: post relation for marketplace-triggered messages
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  
  // Message Content
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'offer', 'system', 'deal_update', 'location', 'system_notification'],
    default: 'text'
  },
  content: {
    type: String,
    required: [true, 'محتوای پیام الزامی است'],
    maxlength: [5000, 'پیام نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد']
  },
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'pdf', 'doc', 'video']
    },
    url: String,
    publicId: String,
    name: String,
    size: Number,
    mimeType: String
  }],
  
  // For offer messages
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  
  // For deal update messages
  dealUpdate: {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
    status: String,
    message: String
  },
  
  // Read status
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date
  }],
  
  // Delivery status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  deliveredAt: Date,
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Edited
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  originalContent: String,
  
  // Deleted
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Flagged by admin/support
  isFlagged: { type: Boolean, default: false },
  flagReason: String,
  flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flaggedAt: Date,
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    device: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ postId: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ isFlagged: 1 });

// Virtual for is read by all
messageSchema.virtual('isReadByAll').get(function() {
  return this.status === 'read';
});

// Mark as read by user
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(
    r => r.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    
    if (this.sender && this.sender.toString() !== userId.toString()) {
      this.status = 'read';
    }
    
    await this.save();
  }
};

// Edit message
messageSchema.methods.editMessage = async function(newContent) {
  if (!this.originalContent) {
    this.originalContent = this.content;
  }
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

// Soft delete message
messageSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
};

// Flag message
messageSchema.methods.flagMessage = async function(userId, reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedBy = userId;
  this.flaggedAt = new Date();
  await this.save();
};

// Static method to get messages with pagination
messageSchema.statics.getMessages = async function(chatId, options = {}) {
  const { page = 1, limit = 50, before, after } = options;
  
  const query = { chat: chatId, isDeleted: false };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  if (after) {
    query.createdAt = { ...query.createdAt, $gt: new Date(after) };
  }
  
  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'firstName lastName profileImage')
    .populate('replyTo', 'content sender type')
    .populate('postId', 'title slug type')
    .lean();
  
  return messages.reverse();
};

// Static method to create system message
messageSchema.statics.createSystemMessage = async function(chatId, content) {
  const message = new this({
    chat: chatId,
    sender: null,
    type: 'system',
    content,
    status: 'delivered'
  });
  
  return message;
};

// Update chat stats after saving
messageSchema.post('save', async function() {
  const Chat = mongoose.model('Chat');
  const chat = await Chat.findById(this.chat);
  if (chat) {
    await chat.updateMessageStats(this);
  }
});

module.exports = mongoose.model('Message', messageSchema);