import api from '../config/api';

export const marketingService = {
  // ============ MARKETING REQUESTS ============
  
  async createMarketingRequest(data, images = [], catalogue = null) {
    const formData = new FormData();
    
    // Send text fields as individual form fields
    formData.append('productName', data.productName || '');
    formData.append('brand', data.brand || '');
    formData.append('description', data.description || '');
    formData.append('commissionPercent', data.commissionPercent || 0);
    
    // Send nested objects as JSON strings
    const categoriesJson = JSON.stringify(data.categories || {});
    formData.append('categories', categoriesJson);
    formData.append('cityOfProduction', JSON.stringify(data.cityOfProduction || {}));
    formData.append('shippingTimeAvailable', JSON.stringify(data.shippingTimeAvailable || {}));
    formData.append('priceVolumes', JSON.stringify(data.priceVolumes || []));
    formData.append('specifications', JSON.stringify(data.specifications || []));
    formData.append('paymentTypes', JSON.stringify(data.paymentTypes || []));

    images.forEach((image) => {
      formData.append('images', image);
    });

    if (catalogue) {
      formData.append('document', catalogue);
    }

    const response = await api.post('/marketing-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getMyMarketingRequests(params = {}) {
    const response = await api.get('/marketing-requests/my-requests', { params });
    return response.data;
  },

  async getAllMarketingRequestsForMarketers(params = {}) {
    const response = await api.get('/marketing-requests/for-marketers', { params });
    return response.data;
  },

  async getMarketingRequestById(id) {
    const response = await api.get(`/marketing-requests/${id}`);
    return response.data;
  },

  async updateMarketingRequest(id, data, newImages = [], newCatalogue = null) {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    newImages.forEach((image) => {
      formData.append('images', image);
    });

    if (newCatalogue) {
      formData.append('catalogue', newCatalogue);
    }

    const response = await api.put(`/marketing-requests/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteMarketingRequest(id) {
    const response = await api.delete(`/marketing-requests/${id}`);
    return response.data;
  },

  async acceptMarketingRequest(id) {
    const response = await api.post(`/marketing-requests/${id}/accept`);
    return response.data;
  },

  async getMyAcceptedRequests(params = {}) {
    const response = await api.get('/marketing-requests/accepted-requests', { params });
    return response.data;
  },

  // ============ RFP ============

  async createRFP(data) {
    const response = await api.post('/rfps', data);
    return response.data;
  },

  async getMyRFPs(params = {}) {
    const response = await api.get('/rfps/my-rfps', { params });
    return response.data;
  },

  async getRFPById(id) {
    const response = await api.get(`/rfps/${id}`);
    return response.data;
  },

  async approveRFP(id) {
    const response = await api.post(`/rfps/${id}/approve`);
    return response.data;
  },

  async editRFP(id, data) {
    const response = await api.put(`/rfps/${id}/edit`, data);
    return response.data;
  },

  async rejectRFP(id, reason) {
    const response = await api.post(`/rfps/${id}/reject`, { reason });
    return response.data;
  },

  // ============ TRADE CONTRACTS ============

  async createTradeContract(rfpId) {
    const response = await api.post(`/trade-contracts/rfp/${rfpId}`);
    return response.data;
  },

  async connectBuyerToContract(contractCode) {
    const response = await api.post('/trade-contracts/connect', { contractCode });
    return response.data;
  },

  async approveBuyerContract(id) {
    const response = await api.post(`/trade-contracts/${id}/approve`);
    return response.data;
  },

  async rejectBuyerContract(id, reason) {
    const response = await api.post(`/trade-contracts/${id}/reject`, { reason });
    return response.data;
  },

  async depositCommission(id) {
    const response = await api.post(`/trade-contracts/${id}/deposit-commission`);
    return response.data;
  },

  async getMyContracts(params = {}) {
    const response = await api.get('/trade-contracts/my-contracts', { params });
    return response.data;
  },

  async getContractById(id) {
    const response = await api.get(`/trade-contracts/${id}`);
    return response.data;
  },

  async markContractPaymentMethod(id, paymentMethod, dealId = null) {
    const response = await api.post(`/trade-contracts/${id}/payment-method`, {
      paymentMethod,
      dealId,
    });
    return response.data;
  },

  async releaseCommission(id) {
    const response = await api.post(`/trade-contracts/${id}/release-commission`);
    return response.data;
  },

  async cancelContract(id, reason) {
    const response = await api.post(`/trade-contracts/${id}/cancel`, { reason });
    return response.data;
  },

  // ============ MARKETER VERIFICATION ============

  async requestMarketerVerification() {
    const response = await api.post('/marketer/request-verification');
    return response.data;
  },

  async getMyMarketerStatus() {
    const response = await api.get('/marketer/my-status');
    return response.data;
  },

  async getPendingMarketerRequests(params = {}) {
    const response = await api.get('/marketer/pending-requests', { params });
    return response.data;
  },

  async approveMarketerVerification(userId) {
    const response = await api.post(`/marketer/${userId}/approve`);
    return response.data;
  },

  async rejectMarketerVerification(userId, reason) {
    const response = await api.post(`/marketer/${userId}/reject`, { reason });
    return response.data;
  },
};

export default marketingService;
