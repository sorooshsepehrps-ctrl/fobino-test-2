import api from '../config/api';

function normalizeIdentifier(userIdOrSlug) {
  return String(userIdOrSlug || '').trim();
}

export const userAnalysisService = {
  async getUserAnalysis(userIdOrSlug) {
    const value = normalizeIdentifier(userIdOrSlug);
    const isObjectId = /^[a-f\d]{24}$/i.test(value);
    const endpoint = isObjectId
      ? `/users/${value}/analysis`
      : `/users/public/${encodeURIComponent(value)}/analysis`;
    return api.get(endpoint);
  },
};

export default userAnalysisService;
