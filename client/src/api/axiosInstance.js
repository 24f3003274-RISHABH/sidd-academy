import axios from 'axios';

// Ensure baseURL uses relative path '/api/v1' in browser preview/deployment
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000')) {
    return '/api/v1';
  }
  return envUrl;
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

