import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  timeout: 15000, // ✅ 15 second timeout
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('td_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (url.includes('/auth/') || err.response?.data?.error === 'No token') {
        Cookies.remove('td_token');
        Cookies.remove('td_user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;