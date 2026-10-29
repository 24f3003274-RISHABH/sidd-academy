import axios, { AxiosHeaders } from 'axios';

const GET_CACHE_TTL = 10000;
const getCache = new Map();
const inFlightGets = new Map();

// Token refresh state: queue of callers waiting for a refresh in progress
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = () => {
  refreshSubscribers.forEach((cb) => cb(null));
  refreshSubscribers = [];
};

const getCacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params) : '';
  const token = localStorage.getItem('siddToken') || 'anonymous';
  return `${token}:${config.baseURL || ''}${config.url || ''}?${params}`;
};

const clearGetCache = () => {
  getCache.clear();
};

// Ensure baseURL uses VITE_API_URL or defaults to production Render API
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleaned = envUrl.trim().replace(/\/+$/, '');
    if (!cleaned.includes('/api')) {
      return `${cleaned}/api/v1`;
    }
    return cleaned;
  }
  return import.meta.env.DEV
    ? 'http://localhost:5000/api/v1'
    : 'https://sidd-academy.onrender.com/api/v1';
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
    if (!config.headers) {
      config.headers = {};
    }
    const authorization = `Bearer ${token}`;
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', authorization);
    } else {
      config.headers['Authorization'] = authorization;
    }
  }

  if (config.method?.toLowerCase() === 'get' && config.cache !== false) {
    const key = getCacheKey(config);
    const cached = getCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      config.adapter = async () => cached.response;
    } else {
      const existingRequest = inFlightGets.get(key);
      if (existingRequest) {
        config.adapter = () => existingRequest;
      } else {
        const adapter = axios.getAdapter(config.adapter);
        config.adapter = async (requestConfig) => {
          const currentRequest = inFlightGets.get(key);
          if (currentRequest) return currentRequest;

          const request = adapter(requestConfig);
          inFlightGets.set(key, request);
          try {
            return await request;
          } finally {
            if (inFlightGets.get(key) === request) {
              inFlightGets.delete(key);
            }
          }
        };
      }
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config?.method?.toLowerCase() === 'get' && config.cache !== false) {
      getCache.set(getCacheKey(config), {
        response,
        expiresAt: Date.now() + GET_CACHE_TTL,
      });
    } else if (config?.method?.toLowerCase() !== 'get') {
      clearGetCache();
      inFlightGets.clear();
    }
    return response;
  },
  (error) => {
    if (error.config?.method?.toLowerCase() !== 'get') {
      clearGetCache();
      inFlightGets.clear();
    }
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthCheck = url.includes('/auth/me');
      const isRefreshCall = url.includes('/auth/refresh-token');
      const pathname = window.location.pathname;

      if (isAuthCheck || isRefreshCall) {
        // Hard session expiry – clear token and redirect to login
        if (!pathname.includes('/login') && !pathname.includes('/register')) {
          localStorage.removeItem('siddToken');
          clearGetCache();
          window.dispatchEvent(new CustomEvent('sidd-auth-expired'));
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/login?from=${encodeURIComponent(returnTo)}`);
        }
        return Promise.reject(error);
      }

      // For operational endpoints (e.g. /orders) – attempt a silent token refresh
      // Guard: if this request is already a retry, do not loop again
      if (error.config?._retry) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        // Refresh uses the httpOnly cookie set at login; no body needed
        axios
          .post(`${axiosInstance.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true })
          .then((resp) => {
            const newToken =
              resp.data?.data?.token ||
              resp.data?.token ||
              resp.data?.data?.accessToken ||
              resp.data?.accessToken;
            if (newToken) {
              localStorage.setItem('siddToken', newToken);
              clearGetCache();
              onTokenRefreshed(newToken);
            } else {
              onTokenRefreshFailed();
            }
          })
          .catch(() => {
            onTokenRefreshFailed();
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      // Queue this request; retry once the new token arrives
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            // Refresh failed – propagate original 401
            return reject(error);
          }
          const retryConfig = { ...error.config };
          retryConfig._retry = true; // prevent infinite loop if retry also 401s
          // Update Authorization header on the retry
          if (typeof retryConfig.headers?.set === 'function') {
            retryConfig.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            retryConfig.headers = {
              ...(retryConfig.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
          }
          // Clear adapter so the real network call is made (not the cache adapter)
          delete retryConfig.adapter;
          resolve(axiosInstance(retryConfig));
        });
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

