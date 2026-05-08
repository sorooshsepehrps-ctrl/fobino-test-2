import api from '../config/api';

const unwrap = (response) => (response.data?.data ? { ...response.data.data, success: response.data.success, message: response.data.message } : response.data);

export const producerVerificationService = {
  async getMine() {
    const response = await api.get('/producer-verification/me');
    return unwrap(response);
  },

  async saveLevel1Draft(payload) {
    const response = await api.post('/producer-verification/level/1/draft', payload);
    return unwrap(response);
  },

  async uploadLevel1Photos(files = []) {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    const response = await api.post('/producer-verification/level/1/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  async submitLevel1() {
    const response = await api.post('/producer-verification/level/1/submit');
    return unwrap(response);
  },

  async uploadLevel2Documents(files = []) {
    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));
    const response = await api.post('/producer-verification/level/2/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
  },

  async submitLevel2() {
    const response = await api.post('/producer-verification/level/2/submit');
    return unwrap(response);
  },

  async requestLevel3Visit(payload) {
    const response = await api.post('/producer-verification/level/3/request-visit', payload);
    return unwrap(response);
  },

  async adminList(params = {}) {
    const response = await api.get('/admin/producer-verifications', { params });
    return unwrap(response);
  },

  async adminApprove(id, level) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/approve`);
    return unwrap(response);
  },

  async adminReject(id, level, reason) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/reject`, { reason });
    return unwrap(response);
  },

  async adminRequestResubmit(id, level, reason) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/${level}/request-resubmit`, { reason });
    return unwrap(response);
  },

  async adminScheduleVisit(id, scheduledAt) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/3/schedule`, { scheduledAt });
    return unwrap(response);
  },

  async adminMarkVisited(id, adminVisitNotes) {
    const response = await api.patch(`/admin/producer-verifications/${id}/level/3/mark-visited`, { adminVisitNotes });
    return unwrap(response);
  },
};

export default producerVerificationService;
