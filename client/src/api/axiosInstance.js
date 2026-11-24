import axios from 'axios';

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

export const clearGetCache = () => {
  getCache.clear();
  inFlightGets.clear();
};

// Ensure baseURL uses VITE_API_URL or defaults to production Render API
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowserRemote =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleaned = envUrl.trim().replace(/\/+$/, '');
    const isLocalEnvUrl = cleaned.includes('localhost') || cleaned.includes('127.0.0.1');
    if (!(isBrowserRemote && isLocalEnvUrl)) {
      if (!cleaned.includes('/api')) {
        return `${cleaned}/api/v1`;
      }
      return cleaned;
    }
  }
  return import.meta.env.DEV && !isBrowserRemote
    ? 'http://localhost:5000/api/v1'
    : 'https://sidd-academy.onrender.com/api/v1';
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // 45s timeout accommodates Render free-tier cold starts without falsely throwing Network Error
  timeout: 45000,
});

const isPublicCredentialRoute = (url = '') =>
  url.includes('/auth/login') || url.includes('/auth/register');

axiosInstance.interceptors.request.use((config) => {
  const url = config.url || '';

  // For FormData uploads, let the browser automatically set `multipart/form-data; boundary=...`
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
    if (!config.timeout || config.timeout < 90000) {
      config.timeout = 90000;
    }
  }

  // Never send a stale Bearer token on fresh login or registration calls
  if (!isPublicCredentialRoute(url)) {
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
  }

  // Only cache JSON GET requests (never cache blob/binary streams)
  if (
    config.method?.toLowerCase() === 'get' &&
    config.cache !== false &&
    config.responseType !== 'blob' &&
    config.responseType !== 'arraybuffer'
  ) {
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
    if (
      config?.method?.toLowerCase() === 'get' &&
      config.cache !== false &&
      config.responseType !== 'blob' &&
      config.responseType !== 'arraybuffer'
    ) {
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
  async (error) => {
    const config = error.config || {};
    const url = config.url || '';

    if (config.method?.toLowerCase() !== 'get') {
      clearGetCache();
      inFlightGets.clear();
    }

    // Retry once on transient Render cold-start network/502/503 errors for safe idempotent GET requests
    const isTransient =
      !error.response || error.response.status === 502 || error.response.status === 503 || error.response.status === 504;
    if (isTransient && config.method?.toLowerCase() === 'get' && !config._coldStartRetry) {
      config._coldStartRetry = true;
      delete config.adapter;
      await new Promise((resolve) => setTimeout(resolve, 1800));
      return axiosInstance(config);
    }

    // Provide a clear user-facing error message when Render is waking up or network drops
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'The server took too long to respond (it may be waking up). Please try again in a few seconds.';
      } else {
        error.message = 'Unable to reach the server right now. If the server was sleeping, please wait a few seconds and try again.';
      }
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      const isAuthCheck = url.includes('/auth/me');
      const isRefreshCall = url.includes('/auth/refresh-token');
      const isCredentialEndpoint =
        url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');
      const pathname = window.location.pathname;

      // Never trigger silent token refresh on login/register/logout endpoints!
      if (isCredentialEndpoint) {
        return Promise.reject(error);
      }

      if (isAuthCheck || isRefreshCall) {
        if (!pathname.includes('/login') && !pathname.includes('/register')) {
          localStorage.removeItem('siddToken');
          clearGetCache();
          window.dispatchEvent(new CustomEvent('sidd-auth-expired'));
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/login?from=${encodeURIComponent(returnTo)}`);
        }
        return Promise.reject(error);
      }

      // Guard: if this request is already a retry, do not loop
      if (config._retry) {
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        axios
          .post(`${axiosInstance.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true, timeout: 30000 })
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

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            return reject(error);
          }
          const retryConfig = { ...config };
          retryConfig._retry = true;
          if (typeof retryConfig.headers?.set === 'function') {
            retryConfig.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            retryConfig.headers = {
              ...(retryConfig.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
          }
          delete retryConfig.adapter;
          resolve(axiosInstance(retryConfig));
        });
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
