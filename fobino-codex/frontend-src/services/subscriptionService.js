import api from '../config/api';

export const subscriptionService = {
  // Get all subscription plans
  async getPlans() {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  // Get user's current subscription
  async getMySubscription() {
    const response = await api.get('/subscriptions/my');
    return response.data;
  },

  // Purchase subscription
  async purchase(planName, paymentMethod = 'zarinpal') {
    const response = await api.post('/subscriptions/purchase', {
      planName,
      paymentMethod,
    });
    return response.data;
  },

  // Verify payment callback
  async verifyPayment(authority, status) {
    const response = await api.get('/subscriptions/verify', {
      params: { Authority: authority, Status: status },
    });
    return response.data;
  },

  // Check subscription limits
  async checkLimits() {
    const response = await api.get('/subscriptions/limits');
    return response.data;
  },

  // Purchase extra quota
  async purchaseQuota(quotaType, amount) {
    const response = await api.post('/subscriptions/quota', { quotaType, amount });
    return response.data;
  },
};

export default subscriptionService;
