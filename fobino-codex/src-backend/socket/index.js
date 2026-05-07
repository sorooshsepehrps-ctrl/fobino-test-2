/* backend/src/socket/index.js */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const logger = require('../utils/logger');

const initializeSocket = (io) => {
  // ========== AUTHENTICATION MIDDLEWARE ==========
  io.use(async (socket, next) => {
    try {
      console.log('\n=== SOCKET CONNECTION ATTEMPT ===');
      console.log('Socket ID:', socket.id);
      console.log('Handshake query:', socket.handshake.query);
      console.log('Handshake auth:', socket.handshake.auth);
      
      let token;

      // Try to get token from multiple sources (in order of priority)
      // 1. From auth object (Socket.IO v3+ recommended way)
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
        console.log('Token from auth object:', token.substring(0, 30) + '...');
      }
      // 2. From query parameters (URL query string - what your frontend is sending)
      else if (socket.handshake.query && socket.handshake.query.token) {
        token = socket.handshake.query.token;
        console.log('Token from query params:', token.substring(0, 30) + '...');
      }
      // 3. From authorization header
      else if (socket.handshake.headers && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          console.log('Token from auth header:', token.substring(0, 30) + '...');
        }
      }

      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('Authentication token required'));
      }

      console.log('🔑 Verifying token...');
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user ID:', decoded.id);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ User not found in database');
        return next(new Error('User not found'));
      }

      // Check user status
      if (user.status === 'banned') {
        console.log('❌ User is banned');
        return next(new Error('User account is banned'));
      }

      if (user.status === 'suspended') {
        console.log('❌ User is suspended');
        return next(new Error('User account is suspended'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      socket.userName = user.firstName || user.username || user._id;
      
      console.log(`✅ Authentication successful for user: ${socket.userName} (${socket.userId})`);
      console.log('=== END AUTH ===\n');
      
      next();
      
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        console.log('Token has expired');
        return next(new Error('Token expired. Please login again.'));
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.log('Invalid token format');
        return next(new Error('Invalid token format.'));
      }
      
      console.error('Auth error stack:', error.stack);
      return next(new Error('Authentication failed: ' + error.message));
    }
  });

  // ========== MAIN CONNECTION HANDLER ==========
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userName = socket.userName;
    
    console.log(`\n🎉 NEW SOCKET CONNECTION:`);
    console.log(`   User: ${userName} (${userId})`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    // Join user's personal room
    socket.join(`user:${userId}`);
    console.log(`   Joined room: user:${userId}`);

    // Update user online status
    User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    }).catch(err => console.error('Error updating online status:', err));

    // ========== EVENT HANDLERS ==========

    // 1. GET CHAT INFO
    socket.on('get_chat_info', async (chatId) => {
      try {
        console.log(`\n📋 User ${userName} requesting chat info for: ${chatId}`);
        
        const chat = await Chat.findById(chatId)
          .populate('participants', 'firstName lastName username profileImage status')
          .populate('post', 'title images price')
          .populate('lastMessage');
        
        if (!chat) {
          console.log(`❌ Chat ${chatId} not found`);
          socket.emit('chat_info_error', {
            chatId,
            error: 'Chat not found'
          });
          return;
        }

        // Check if user is a participant
        const isParticipant = chat.participants.some(participant => 
          participant._id.toString() === userId
        );
        
        if (!isParticipant) {
          console.log(`❌ User ${userName} is not a participant in chat ${chatId}`);
          socket.emit('chat_info_error', {
            chatId,
            error: 'Not authorized to access this chat'
          });
          return;
        }

        console.log(`✅ Sending chat info for ${chatId} to ${userName}`);
        socket.emit('chat_info', {
          success: true,
          chatId,
          chat: chat.toObject()
        });
        
      } catch (error) {
        console.error(`❌ Error getting chat info for ${chatId}:`, error);
        socket.emit('chat_info_error', {
          chatId,
          error: error.message
        });
      }
    });

    // 2. JOIN USER'S CHATS
    socket.on('join_my_chats', async () => {
      try {
        console.log(`\n🔄 User ${userName} requesting to join their chats`);
        
        // Find all active chats where user is a participant
        const chats = await Chat.find({
          participants: userId,
          status: 'active'
        }).select('_id participants');
        
        console.log(`   Found ${chats.length} active chats for user ${userName}`);
        
        // Join each chat room
        let joinedCount = 0;
        chats.forEach(chat => {
          socket.join(`chat:${chat._id}`);
          console.log(`   ✓ Joined chat: ${chat._id}`);
          joinedCount++;
        });
        
        // Send confirmation
        socket.emit('chats_joined', {
          success: true,
          count: joinedCount,
          chatIds: chats.map(c => c._id),
          message: `Joined ${joinedCount} chat(s)`
        });
        
        console.log(`✅ User ${userName} joined ${joinedCount} chat(s)`);
        
      } catch (error) {
        console.error(`❌ Error joining chats for ${userName}:`, error);
        socket.emit('chats_joined', {
          success: false,
          error: error.message
        });
      }
    });

    // 3. JOIN SPECIFIC CHAT
    // socket/index.js - Updated join_chat handler
socket.on('join_chat', async (chatId) => {
  try {
    console.log(`\n🚪 User ${userName} (${userId}) requesting to join chat: ${chatId}`);
    
    // Log the userId for debugging
    console.log(`🔍 User ID in socket: ${userId}`);
    console.log(`🔍 User ID type: ${typeof userId}`);
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log(`❌ Chat ${chatId} not found`);
      socket.emit('chat_error', {
        chatId,
        error: 'Chat not found'
      });
      return;
    }

    // Debug: Log the participants structure
    console.log(`🔍 Chat participants:`, JSON.stringify(chat.participants, null, 2));
    
    // Check if user is a participant - IMPORTANT: Convert both to string for comparison
    const isParticipant = chat.participants.some(participant => {
      const participantUserId = participant.user.toString();
      const socketUserId = userId.toString();
      
      console.log(`🔍 Comparing: participant.user=${participantUserId} vs socket.user=${socketUserId}`);
      console.log(`🔍 Types: participant.user=${typeof participantUserId}, socket.user=${typeof socketUserId}`);
      
      return participantUserId === socketUserId;
    });
    
    console.log(`✅ Is participant? ${isParticipant}`);
    
    if (!isParticipant) {
      console.log(`❌ User ${userId} is not a participant in chat ${chatId}`);
      console.log(`❌ Chat participants IDs:`, chat.participants.map(p => p.user.toString()));
      
      socket.emit('chat_error', {
        chatId,
        error: 'Not authorized to join this chat'
      });
      return;
    }

    // Join the chat room
    socket.join(`chat:${chatId}`);
    
    // Get other participants for notification
    const otherParticipants = chat.participants.filter(
      p => p.user.toString() !== userId.toString()
    );
    
    // Notify other participants
    otherParticipants.forEach(otherParticipant => {
      socket.to(`user:${otherParticipant.user.toString()}`).emit('user_joined', {
        chatId,
        userId,
        userName,
        timestamp: new Date(),
        message: `${userName} joined the chat`
      });
    });
    
    // Send success to the joining user
    socket.emit('chat_joined', {
      success: true,
      chatId,
      participants: chat.participants,
      message: `Successfully joined chat ${chatId}`
    });
    
    console.log(`✅ User ${userName} joined chat ${chatId}`);
    
  } catch (error) {
    console.error(`❌ Error joining chat ${chatId}:`, error);
    socket.emit('chat_error', {
      chatId,
      error: error.message
    });
  }
});

    // 4. LEAVE CHAT
    socket.on('leave_chat', (chatId) => {
      console.log(`\n👋 User ${userName} leaving chat: ${chatId}`);
      
      socket.leave(`chat:${chatId}`);
      
      // Notify other participants
      socket.to(`chat:${chatId}`).emit('user_left', {
        chatId,
        userId,
        userName,
        timestamp: new Date(),
        message: `${userName} left the chat`
      });
      
      console.log(`✅ User ${userName} left chat ${chatId}`);
    });

    // 5. TYPING INDICATOR
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      console.log(`\n⌨️  User ${userName} ${isTyping ? 'started' : 'stopped'} typing in chat ${chatId}`);
      
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId,
        userName,
        isTyping,
        timestamp: new Date()
      });
    });

    // 6. MESSAGE READ RECEIPT
    socket.on('message_read', (data) => {
      const { chatId, messageId } = data;
      console.log(`\n✓ User ${userName} read message ${messageId} in chat ${chatId}`);
      
      socket.to(`chat:${chatId}`).emit('message_read', {
        chatId,
        messageId,
        userId,
        userName,
        timestamp: new Date()
      });
    });

    // 7. SEND NEW MESSAGE
    socket.on('new_message', (data) => {
      const { chatId, message } = data;
      console.log(`\n📨 User ${userName} sent message in chat ${chatId}:`, 
        typeof message === 'string' ? message.substring(0, 50) + '...' : message
      );
      
      // Broadcast to everyone in the chat room (including sender)
      io.to(`chat:${chatId}`).emit('new_message', {
        success: true,
        chatId,
        message: {
          ...message,
          sender: userId,
          timestamp: new Date()
        },
        senderId: userId,
        senderName: userName,
        timestamp: new Date()
      });
    });

    // 8. PING/PONG (keep-alive)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // ========== DISCONNECTION HANDLER ==========
    socket.on('disconnect', async (reason) => {
      console.log(`\n🔌 SOCKET DISCONNECTED:`);
      console.log(`   User: ${userName} (${userId})`);
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Time: ${new Date().toISOString()}`);

      // Update user offline status
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      }).catch(err => console.error('Error updating offline status:', err));

      // Notify all chat rooms user was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('chat:')) {
          const chatId = room.replace('chat:', '');
          socket.to(room).emit('user_offline', {
            chatId,
            userId,
            userName,
            timestamp: new Date(),
            message: `${userName} went offline`
          });
          console.log(`   Notified chat ${chatId} of offline status`);
        }
      });
    });

    // ========== ERROR HANDLER ==========
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${userName}:`, error);
    });

    // Send welcome message
    setTimeout(() => {
      socket.emit('welcome', {
        success: true,
        message: `Welcome ${userName}!`,
        userId,
        socketId: socket.id,
        timestamp: new Date()
      });
    }, 500);

    console.log(`✅ Socket setup complete for ${userName}\n`);
  });

  // ========== GLOBAL ERROR HANDLING ==========
  io.on('error', (error) => {
    console.error('❌ Global Socket.IO error:', error);
  });

  // ========== ENGINE DEBUGGING ==========
  io.engine.on("connection_error", (err) => {
    console.error('\n❌ ENGINE CONNECTION ERROR:');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    console.error('   Context:', JSON.stringify(err.context, null, 2));
    console.error('   Request URL:', err.request?.url);
    console.error('   Request Query:', err.request?._query);
  });

  // Store io instance globally for use in other modules
  global.io = io;

  console.log('\n========================================');
  console.log('✅ Socket.IO initialized successfully');
  console.log('========================================\n');

  return io;
};

// ========== HELPER FUNCTIONS ==========
const emitToUser = (userId, event, data) => {
  if (global.io) {
    console.log(`📤 Emitting ${event} to user:${userId}`);
    global.io.to(`user:${userId}`).emit(event, data);
  } else {
    console.error('❌ Cannot emit: global.io not initialized');
  }
};

const emitToChat = (chatId, event, data) => {
  if (global.io) {
    console.log(`📤 Emitting ${event} to chat:${chatId}`);
    global.io.to(`chat:${chatId}`).emit(event, data);
  } else {
    console.error('❌ Cannot emit: global.io not initialized');
  }
};

const emitToDeal = (dealId, event, data) => {
  if (global.io) {
    global.io.to(`deal:${dealId}`).emit(event, data);
  }
};

const broadcast = (event, data) => {
  if (global.io) {
    console.log(`📢 Broadcasting ${event} to all connected clients`);
    global.io.emit(event, data);
  }
};

// Emit new message from server (e.g., when saving to database)
const emitNewMessage = async (chatId, message) => {
  if (global.io) {
    try {
      // Get sender info
      const sender = await User.findById(message.sender).select('firstName lastName username');
      const senderName = sender?.firstName || sender?.username || 'Unknown';
      
      const messageData = {
        success: true,
        chatId,
        message: {
          ...message.toObject ? message.toObject() : message,
          timestamp: message.createdAt || new Date()
        },
        senderId: message.sender,
        senderName,
        timestamp: new Date()
      };
      
      console.log(`📤 Emitting new_message to chat:${chatId}`);
      global.io.to(`chat:${chatId}`).emit('new_message', messageData);
      
    } catch (error) {
      console.error('Error emitting new message:', error);
    }
  }
};

// Update chat info for all participants
const updateChatInfo = async (chatId) => {
  if (global.io) {
    try {
      const chat = await Chat.findById(chatId)
        .populate('participants', 'firstName lastName username profileImage')
        .populate('lastMessage');
      
      if (!chat) return;
      
      // Emit to all participants
      chat.participants.forEach(participant => {
        global.io.to(`user:${participant._id}`).emit('chat_updated', {
          chatId,
          chat: chat.toObject(),
          timestamp: new Date()
        });
      });
      
      console.log(`🔄 Updated chat info for chat:${chatId}`);
      
    } catch (error) {
      console.error('Error updating chat info:', error);
    }
  }
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToChat,
  emitToDeal,
  broadcast,
  emitNewMessage,
  updateChatInfo
};