import api from '../config/api';

export const ticketService = {
  // Get all tickets
  async getTickets(params = {}) {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  // Get single ticket
  async getTicket(ticketId) {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  },

  // Create new ticket
  async createTicket(data, files = []) {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('category', data.category);
    formData.append('priority', data.priority || 'medium');
    formData.append('message', data.message);
    
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Add response to ticket
  async addResponse(ticketId, message, files = []) {
    const formData = new FormData();
    formData.append('message', message);
    
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post(`/tickets/${ticketId}/responses`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Close ticket
  async closeTicket(ticketId) {
    const response = await api.patch(`/tickets/${ticketId}/close`);
    return response.data;
  },

  // Rate ticket support
  async rateTicket(ticketId, rating, feedback = '') {
    const response = await api.post(`/tickets/${ticketId}/rate`, { rating, feedback });
    return response.data;
  },
};

export default ticketService;
