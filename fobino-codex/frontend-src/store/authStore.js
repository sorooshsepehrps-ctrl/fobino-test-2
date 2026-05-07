import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../config/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingPhone: null,
      isNewUser: false,

      // Set pending phone for verification
      setPendingPhone: (phone, isNew = false) => set({ pendingPhone: phone, isNewUser: isNew }),

      // Login - request verification code
      requestCode: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { phone });
          const isNewUser = response.data.data?.isNewUser || false;
          set({ pendingPhone: phone, isNewUser, isLoading: false });
          return { success: true, isNewUser };
        } catch (error) {
          set({ error: error.response?.data?.message || 'خطا در ارسال کد', isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },

      // Verify code
      verifyCode: async (phone, code, userData = null) => {
        set({ isLoading: true, error: null });
        try {
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
          const { user, accessToken, refreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            pendingPhone: null,
            isNewUser: false,
          });
          
          return { success: true };
        } catch (error) {
          set({ error: error.response?.data?.message || 'کد نامعتبر است', isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },

      // Resend code
      resendCode: async () => {
        const phone = get().pendingPhone;
        if (!phone) return { success: false };
        
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/resend-code', { phone });
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.response?.data?.message || 'خطا در ارسال مجدد کد', isLoading: false });
          return { success: false };
        }
      },

      // Get current user
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      // Update user profile
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/users/me', data);
          set({ user: response.data.data.user, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.response?.data?.message, isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore logout errors
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, pendingPhone: null, isNewUser: false });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
