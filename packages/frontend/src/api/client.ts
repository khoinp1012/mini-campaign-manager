import axios from 'axios';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3001',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url.includes('/auth/me')) {
      return Promise.reject(error);
    }

    const message = error.response?.data?.error || 'An unexpected error occurred';
    useToastStore.getState().addToast(message, 'error');

    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
