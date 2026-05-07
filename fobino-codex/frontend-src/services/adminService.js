import api from '../config/api';

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Shipping
  async getShippingRequests(params = {}) {
    const response = await api.get('/admin/shipping', { params });
    return response.data;
  },

  async estimateShippingPrice(shippingId, price) {
    const response = await api.post(`/admin/shipping/${shippingId}/estimate`, { price });
    return response.data;
  },

  async shipOrder(shippingId, trackingCode) {
    const response = await api.post(`/admin/shipping/${shippingId}/ship`, { trackingCode });
    return response.data;
  },

  async uploadShippingFactor(shippingId, data) {
    const response = await api.post(`/admin/shipping/${shippingId}/factor`, data);
    return response.data;
  },

  // Inspections
  async getInspectionRequests(params = {}) {
    const response = await api.get('/admin/inspections', { params });
    return response.data;
  },

  async estimateInspectionPrice(inspectionId, price) {
    const response = await api.post(`/admin/inspections/${inspectionId}/estimate`, { price });
    return response.data;
  },

  async provideInspectionResult(inspectionId, result) {
    const response = await api.post(`/admin/inspections/${inspectionId}/result`, { result });
    return response.data;
  },

  async uploadInspectionFactor(inspectionId, data) {
    const response = await api.post(`/admin/inspections/${inspectionId}/factor`, data);
    return response.data;
  },

  // Deals
  async getDeals(params = {}) {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  // Users
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Posts
  async getPosts(params = {}) {
    const response = await api.get('/admin/posts', { params });
    return response.data;
  },

  // Verifications
  async getVerificationRequests(params = {}) {
    const response = await api.get('/admin/verifications', { params });
    return response.data;
  },

  async approveVerification(id) {
    const response = await api.post(`/admin/verifications/${id}/approve`);
    return response.data;
  },

  async rejectVerification(id, reason, details) {
    const response = await api.post(`/admin/verifications/${id}/reject`, { reason, details });
    return response.data;
  },
};

export default adminService;
