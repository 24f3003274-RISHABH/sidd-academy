import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('siddToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect for optional check or if already on login/register
      const isAuthCheck = error.config && error.config.url && error.config.url.includes('/auth/me');
      const pathname = window.location.pathname;
      if (!isAuthCheck && !pathname.includes('/login') && !pathname.includes('/register')) {
        localStorage.removeItem('siddToken');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

