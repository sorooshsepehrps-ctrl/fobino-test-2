const mongoose = require('mongoose');
const Message = require('./Message');
const chatSchema = new mongoose.Schema({
  // Related entities
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false,
    default: null
  },
  lastPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false,
    default: null
  },
  tradeContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeContract'
  },
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'marketer', 'admin', 'support','user'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    isTyping: {
      type: Boolean,
      default: false
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }],
  // Chat Information
  chatType: {
    type: String,
    enum: [
      'sell_post',     // Chat on a sell post
      'buy_post',      // Chat on a buy post
      'pre_offer',     // Before making an offer
      'post_offer',    // After making an offer
      'deal_negotiation', // Deal negotiation phase
      'deal_execution',   // Deal execution phase
      'marketing_contract', // Marketing contract chat (buyer-seller)
      'dispute',       // Dispute resolution
      'support',       // Support chat
      'user_chat'      // NEW: General user-to-user chat (not post-based)
    ],
    default: 'sell_post'
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived', 'blocked'],
    default: 'active'
  },
  // Related entities
  relatedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  relatedDispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  // Deals opened inside this chat
  deals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  }],
  // Invitation
  invitation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation'
  },
  // Chat limits
  chatLimit: {
    maxParticipants: {
      type: Number,
      default: 2
    },
    allowedExtensions: {
      type: [String],
      default: ['image', 'pdf', 'doc']
    }
  },
  // Statistics
 stats: {
  messageCount: { type: Number, default: 0 },
  lastMessageAt: Date,
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['text', 'image', 'file', 'voice', 'video'] }
  }
},

  // Monitoring
  monitoring: {
    isMonitored: { type: Boolean, default: false },
    monitoredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastChecked: Date,
    flaggedMessages: [{
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      reason: String,
      flaggedAt: Date,
      flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    warnings: [{
      message: String,
      issuedAt: Date,
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  // Closure info
  closedAt: Date,
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closureReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
chatSchema.index({ post: 1 });
chatSchema.index({ lastPost: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ relatedDeal: 1 });
chatSchema.index({ relatedDispute: 1 });
chatSchema.index({ 'stats.lastMessageAt': -1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ tradeContract: 1 });
// NEW: Index for user-based chats
chatSchema.index({ 'participants.user': 1, chatType: 1, status: 1 });

// Virtual for messages
chatSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chat'
});

// Get participant by user ID
chatSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

// Check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Add participant
chatSchema.methods.addParticipant = async function(userId, role) {
  if (this.isParticipant(userId)) {
    throw new Error('کاربر قبلاً در گفتگو عضو است');
  }
  if (this.participants.length >= this.chatLimit.maxParticipants) {
    throw new Error('حداکثر تعداد شرکت‌کنندگان به حد نصاب رسیده است');
  }
  this.participants.push({
    user: userId,
    role,
    joinedAt: new Date(),
    isActive: true
  });
  await this.save();
};

// Remove participant
chatSchema.methods.removeParticipant = async function(userId) {
  const participantIndex = this.participants.findIndex(
    p => p.user.toString() === userId.toString()
  );
  if (participantIndex === -1) {
    throw new Error('کاربر در گفتگو عضو نیست');
  }
  this.participants[participantIndex].isActive = false;
  await this.save();
};

// Update last seen
chatSchema.methods.updateLastSeen = async function(userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.lastSeen = new Date();
    participant.unreadCount = 0;
    await this.save();
  }
};

// Set typing status
chatSchema.methods.setTyping = async function(userId, isTyping) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.isTyping = isTyping;
    await this.save();
  }
};

// Update message stats - FIXED: Added null check for message.sender
chatSchema.methods.updateMessageStats = async function(message) {
  this.stats.messageCount += 1;
  this.stats.lastMessageAt = new Date();
  // FIXED: Added null check for message.sender
  this.participants.forEach(p => {
    // Only increment unread count if sender exists and isn't current participant
    if (message.sender && p.user.toString() !== message.sender.toString()) {
      p.unreadCount += 1;
    }
  });
  await this.save();
};

// Close chat
chatSchema.methods.closeChat = async function(userId, reason) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = userId;
  this.closureReason = reason;
  await this.save();
};

// Send new post notification to chat
chatSchema.methods.sendNewPostNotification = async function(postId) {
  const Message = require('./Message');
  const Post = require('./Post');
  const post = await Post.findById(postId).select('title');
  const notificationMessage = `درخواست جدید در آگهی "${post?.title || 'بدون عنوان'}"`;
  const systemMessage = new Message({
    chat: this._id,
    sender: null, // سیستم
    content: notificationMessage,
    type: 'system_notification',
    metadata: {
      postId: postId,
      notificationType: 'new_post_request'
    }
  });
  await systemMessage.save();
  // Update chat stats
  this.stats.messageCount += 1;
  this.stats.lastMessageAt = new Date();
  this.stats.lastMessage = {
    content: notificationMessage,
    sender: null,
    type: 'system_notification'
  };
  await this.save();
};



// Static method to send new post notification
chatSchema.statics.sendNewPostNotification = async function(chatId, postId) {
  const chat = await this.findById(chatId);
  if (chat) {
    await chat.sendNewPostNotification(postId);
  }
};

// Check if user can create chat for post
chatSchema.statics.canCreateChat = async function(userId, postId) {
  const Post = require('./Post');
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('آگهی یافت نشد');
  }
  // Owner cannot chat with themselves
  if (post.user.toString() === userId.toString()) {
    throw new Error('نمی‌توانید با خودتان گفتگو کنید');
  }
  // For buy posts, check contact access
  if (post.type === 'buy') {
    const hasAccessedContacts = post.hasUserAccessedContacts(userId);
    if (!hasAccessedContacts) {
      throw new Error('برای گفتگو با خریدار ابتدا باید اطلاعات تماس را مشاهده کنید');
    }
  }
  return true;
};

// Get or create chat for post (USER-BASED LOGIC)
chatSchema.statics.getOrCreatePostChat = async function(postId, userId) {
  const Post = require('./Post');
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('آگهی یافت نشد');
  }
  // Validate user can chat
  await this.canCreateChat(userId, postId);
  const postOwnerId = post.user;
  // Find existing active chat between these users (USER-BASED SEARCH)
  let chat = await this.findOne({
    'participants.user': { $all: [userId, postOwnerId] },
    status: 'active',
    chatType: { $in: ['sell_post', 'buy_post'] }, // فقط چت‌های آگهی
    tradeContract: { $exists: false } // چت‌های TradeContract را شامل نشود
  });
  if (chat) {
    // چت موجود پیدا شد - ادامه همان چت
    // به‌روزرسانی lastPost
    chat.lastPost = postId;
    await chat.save();
    // ارسال اعلان سیستم
    await chat.sendNewPostNotification(postId);
    return chat;
  }
  // اگر چت موجود نبود، چت جدید ایجاد کن
  // Determine roles based on post type
  const buyerRole = post.type === 'sell' ? userId : postOwnerId;
  const sellerRole = post.type === 'sell' ? postOwnerId : userId;
  chat = new this({
    post: postId,
    lastPost: postId,
    participants: [
      { user: buyerRole, role: 'buyer' },
      { user: sellerRole, role: 'seller' }
    ],
    chatType: post.type === 'sell' ? 'sell_post' : 'buy_post'
  });
  await chat.save();
  // Update post stats
  await Post.findByIdAndUpdate(postId, {
    $inc: { 'stats.chats': 1, 'chatStats.totalChats': 1, 'chatStats.activeChats': 1 },
    $set: { lastChatActivity: new Date() }
  });
  return chat;
};

// NEW: Get or create user-based chat (عمومی بین دو کاربر)
// REMOVE THE ENTIRE LEGACY METHOD (the one marked as "LEGACY - KEEP FOR BACKWARD COMPATIBILITY")
// ONLY KEEP THIS NEW METHOD (with corrected roles and logic)

// NEW: Get or create user-based chat (عمومی بین دو کاربر) - FIXED
// chatSchema.statics.getOrCreateUserChat = async function(userId1, userId2, initialMessage = null) {
//   try {
//     const id1 = new mongoose.Types.ObjectId(userId1);
//     const id2 = new mongoose.Types.ObjectId(userId2);
    
//     if (id1.equals(id2)) {
//       throw new Error('نمی‌توانید با خودتان گفتگو کنید');
//     }

//     const existingChat = await this.findOne({
//       'participants.user': { $all: [id1, id2] },
//       'participants.2': { $exists: false },
//       status: 'active',
//       chatType: 'user_chat',
//       post: null,
//       tradeContract: null
//     });

//     if (existingChat) {
//       if (initialMessage) {
//         await existingChat.addMessage(id1, initialMessage);
//       }
//       return existingChat;
//     }

//     const newChat = new this({
//       participants: [
//         { user: id1, role: 'user' },
//         { user: id2, role: 'user' }
//       ],
//       chatType: 'user_chat',
//       status: 'active'
//     });

//     await newChat.save();

//     if (initialMessage) {
//       await newChat.addMessage(id1, initialMessage);
//     }

//     await newChat.sendUserChatNotification(id1, initialMessage);
    
//     return newChat;
//   } catch (error) {
//     console.error('Error in getOrCreateUserChat:', error);
//     throw error;
//   }
// };
chatSchema.statics.getOrCreateUserChat = async function(userId1, userId2, initialMessage = null, postId = null) {
  try {
    const id1 = new mongoose.Types.ObjectId(userId1);
    const id2 = new mongoose.Types.ObjectId(userId2);

    if (id1.equals(id2)) {
      throw new Error('نمی‌توانید با خودتان گفتگو کنید');
    }

    // IMPORTANT:
    // user chat must be unique only by two users
    // NOT by postId
    const existingChat = await this.findOne({
      'participants.user': { $all: [id1, id2] },
      'participants.2': { $exists: false },
      status: 'active',
      chatType: 'user_chat',
      tradeContract: null
    });

    if (existingChat) {
      if (initialMessage) {
        await existingChat.addMessage(id1, initialMessage, 'text', {
          postId: postId || null
        });
      }
      return existingChat;
    }

    const chat = new this({
      participants: [
        { user: id1, role: 'user' },
        { user: id2, role: 'user' }
      ],
      chatType: 'user_chat',
      status: 'active',
      post: null,
      lastPost: postId || null,
      tradeContract: null
    });

    await chat.save();

    if (initialMessage) {
      await chat.addMessage(id1, initialMessage, 'text', {
        postId: postId || null
      });
    }

    return chat;
  } catch (error) {
    console.error('Error in getOrCreateUserChat:', error);
    throw error;
  }
};




// UPDATED: Get or create chat for trade contract (همیشه چت جدید)
chatSchema.statics.getOrCreateTradeContractChat = async function(buyerId, sellerId, tradeContractId, chatType = 'marketing_contract') {
  try {
    // همیشه چت جدید ایجاد می‌شود (حتی اگر چت دیگری بین کاربران وجود داشته باشد)
    // این منطق با چت user-based متفاوت است
    // بررسی اینکه buyer و seller یکسان نباشند
    if (buyerId.toString() === sellerId.toString()) {
      throw new Error('خریدار و فروشنده نمی‌توانند یک نفر باشند');
    }
    // ایجاد چت جدید برای trade contract
    const newChat = new this({
      tradeContract: tradeContractId,
      participants: [
        { user: buyerId, role: 'buyer' },
        { user: sellerId, role: 'seller' }
      ],
      chatType: chatType,
      status: 'active'
    });
    await newChat.save();
    return newChat;
  } catch (error) {
    console.error('Error in getOrCreateTradeContractChat:', error);
    throw error;
  }
};

// Get chats for a specific post
chatSchema.statics.getPostChats = async function(postId, userId) {
  return this.find({
    post: postId,
    'participants.user': userId,
    status: 'active'
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .populate('post', 'title type images')
    .sort({ updatedAt: -1 });
};

// Static method to get or create chat (LEGACY - KEEP FOR BACKWARD COMPATIBILITY)


// Get user's active chats (USER-BASED)
chatSchema.statics.getUserChats = async function(userId) {
  return this.find({
    'participants.user': userId,
    status: 'active'
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .populate('post', 'title type images')
    .populate('lastPost', 'title type images')
    .populate('tradeContract')
    .sort({ 'stats.lastMessageAt': -1, updatedAt: -1 });
};

// Get chat by participants (USER-BASED)
chatSchema.statics.getChatByParticipants = async function(userId1, userId2, chatType = null) {
  const query = {
    'participants.user': { $all: [userId1, userId2] },
    status: 'active'
  };
  if (chatType) {
    query.chatType = chatType;
  }
  return this.findOne(query)
    .populate('participants.user', 'firstName lastName profileImage')
    .populate('post', 'title type images')
    .populate('lastPost', 'title type images');
};

// NEW: Get user-based chats only (بدون پست و trade contract)
chatSchema.statics.getUserBasedChats = async function(userId) {
  return this.find({
    'participants.user': userId,
    status: 'active',
    chatType: 'user_chat',
    post: { $exists: false },
    tradeContract: { $exists: false }
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .sort({ 'stats.lastMessageAt': -1, updatedAt: -1 });
};

// NEW: Get post-based chats only
chatSchema.statics.getPostBasedChats = async function(userId) {
  return this.find({
    'participants.user': userId,
    status: 'active',
    post: { $exists: true },
    tradeContract: { $exists: false }
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .populate('post', 'title type images')
    .populate('lastPost', 'title type images')
    .sort({ 'stats.lastMessageAt': -1, updatedAt: -1 });
};

// NEW: Get trade contract chats only
chatSchema.statics.getTradeContractChats = async function(userId) {
  return this.find({
    'participants.user': userId,
    status: 'active',
    tradeContract: { $exists: true }
  })
    .populate('participants.user', 'firstName lastName profileImage')
    .populate('tradeContract')
    .sort({ 'stats.lastMessageAt': -1, updatedAt: -1 });
};




// Instance method: Add message to chat
chatSchema.methods.addMessage = async function(senderId, content, type = 'text', additionalData = {}) {
  const normalizedPostId = additionalData?.postId || additionalData?.post || null;

  const messageData = {
    chat: this._id,
    sender: senderId,
    content,
    type,
    postId: normalizedPostId,
    ...additionalData
  };

  // prevent accidental legacy "post" field on Message
  delete messageData.post;

  const message = await Message.create(messageData);

  this.stats.messageCount = (this.stats.messageCount || 0) + 1;
  this.stats.lastMessageAt = new Date();
  this.stats.lastMessage = {
    content: content.substring(0, 100),
    sender: senderId,
    type
  };

  if (normalizedPostId) {
    this.lastPost = normalizedPostId;
  }

  this.participants.forEach(participant => {
    if (!participant.user.equals(senderId)) {
      participant.unreadCount = (participant.unreadCount || 0) + 1;
    }
  });

  await this.save();
  
  return message;
};


module.exports = mongoose.model('Chat', chatSchema);

