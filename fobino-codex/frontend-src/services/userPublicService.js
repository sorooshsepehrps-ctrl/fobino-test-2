import api from '../config/api';

export const userPublicService = {
  async getPublicProfile(identifier) {
    const response = await api.get(`/users/public/${identifier}`);
    return response.data;
  },
  async getBusinessCard(identifier) {
    const response = await api.get(`/users/public/${identifier}/business-card`);
    return response.data;
  },
};

export default userPublicService;
