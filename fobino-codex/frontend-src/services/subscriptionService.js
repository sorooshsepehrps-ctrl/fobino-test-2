import api from '../config/api';

const unwrap = (response) => (response.data?.data ? { ...response.data.data, success: response.data.success, message: response.data.message } : response.data);

export const subscriptionService = {
  // Get all subscription plans
  async getPlans() {
    const response = await api.get('/subscriptions/plans');
    return unwrap(response);
  },

  // Get user's current subscription
  async getMySubscription() {
    const response = await api.get('/subscriptions/my');
    return unwrap(response);
  },

  // Purchase subscription
  async purchase(planName, paymentMethod = 'zarinpal') {
    const response = await api.post('/subscriptions/purchase', {
      planName,
      paymentMethod,
    });
    return unwrap(response);
  },

  // Verify payment callback
  async verifyPayment(authority, status) {
    const response = await api.get('/subscriptions/verify', {
      params: { Authority: authority, Status: status },
    });
    return unwrap(response);
  },

  // Check subscription limits
  async checkLimits() {
    const response = await api.get('/subscriptions/limits');
    return unwrap(response);
  },

  // Purchase extra quota
  async purchaseQuota(quotaType, amount) {
    const response = await api.post('/subscriptions/quota', { quotaType, amount });
    return unwrap(response);
  },
};

export default subscriptionService;
