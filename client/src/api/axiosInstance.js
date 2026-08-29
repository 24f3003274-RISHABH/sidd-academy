import axios from 'axios';

// Ensure baseURL uses VITE_API_URL or defaults to relative '/api/v1'
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '/api/v1';
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('siddToken');
  if (token && token !== 'undefined' && token !== 'null') {
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

