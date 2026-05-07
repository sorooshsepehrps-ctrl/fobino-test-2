import api from '../config/api';

export const authService = {
  // Request OTP code
  async requestCode(phone) {
    const response = await api.post('/auth/login', { phone });
    return response.data;
  },

  // Verify OTP and complete login/registration
  async verifyCode(phone, code, userData = null) {
    const payload = { phone, code };
    if (userData) {
      payload.userType = userData.userType;
      payload.firstName = userData.firstName;
      payload.lastName = userData.lastName;
      if (userData.userType === 'company') {
        payload.companyName = userData.companyName;
        payload.economicCode = userData.economicCode;
      }
    }
    const response = await api.post('/auth/verify', payload);
    return response.data;
  },

  // Resend OTP code
  async resendCode(phone) {
    const response = await api.post('/auth/resend-code', { phone });
    return response.data;
  },

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Logout
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
