import api from '../config/api';


export const producerVerificationService = {
  async getMine() {
    const response = await api.get('/producer-verification/me');
    return response.data;
  },

  async saveLevel1Draft(payload) {
    const response = await api.post('/producer-verification/level/1/draft', payload);
    return response.data;
  },

  async uploadLevel1Photos(files = []) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    const response = await api.post('/producer-verification/level/1/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitLevel1() {
    const response = await api.post('/producer-verification/level/1/submit');
    return response.data;
  },

  async uploadLevel2Documents(files = []) {
    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));
    const response = await api.post('/producer-verification/level/2/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitLevel2() {
    const response = await api.post('/producer-verification/level/2/submit');
    return response.data;
  },

  async requestLevel3Visit(payload) {
    const response = await api.post('/producer-verification/level/3/request-visit', payload);
    return response.data;
  },

  async adminList(params = {}) {
    const response = await api.get('/admin/producer-verifications', { params });
    return response.data;
  },

  async adminApprove(id, level) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/approve`);
    return response.data;
  },

  async adminReject(id, level, reason) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/reject`, { reason });
    return response.data;
  },

  async adminRequestResubmit(id, level, reason) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/request-resubmit`, { reason });
    return response.data;
  },

  async adminScheduleVisit(id, scheduledAt) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/3/schedule`, { scheduledAt });
    return response.data;
  },

  async adminMarkVisited(id, adminVisitNotes) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/3/mark-visited`, { adminVisitNotes });
    return response.data;
  },
};

export default producerVerificationService;
