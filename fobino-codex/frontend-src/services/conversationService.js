import api from '../config/api';

export const conversationService = {
  async createOrGetDirectConversation(userId, initialMessage = '') {
    const response = await api.post('/conversations/direct', { userId, initialMessage });
    return response.data;
  },
};

export default conversationService;
