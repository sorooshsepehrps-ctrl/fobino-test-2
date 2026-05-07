import api from '../config/api';

export const userService = {
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/users/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  async getVerificationStatus() {
    const response = await api.get('/users/verification/status');
    return response.data;
  },

  async createVerificationRequest(targetLevel) {
    const response = await api.post('/users/verification/request', { targetLevel });
    return response.data;
  },

  async submitVerificationRequest(targetLevel) {
    const response = await api.post('/users/verification/submit', { targetLevel });
    return response.data;
  },

  async submitVerificationDocument(level, documentType, file) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('docType', documentType);
    formData.append('level', level);
    formData.append('targetLevel', level);

    const response = await api.post('/users/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  async submitVerificationInfo(level, data) {
    const response = await api.post('/users/verification-info', { level, ...data });
    return response.data;
  },

  async getActivity() {
    const response = await api.get('/users/me/activity');
    return response.data;
  },

  async getWallet() {
    const response = await api.get('/wallet');
    return response.data;
  },

  async getWalletTransactions(page = 1, limit = 20) {
    const response = await api.get('/wallet/transactions', { params: { page, limit } });
    return response.data;
  },

  async getWalletSummary() {
    const response = await api.get('/wallet/summary');
    return response.data;
  },

  async getWalletLedger(params = {}) {
    const response = await api.get('/wallet/ledger', { params });
    return response.data;
  },

  async getWalletTransactionDetails(transactionId) {
    const response = await api.get(`/wallet/ledger/${transactionId}`);
    return response.data;
  },

  async createWalletDeposit(amount) {
    const response = await api.post('/wallet/deposit', { amount });
    return response.data;
  },

  async requestWithdrawal(payload) {
    const response = await api.post('/wallet/withdraw', payload);
    return response.data;
  },
};

export default userService;