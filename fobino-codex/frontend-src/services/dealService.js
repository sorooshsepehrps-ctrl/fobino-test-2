import api from '../config/api';

export const dealService = {
  // ==================== DEALS ====================
  async createDeal(data) {
    const response = await api.post('/deals', data);
    return response.data;
  },

  async getDeals(params = {}) {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  async getDeal(dealId) {
    const response = await api.get(`/deals/${dealId}`);
    return response.data;
  },

  async verifyDeal(dealId) {
    const response = await api.post(`/deals/${dealId}/verify`);
    return response.data;
  },

  async shipDeal(dealId) {
    const response = await api.post(`/deals/${dealId}/ship`);
    return response.data;
  },

  async deliverDeal(dealId) {
    const response = await api.post(`/deals/${dealId}/deliver`);
    return response.data;
  },

  async confirmDeal(dealId) {
    const response = await api.post(`/deals/${dealId}/confirm`);
    return response.data;
  },

  async cancelDeal(dealId, reason) {
    const response = await api.post(`/deals/${dealId}/cancel`, { reason });
    return response.data;
  },

  async openDispute(dealId, data) {
    const response = await api.post(`/deals/${dealId}/dispute`, data);
    return response.data;
  },

  async getTimeline(dealId) {
    const response = await api.get(`/deals/${dealId}/timeline`);
    return response.data;
  },

  async getReviewableDeals(params = {}) {
    const response = await api.get('/deals/reviewable', { params });
    return response.data;
  },

  // ==================== SHIPPING ====================
  async requestShipping(dealId, data) {
    const response = await api.post(`/deals/${dealId}/shipping`, data);
    return response.data;
  },

  async getShipping(dealId) {
    const response = await api.get(`/deals/${dealId}/shipping`);
    return response.data;
  },

  async respondToShippingPrice(dealId, agree) {
    const response = await api.post(`/deals/${dealId}/shipping/respond`, { agree });
    return response.data;
  },

  async requestShippingFactor(dealId) {
    const response = await api.post(`/deals/${dealId}/shipping/request-factor`);
    return response.data;
  },

  // ==================== INSPECTION ====================
  async requestInspection(dealId, data) {
    const response = await api.post(`/deals/${dealId}/inspection`, data);
    return response.data;
  },

  async getInspection(dealId) {
    const response = await api.get(`/deals/${dealId}/inspection`);
    return response.data;
  },

  async payInspection(dealId) {
    const response = await api.post(`/deals/${dealId}/inspection/pay`);
    return response.data;
  },

  async requestInspectionFactor(dealId) {
    const response = await api.post(`/deals/${dealId}/inspection/request-factor`);
    return response.data;
  },
};

export default dealService;
