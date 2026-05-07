import api from '../config/api';

export function normalizeEligibilityResponse(response) {
  return response?.data || response || {};
}

export const userReviewService = {
  async createReview(payload) {
    const response = await api.post('/reviews', payload);
    return response.data;
  },
  async getUserReviews(userId, params = {}) {
    const response = await api.get(`/users/${userId}/reviews`, { params });
    return response.data;
  },
  async getDealReviewEligibility(dealId) {
    const response = await api.get(`/deals/${dealId}/review-eligibility`);
    return normalizeEligibilityResponse(response.data);
  },
};
export default userReviewService;
