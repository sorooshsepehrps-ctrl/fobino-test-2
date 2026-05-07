import { io } from 'socket.io-client';

// Global rate limiter - shared across all instances
const globalRateLimit = {
  lastAttempt: 0,
  minInterval: 10000, // 10 seconds minimum between ANY connection attempts
  attemptCount: 0,
  resetTime: Date.now() + 60000, // Reset counter every 60 seconds
  maxAttemptsPerMinute: 5, // Max 5 attempts per minute
  
  canConnect() {
    const now = Date.now();
    
    // Reset counter if time has passed
    if (now > this.resetTime) {
      this.attemptCount = 0;
      this.resetTime = now + 60000;
    }
    
    // Check if enough time has passed since last attempt
    const timeSinceLastAttempt = now - this.lastAttempt;
    
    if (timeSinceLastAttempt < this.minInterval) {
      console.log(`⏳ Global rate limit: ${this.minInterval - timeSinceLastAttempt}ms until next attempt`);
      return false;
    }
    
    if (this.attemptCount >= this.maxAttemptsPerMinute) {
      console.log(`🚫 Global rate limit: Max ${this.maxAttemptsPerMinute} attempts per minute reached`);
      return false;
    }
    
    return true;
  },
  
  recordAttempt() {
    this.lastAttempt = Date.now();
    this.attemptCount++;
  }
};

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
  }

  // Connect to socket server
  connect() {
    // Check global rate limit
    if (!globalRateLimit.canConnect()) {
      console.log('🚫 Connection blocked by global rate limiter');
      return this.socket;
    }
    
    globalRateLimit.recordAttempt();
    console.log(`📊 Global rate limit: Attempt ${globalRateLimit.attemptCount}/${globalRateLimit.maxAttemptsPerMinute}`);
    
    // Clean up any existing socket before creating new one
    if (this.socket) {
      console.log('🧹 Cleaning up existing socket...');
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Avoid multiple connections
    if (this.isConnecting) {
      console.log('⏳ Socket already connecting, waiting...');
      return this.socket;
    }

    this.isConnecting = true;
    
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No access token found for socket connection');
      this.isConnecting = false;
      return null;
    }

    console.log('🔌 Connecting socket...');

    try {
      this.socket = io( 'http://localhost:5000', {
        auth: { 
          token: token 
        },
        query: { token },
        forceNew: true,
        reconnection: false, // We handle reconnection manually with rate limiting
        timeout: 20000,
      });

      this.setupEventListeners();
      return this.socket;
      
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      this.isConnecting = false;
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully. ID:', this.socket.id);
      this.isConnecting = false;
      this.emitToListeners('connected', { socketId: this.socket.id });
      
      setTimeout(() => {
        this.joinUserChats();
      }, 500);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isConnecting = false;
      this.socket = null;
      this.emitToListeners('connect_error', error);
      
      console.log('⚠️ Connection failed - rate limiter will prevent rapid retries');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.socket = null;
      }
      this.emitToListeners('disconnected', reason);
    });

    // ========== CUSTOM EVENT HANDLERS ==========

    // When chats are joined successfully
    this.socket.on('chats_joined', (data) => {
      console.log('✅ Chats joined:', data);
      this.emitToListeners('chats_joined', data);
    });

    // When a chat is joined
    this.socket.on('chat_joined', (data) => {
      console.log('✅ Chat joined:', data);
      this.emitToListeners('chat_joined', data);
    });

    // New message received
    this.socket.on('new_message', (messageData) => {
      console.log('📨 New message received:', messageData);
      this.emitToListeners('new_message', messageData);
    });

    // User typing indicator
    this.socket.on('user_typing', (typingData) => {
      console.log('⌨️ User typing:', typingData);
      this.emitToListeners('user_typing', typingData);
    });

    // User joined chat
    this.socket.on('user_joined', (joinData) => {
      console.log('👤 User joined chat:', joinData);
      this.emitToListeners('user_joined', joinData);
    });

    // User left chat
    this.socket.on('user_left', (leaveData) => {
      console.log('👋 User left chat:', leaveData);
      this.emitToListeners('user_left', leaveData);
    });

    // Message read receipt
    this.socket.on('message_read', (readData) => {
      console.log('✓ Message read:', readData);
      this.emitToListeners('message_read', readData);
    });

    // Chat info received
    this.socket.on('chat_info', (chatData) => {
      console.log('ℹ️ Chat info received:', chatData);
      this.emitToListeners('chat_info', chatData);
    });

    // Error events
    this.socket.on('chat_error', (errorData) => {
      console.error('❌ Chat error:', errorData);
      this.emitToListeners('chat_error', errorData);
    });

    this.socket.on('chat_info_error', (errorData) => {
      console.error('❌ Chat info error:', errorData);
      this.emitToListeners('chat_info_error', errorData);
    });

    // User went offline
    this.socket.on('user_offline', (offlineData) => {
      console.log('🔌 User offline:', offlineData);
      this.emitToListeners('user_offline', offlineData);
    });
  }

  // ========== PUBLIC METHODS ==========

  joinUserChats() {
    if (this.isConnected()) {
      console.log('🔄 Joining user chats...');
      this.socket.emit('join_my_chats');
    } else {
      console.warn('Cannot join chats - socket not connected');
    }
  }

  // In socketService.js, modify the joinChat method:
// socketService.js - FIXED joinChat method
joinChat(chatId) {
  if (!chatId) {
    console.error('Cannot join chat: No chatId provided');
    return;
  }
  
  // Ensure chatId is a string, not an object
  const chatIdString = typeof chatId === 'object' ? chatId.chatId : chatId;
  
  if (this.isConnected()) {
    console.log('🔄 Joining chat:', chatIdString);
    // Emit just the chatId string, not an object
    this.socket.emit('join_chat', chatIdString);
  } else {
    console.warn('Socket not connected. Cannot join chat:', chatIdString);
    const newSocket = this.connect();
    if (newSocket) {
      newSocket.once('connect', () => {
        setTimeout(() => {
          this.socket.emit('join_chat', chatIdString);
        }, 500);
      });
    }
  }
}
  leaveChat(chatId) {
    if (this.isConnected()) {
      console.log('🚪 Leaving chat:', chatId);
      this.socket.emit('leave_chat', chatId);
    }
  }

  sendTyping(chatId, isTyping) {
    if (this.isConnected()) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  sendMessageRead(chatId, messageId) {
    if (this.isConnected()) {
      this.socket.emit('message_read', { chatId, messageId });
    }
  }

  getChatInfo(chatId) {
    if (this.isConnected()) {
      console.log('🔍 Requesting chat info for:', chatId);
      this.socket.emit('get_chat_info', chatId);
    }
  }

  sendNewMessage(chatId, message) {
    if (this.isConnected()) {
      this.socket.emit('new_message', { 
        chatId, 
        message 
      });
    }
  }

  // ========== LISTENER MANAGEMENT ==========

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // If socket is already connected and it's a connection event
    if (event === 'connected' && this.isConnected()) {
      callback({ socketId: this.socket.id });
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      // Store the socket ID before disconnecting
      const oldSocketId = this.socket.id;
      this.socket.disconnect();
      this.socket = null;
      console.log(`🔌 Socket ${oldSocketId} disconnected and cleaned up`);
    }
    this.listeners.clear();
    this.isConnecting = false;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

// NOTE: Auto-connect has been removed to prevent multiple connections.
// Components should call socketService.connect() when needed.
// For example, in useEffect:
//   useEffect(() => {
//     socketService.connect();
//     return () => socketService.disconnect();
//   }, []);

export default socketService;