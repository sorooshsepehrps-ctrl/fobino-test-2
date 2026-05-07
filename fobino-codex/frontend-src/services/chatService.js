import api from '../config/api';

export const chatService = {
  async getChats(params = {}) {
    const response = await api.get('/chats', { params });
    return response.data;
  },

  async getPostChats(postId, params = {}) {
    const response = await api.get(`/chats/post/${postId}`, { params });
    return response.data;
  },

  async checkChatEligibility(postId) {
    const response = await api.get(`/chats/post/${postId}/can-chat`);
    return response.data;
  },

  async createChat(postId, initialMessage = '') {
    const response = await api.post('/chats', { postId, initialMessage });
    return response.data;
  },

  async createOrGetDirectConversation(userId, initialMessage = '') {
    const response = await api.post('/chats/direct', { userId, initialMessage });
    return response.data;
  },

  async createUserChat(recipientId, initialMessage = '', postId = null) {
    const payload = {
      recipientId,
      initialMessage
    };

    if (postId) {
      payload.postId = postId;
    }

    const response = await api.post('/chats/user', payload);
    return response.data;
  },

  async createQuickChat(postId, message = '') {
    const response = await api.post(`/chats/post/${postId}/quick-chat`, { message });
    return response.data;
  },

  async getChat(chatId) {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  async getMessages(chatId, params = {}) {
    const response = await api.get(`/chats/${chatId}/messages`, { params });
    return response.data;
  },

  async sendMessage(chatId, content, type = 'text', replyTo = null, postId = null) {
    const payload = {
      content,
      type,
      replyTo
    };

    if (postId) {
      payload.postId = postId;
    }

    const response = await api.post(`/chats/${chatId}/messages`, payload);
    return response.data;
  },

  async uploadAttachment(chatId, file) {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await api.post(`/chats/${chatId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async markAsRead(chatId) {
    const response = await api.post(`/chats/${chatId}/read`);
    return response.data;
  },

  async closeChat(chatId, reason = '') {
    const response = await api.put(`/chats/${chatId}/close`, { reason });
    return response.data;
  },

  async setTyping(chatId, isTyping) {
    const response = await api.post(`/chats/${chatId}/typing`, { isTyping });
    return response.data;
  },
};

export default chatService;


// /* frontend/my-app/src/services/chatService.js */
// import api from '../config/api';

// export const chatService = {
//   // Get all user's chats
//   async getChats(params = {}) {
//     const response = await api.get('/chats', { params });
//     return response.data;
//   },

//   // Get chats for a specific post
//   async getPostChats(postId, params = {}) {
//     const response = await api.get(`/chats/post/${postId}`, { params });
//     return response.data;
//   },

//   // Check if user can chat with post owner
//   async checkChatEligibility(postId) {
//     const response = await api.get(`/chats/post/${postId}/can-chat`);
//     return response.data;
//   },

//   // Create new chat
//   async createChat(postId, initialMessage = '') {
//     const response = await api.post('/chats', { postId, initialMessage });
//     return response.data;
//   },

//   // Quick chat creation
//   async createQuickChat(postId, message = '') {
//     const response = await api.post(`/chats/post/${postId}/quick-chat`, { message });
//     return response.data;
//   },

//   // Get single chat
//   async getChat(chatId) {
//     const response = await api.get(`/chats/${chatId}`);
//     return response.data;
//   },

//   // Get chat messages
//   async getMessages(chatId, params = {}) {
//     const response = await api.get(`/chats/${chatId}/messages`, { params });
//     return response.data;
//   },

//   // Send message
//   async sendMessage(chatId, content, type = 'text', replyTo = null) {
//     const response = await api.post(`/chats/${chatId}/messages`, {
//       content,
//       type,
//       replyTo
//     });
//     return response.data;
//   },

//   // Upload attachment
//   async uploadAttachment(chatId, file) {
//     const formData = new FormData();
//     formData.append('attachment', file);
    
//     const response = await api.post(`/chats/${chatId}/attachments`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//     return response.data;
//   },

//   // Mark messages as read
//   async markAsRead(chatId) {
//     const response = await api.post(`/chats/${chatId}/read`);
//     return response.data;
//   },

//   // Close chat
//   async closeChat(chatId, reason = '') {
//     const response = await api.put(`/chats/${chatId}/close`, { reason });
//     return response.data;
//   },

//   // Set typing status
//   async setTyping(chatId, isTyping) {
//     const response = await api.post(`/chats/${chatId}/typing`, { isTyping });
//     return response.data;
//   },
// };

// export default chatService;