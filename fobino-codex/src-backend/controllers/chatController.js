const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const Post = require('../models/Post');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');
const fileUploadService = require('../services/fileUploadService');
const { paginate, paginationResponse } = require('../utils/helpers');
const mongoose = require('mongoose')

// @desc    Create user-to-user chat (not post-based)
// @route   POST /api/chats/user







exports.createUserChat = asyncHandler(async (req, res) => {
  const { recipientId, initialMessage = '', postId = null } = req.body;
  const userId = req.user._id;

  if (!recipientId) {
    return response.error(res, 'شناسه دریافت‌کننده الزامی است', 400);
  }

  if (userId.toString() === recipientId.toString()) {
    return response.error(res, 'نمی‌توانید با خودتان گفتگو کنید', 400);
  }

  const recipient = await User.findById(recipientId).select('firstName lastName profileImage status');
  if (!recipient) {
    return response.notFound(res, 'کاربر دریافت‌کننده یافت نشد');
  }

  if (recipient.status !== 'active') {
    return response.error(res, 'کاربر دریافت‌کننده غیرفعال است', 400);
  }

  let post = null;
  if (postId) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response.error(res, 'شناسه آگهی نامعتبر است', 400);
    }

    post = await Post.findById(postId).select('_id title user type status');
    if (!post) {
      return response.notFound(res, 'آگهی یافت نشد');
    }
  }

  try {
    const recipientIdObj = new mongoose.Types.ObjectId(recipientId);

    const chat = await Chat.getOrCreateUserChat(
      userId,
      recipientIdObj,
      initialMessage,
      postId || null
    );

    await chat.populate('participants.user', 'firstName lastName profileImage');

    return response.success(
      res,
      {
        chat
      },
      `گفتگو با ${recipient.firstName} ${recipient.lastName} با موفقیت آماده شد`
    );
  } catch (error) {
    console.error('Error in createUserChat:', error.message);
    return response.serverError(res, 'خطا در ایجاد گفتگو');
  }
});
// @desc    Create or get direct user-to-user chat from public profile
// @route   POST /api/chats/direct
// @access  Private
exports.createOrGetDirectConversation = asyncHandler(async (req, res) => {
  const { userId, initialMessage = '' } = req.body;
  const currentUserId = req.user._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return response.validationError(res, { userId: 'شناسه کاربر مقصد نامعتبر است' });
  }

  if (currentUserId.toString() === userId.toString()) {
    return response.error(res, 'نمی‌توانید با خودتان گفتگو کنید', 400);
  }

  const targetUser = await User.findById(userId).select(
    'firstName lastName companyName publicProfile profileImage avatar status publicSlug'
  );

  if (!targetUser) {
    return response.notFound(res, 'کاربر مقصد یافت نشد');
  }

  if (targetUser.status && targetUser.status !== 'active') {
    return response.error(res, 'امکان شروع گفتگو با این کاربر وجود ندارد', 400);
  }

  const sanitizedMessage = typeof initialMessage === 'string' ? initialMessage.trim().slice(0, 1000) : '';

  const existingChat = await Chat.findOne({
    chatType: 'user_chat',
    status: { $in: ['active', 'archived'] },
    'participants.user': { $all: [currentUserId, targetUser._id] },
    'participants.2': { $exists: false },
  }).populate('participants.user', 'firstName lastName companyName profileImage avatar publicSlug');

  if (existingChat) {
    if (existingChat.status === 'archived') {
      existingChat.status = 'active';
      await existingChat.save({ validateBeforeSave: false });
    }

    if (sanitizedMessage) {
      await existingChat.addMessage(currentUserId, sanitizedMessage, 'text');
    }

    return response.success(
      res,
      {
        conversationId: existingChat._id,
        chatId: existingChat._id,
        isNew: false,
        chat: existingChat,
        redirectUrl: `/dashboard/chats/${existingChat._id}`,
      },
      'گفتگوی مستقیم آماده است'
    );
  }

  const chat = await Chat.getOrCreateUserChat(currentUserId, targetUser._id, sanitizedMessage, null);
  await chat.populate('participants.user', 'firstName lastName companyName profileImage avatar publicSlug');

  return response.created(
    res,
    {
      conversationId: chat._id,
      chatId: chat._id,
      isNew: true,
      chat,
      redirectUrl: `/dashboard/chats/${chat._id}`,
    },
    'گفتگوی مستقیم ایجاد شد'
  );
});

// @desc    Create new chat
// @route   POST /api/chats
// @access  Private
// @desc    Create new chat (with contact access validation)
// @route   POST /api/chats
// @access  Private
// @desc    Create new chat (with contact access validation)
// @route   POST /api/chats
// @access  Private





exports.createChat = asyncHandler(async (req, res) => {
  const { postId, initialMessage } = req.body;

  console.log('=== CREATE CHAT DEBUG START ===');
  console.log('User:', req.user._id.toString());

  if (!postId) {
    return response.error(res, 'شناسه آگهی الزامی است', 400);
  }

  const post = await Post.findById(postId).populate('user');

  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }

  if (post.user._id.toString() === req.user._id.toString()) {
    return response.error(res, 'نمی‌توانید با خودتان گفتگو کنید', 400);
  }

  // For buy posts: Check contact access
  if (post.type === 'buy') {
    const hasAccessedContacts = post.hasUserAccessedContacts(req.user._id);
    if (!hasAccessedContacts) {
      return response.error(res, 
        'برای گفتگو با خریدار ابتدا باید اطلاعات تماس را مشاهده کنید', 
        403
      );
    }
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    post: postId,
    'participants.user': { $all: [req.user._id, post.user._id] },
    status: 'active'
  });

  let isNew = false;

  if (chat) {
    console.log('Existing chat found:', chat._id.toString());
    
    if (initialMessage) {
      const message = new Message({
        chat: chat._id,
        sender: req.user._id,
        type: 'text',
        content: initialMessage
      });
      await message.save();
      
      // Update stats without touching lastMessage
      chat.stats.messageCount += 1;
      chat.stats.lastMessageAt = new Date();
      
      // Avoid setting lastMessage completely
      chat.stats.lastMessage = undefined;
      
      chat.participants.forEach(p => {
        if (p.user.toString() !== req.user._id.toString()) {
          p.unreadCount += 1;
        }
      });
      
      try {
        await chat.save({ validateBeforeSave: false }); // Skip validation on save
        console.log('Existing chat updated successfully');
      } catch (saveError) {
        console.error('Error saving existing chat:', saveError.message);
        // Continue anyway since chat already exists
      }
      
      const io = global.io;
      if (io) {
        await message.populate('sender', 'firstName lastName profileImage');
        io.to(`chat:${chat._id}`).emit('new_message', message);
      }
    }

    // Don't return yet - we'll populate and return below
  } else {
    // Create new chat
    console.log('Creating new chat...');
    isNew = true;
    
    const buyerRole = post.type === 'sell' ? req.user._id : post.user._id;
    const sellerRole = post.type === 'sell' ? post.user._id : req.user._id;

    // Create chat WITHOUT stats.lastMessage field
    const chatData = {
      post: postId,
      participants: [
        { 
          user: buyerRole, 
          role: 'buyer',
          unreadCount: 0,
          isActive: true
        },
        { 
          user: sellerRole, 
          role: 'seller',
          unreadCount: initialMessage ? 1 : 0,
          isActive: true
        }
      ],
      chatType: post.type === 'sell' ? 'sell_post' : 'buy_post',
      stats: {
        messageCount: initialMessage ? 1 : 0,
        lastMessageAt: initialMessage ? new Date() : null
        // INTENTIONALLY NOT INCLUDING lastMessage
      }
    };

    console.log('Chat data to create:', JSON.stringify(chatData, null, 2));
    
    // Create and save without validation
    chat = new Chat(chatData);
    
    try {
      await chat.save({ validateBeforeSave: false });
      console.log('New chat created successfully:', chat._id.toString());
    } catch (createError) {
      console.error('Error creating new chat:', createError.message);
      throw createError;
    }

    if (initialMessage) {
      const message = new Message({
        chat: chat._id,
        sender: req.user._id,
        type: 'text',
        content: initialMessage
      });
      await message.save();
      
      const io = global.io;
      if (io) {
        await message.populate('sender', 'firstName lastName profileImage');
        io.to(`chat:${chat._id}`).emit('new_message', message);
      }
    }

    // Update post stats
    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.chats': 1 }
    });

    // Notify post owner (temporarily disabled)
    // await notificationService.notifyNewChat(
    //   post.user._id,
    //   req.user.fullName || 'کاربر',
    //   chat._id,
    //   post.title
    // );
  }

  console.log('=== PREPARING RESPONSE ===');
  
  // CRITICAL: Get a fresh, lean version of the chat without validation
  // Use .lean() to get a plain JavaScript object, not a Mongoose document
  let chatForResponse = await Chat.findById(chat._id)
    .select('-__v -stats.lastMessage') // Explicitly exclude stats.lastMessage
    .lean(); // Convert to plain object
  
  console.log('Chat for response (lean):', JSON.stringify(chatForResponse, null, 2));
  
  // Manually add isNew flag
  chatForResponse.isNew = isNew;
  
  // Clean up the stats object if it still has lastMessage
  if (chatForResponse.stats && chatForResponse.stats.lastMessage) {
    console.log('WARNING: lastMessage still exists in lean result, removing it');
    delete chatForResponse.stats.lastMessage;
  }
  
  // Convert to JSON string first to see if it works
  try {
    const jsonString = JSON.stringify(chatForResponse);
    console.log('JSON stringify successful, length:', jsonString.length);
  } catch (jsonError) {
    console.error('JSON stringify error:', jsonError.message);
    console.error('Problematic value might be:', jsonError.message.includes('lastMessage') ? 'lastMessage field' : 'unknown');
  }

  console.log('=== SENDING RESPONSE ===');
  
  if (isNew) {
    return response.created(res, chatForResponse, `گفتگوی جدید برای آگهی "${post.title}" ایجاد شد`);
  } else {
    return response.success(res, chatForResponse, initialMessage ? 'پیام در گفتگوی موجود ارسال شد' : 'گفتگو از قبل وجود دارد');
  }
});

// @desc    Get user's chats grouped by post
// @route   GET /api/chats
// @access  Private
exports.getChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'active', postId } = req.query;

  const query = {
    'participants.user': req.user._id,
    status: status === 'all' ? { $exists: true } : status
  };

  // Filter by post if specified
  if (postId) {
    query.post = postId;
  }

  const total = await Chat.countDocuments(query);
  const chats = await Chat.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('post', 'title type images displayPrice slug status')
    .populate('participants.user', 'firstName lastName profileImage level verifications')
    .populate('relatedOffer')
    .populate('relatedDeal', 'dealNumber status')
    .lean();

  // Group chats by post (optional grouping)
 const groupedByPost = chats.reduce((groups, chat) => {
  // Skip chats without a post (like user_chat)
  if (!chat.post || !chat.post._id) {
    return groups;
  }
  
  const postId = chat.post._id.toString();
  if (!groups[postId]) {
    groups[postId] = {
      post: chat.post,
      chats: []
    };
  }
  groups[postId].chats.push(chat);
  return groups;
}, {});

  // Add unread count for current user
 const chatsWithUnread = chats.map(chat => {
  const participants = chat.participants || [];
  const participant = participants.find(
    p => p.user && p.user._id && p.user._id.toString() === req.user._id.toString()
  );
  return {
    ...chat,
    unreadCount: participant?.unreadCount || 0,
    otherParticipant: participants.find(
      p => p.user && p.user._id && p.user._id.toString() !== req.user._id.toString()
    )?.user || null
  };
});

  return response.paginated(res, {
    chats: chatsWithUnread,
    groupedByPost: Object.values(groupedByPost)
  }, paginationResponse(total, page, limit));
});

// @desc    Get single chat
// @route   GET /api/chats/:id
// @access  Private
// In controllers/chatController.js
exports.getChat = async (req, res) => {
  try {
    console.log('getChat called with ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    const chat = await Chat.findById(req.params.id)
      .populate('participants.user', 'username profileImage status')
      .populate('post', 'title images')
      .populate('tradeContract', 'contractCode commission status buyer seller marketer');
    
    console.log('Chat found:', chat ? 'Yes' : 'No');
    
    if (!chat) {
      console.log('Chat not found');
      return res.status(404).json({
        success: false,
        message: 'گفتگو یافت نشد'
      });
    }
    
    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.user._id.toString() === req.user._id.toString()
    );
    
    console.log('User is participant:', isParticipant);
    console.log('Participants IDs:', chat.participants.map(p => p.user._id));
    
    if (!isParticipant) {
      console.log('User not authorized to access this chat');
      return res.status(403).json({
        success: false,
        message: 'دسترسی به این گفتگو ندارید'
      });
    }
    
    // Update last read for user
    await Chat.findByIdAndUpdate(
      req.params.id,
      { $set: { [`lastRead.${req.user._id}`]: new Date() } },
      { new: true }
    );
    
    console.log('Sending chat data');
    console.log('Response structure:', JSON.stringify({ success: true, data: chat }, null, 2));
    res.json({
      success: true,
      data: { chat: chat }  // Match frontend expectation
    });
    
  } catch (error) {
    console.error('Error in getChat:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت گفتگو'
    });
  }
};

// @desc    Get chat messages
// @route   GET /api/chats/:id/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, before, after } = req.query;

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  if (!chat.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  const messages = await Message.getMessages(req.params.id, {
    page, limit, before, after
  });

  // Update last seen
  await chat.updateLastSeen(req.user._id);

  return response.success(res, { messages });
});

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
  const { content, type = 'text', replyTo = null, postId = null } = req.body;

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  if (!chat.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  if (chat.status !== 'active') {
    return response.error(res, 'این گفتگو بسته شده است', 400);
  }

  let post = null;
  if (postId) {
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response.error(res, 'شناسه آگهی نامعتبر است', 400);
    }

    post = await Post.findById(postId).select('_id title slug type');
    if (!post) {
      return response.notFound(res, 'آگهی مرتبط یافت نشد');
    }
  }

  const message = new Message({
    chat: chat._id,
    sender: req.user._id,
    type,
    content,
    replyTo,
    postId: postId || null,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  await message.save();

  if (postId) {
    chat.lastPost = postId;
    await chat.save();
  }

  await message.populate('sender', 'firstName lastName profileImage');
  await message.populate('postId', 'title slug type');

  const io = global.io;
  if (io) {
    io.to(`chat:${chat._id}`).emit('new_message', message);
  }

  const otherParticipants = chat.participants.filter(
    p => p.user.toString() !== req.user._id.toString()
  );

  for (const participant of otherParticipants) {
    try {
      // optional notifications
    } catch (notificationError) {
      console.error(
        `[DEBUG] Failed to send notification to user ${participant.user}:`,
        notificationError.message
      );
    }
  }

  return response.created(res, { message });
});

// @desc    Upload attachment
// @route   POST /api/chats/:id/attachments
// @access  Private
exports.uploadAttachment = asyncHandler(async (req, res) => {
  console.log(`[DEBUG] uploadAttachment: chatId=${req.params.id}, files=${req.files?.length}`);
  
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    console.log(`[DEBUG] uploadAttachment: Chat not found`);
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  console.log(`[DEBUG] uploadAttachment: chat.status=${chat.status}, isParticipant=${chat.isParticipant(req.user._id)}`);

  if (!chat.isParticipant(req.user._id)) {
    console.log(`[DEBUG] uploadAttachment: User is not a participant`);
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  if (chat.status !== 'active') {
    console.log(`[DEBUG] uploadAttachment: Chat is not active, status=${chat.status}`);
    return response.error(res, 'این گفتگو بسته شده است', 400);
  }

  if (!req.files || req.files.length === 0) {
    console.log(`[DEBUG] uploadAttachment: No files provided`);
    return response.error(res, 'فایل الزامی است', 400);
  }

  console.log(`[DEBUG] uploadAttachment: Uploading ${req.files.length} file(s)...`);

  const attachments = [];
  for (const file of req.files) {
    console.log(`[DEBUG] uploadAttachment: Processing file ${file.originalname}, mimetype=${file.mimetype}`);
    try {
      const result = await fileUploadService.uploadChatAttachment(file, chat._id);
      console.log(`[DEBUG] uploadAttachment: Uploaded ${file.originalname}, url=${result.url}`);
      attachments.push({
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
        url: result.url,
        publicId: result.publicId,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      });
    } catch (uploadError) {
      console.error(`[DEBUG] uploadAttachment: Failed to upload ${file.originalname}:`, uploadError.message);
      return response.error(res, `خطا در آپلود فایل ${file.originalname}: ${uploadError.message}`, 400);
    }
  }

  console.log(`[DEBUG] uploadAttachment: Creating message with ${attachments.length} attachments`);

  // Create message with attachments
  const message = new Message({
    chat: chat._id,
    sender: req.user._id,
    type: attachments[0].type === 'image' ? 'image' : 'file',
    content: req.body.caption || 'فایل پیوست',
    attachments
  });

  await message.save();
  await message.populate('sender', 'firstName lastName profileImage');

  // Emit to socket
  const io = global.io;
  if (io) {
    io.to(`chat:${chat._id}`).emit('new_message', message);
  }

  console.log(`[DEBUG] uploadAttachment: Success, messageId=${message._id}`);

  return response.created(res, { message });
});

// @desc    Close chat
// @route   PUT /api/chats/:id/close
// @access  Private
exports.closeChat = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  if (!chat.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  await chat.closeChat(req.user._id, reason);

  return response.success(res, { chat }, 'گفتگو بسته شد');
});

// @desc    Mark messages as read
// @route   POST /api/chats/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  if (!chat.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  await chat.updateLastSeen(req.user._id);

  // Mark all messages as read
  await Message.updateMany(
    {
      chat: chat._id,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id }
    },
    {
      $push: {
        readBy: { user: req.user._id, readAt: new Date() }
      },
      $set: { status: 'read' }
    }
  );

  return response.success(res, null, 'پیام‌ها خوانده شدند');
});

// @desc    Get chats for a specific post
// @route   GET /api/chats/post/:postId
// @access  Private
exports.getPostChats = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Verify post exists
  const post = await Post.findById(postId);
  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }
  
  // Verify user has access to post chats
  // For buy posts, user must have accessed contacts
  if (post.type === 'buy' && post.user._id.toString() !== req.user._id.toString()) {
    const hasAccessedContacts = post.hasUserAccessedContacts(req.user._id);
    if (!hasAccessedContacts) {
      return response.error(res, 'برای مشاهده گفتگوها ابتدا باید اطلاعات تماس را مشاهده کنید', 403);
    }
  }
  
  const query = {
    post: postId,
    'participants.user': req.user._id,
    status: 'active'
  };
  
  const total = await Chat.countDocuments(query);
  const chats = await Chat.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('post', 'title type images displayPrice slug status')
    .populate('participants.user', 'firstName lastName profileImage level verifications')
    .populate('relatedOffer')
    .populate('relatedDeal', 'dealNumber status')
    .lean();
  
  // Add unread count for current user
  const chatsWithUnread = chats.map(chat => {
    const participant = chat.participants.find(
      p => p.user._id.toString() === req.user._id.toString()
    );
    return {
      ...chat,
      unreadCount: participant?.unreadCount || 0,
      otherParticipant: chat.participants.find(
        p => p.user._id.toString() !== req.user._id.toString()
      )?.user || null
    };
  });
  
  return response.paginated(res, { 
    chats: chatsWithUnread,
    post: {
      _id: post._id,
      title: post.title,
      type: post.type,
      owner: post.user._id
    }
  }, paginationResponse(total, page, limit));
});

// @desc    Check if user can chat with post owner
// @route   GET /api/chats/post/:postId/can-chat
// @access  Private
exports.checkChatEligibility = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  
  const post = await Post.findById(postId);
  
  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }
  
  // Check if user is post owner
  if (post.user.toString() === req.user._id.toString()) {
    return response.success(res, {
      canChat: false,
      reason: 'نمی‌توانید با خودتان گفتگو کنید',
      isOwner: true,
      postType: post.type,
      postTitle: post.title
    });
  }
  
  // For buy posts, check contact access
  if (post.type === 'buy') {
    const hasAccessedContacts = post.hasUserAccessedContacts(req.user._id);
    
    return response.success(res, {
      canChat: hasAccessedContacts,
      requiresContactAccess: !hasAccessedContacts,
      postType: 'buy',
      postTitle: post.title,
      message: hasAccessedContacts 
        ? 'می‌توانید گفتگو کنید' 
        : 'برای گفتگو ابتدا باید اطلاعات تماس را مشاهده کنید',
      canAccessContacts: hasAccessedContacts,
      contactAccessRequired: true
    });
  }
  
  // For sell posts, always allowed
  return response.success(res, {
    canChat: true,
    postType: 'sell',
    postTitle: post.title,
    message: 'می‌توانید گفتگو کنید',
    requiresContactAccess: false
  });
});

// @desc    Quick chat creation (simplified)
// @route   POST /api/chats/post/:postId/quick-chat
// @access  Private
exports.createQuickChat = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { message } = req.body;
  
  const post = await Post.findById(postId).populate('user');
  
  if (!post) {
    return response.notFound(res, 'آگهی یافت نشد');
  }
  
  if (post.user._id.toString() === req.user._id.toString()) {
    return response.error(res, 'نمی‌توانید با خودتان گفتگو کنید', 400);
  }
  
  // Check contact access for buy posts
  if (post.type === 'buy') {
    const hasAccessedContacts = post.hasUserAccessedContacts(req.user._id);
    if (!hasAccessedContacts) {
      return response.error(res, 
        'برای گفتگو با خریدار ابتدا باید اطلاعات تماس را مشاهده کنید', 
        403
      );
    }
  }
  
  // Check if chat already exists
  let chat = await Chat.findOne({
    post: postId,
    'participants.user': { $all: [req.user._id, post.user._id] },
    status: 'active'
  });
  
  const isNew = !chat;
  
  if (!chat) {
    // Create new chat
    const buyerRole = post.type === 'sell' ? req.user._id : post.user._id;
    const sellerRole = post.type === 'sell' ? post.user._id : req.user._id;
    
    chat = new Chat({
      post: postId,
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
    
    // Notify post owner (temporarily disabled)
    // await notificationService.notifyNewChat(
    //   post.user._id,
    //   req.user.fullName || 'کاربر',
    //   chat._id,
    //   post.title
    // );
  }
  
  // Send message if provided
  let savedMessage = null;
  if (message) {
    const newMessage = new Message({
      chat: chat._id,
      sender: req.user._id,
      type: 'text',
      content: message
    });
    
    savedMessage = await newMessage.save();
    await savedMessage.populate('sender', 'firstName lastName profileImage');
    
    // Update chat stats
    await chat.updateMessageStats(newMessage);
    
    // Emit via socket
    const io = global.io;
    if (io) {
      io.to(`chat:${chat._id}`).emit('new_message', savedMessage);
    }
    
    // Notify other participant
    const otherParticipant = chat.participants.find(
      p => p.user.toString() !== req.user._id.toString()
    );
    
    if (otherParticipant) {
      // await notificationService.notifyNewMessage(
      //   otherParticipant.user,
      //   req.user.fullName || 'کاربر',
      //   chat._id
      // );
    }
  }
  
  // Populate chat for response
  await chat.populate('post', 'title type images');
  await chat.populate('participants.user', 'firstName lastName profileImage');
  
  const responseData = {
    chat,
    isNew,
    message: savedMessage
  };
  
  if (isNew) {
    return response.created(res, responseData, `گفتگوی جدید برای آگهی "${post.title}" ایجاد شد`);
  } else if (savedMessage) {
    return response.created(res, responseData, 'پیام در گفتگوی موجود ارسال شد');
  } else {
    return response.success(res, responseData, 'گفتگو از قبل وجود دارد');
  }
});

// @desc    Set typing status
// @route   POST /api/chats/:id/typing
// @access  Private
exports.setTyping = asyncHandler(async (req, res) => {
  const { isTyping } = req.body;

  const chat = await Chat.findById(req.params.id);

  if (!chat || !chat.isParticipant(req.user._id)) {
    return response.error(res, 'گفتگو یافت نشد', 404);
  }

  await chat.setTyping(req.user._id, isTyping);

  // Emit to socket
  const io = global.io;
  if (io) {
    io.to(`chat:${chat._id}`).emit('user_typing', {
      chatId: chat._id,
      userId: req.user._id,
      isTyping
    });
  }

  return response.success(res, null);
});
