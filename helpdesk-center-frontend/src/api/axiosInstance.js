import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
});

// Inject JWT Bearer token on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('hd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — only treat GET background polls as session-expiry signals.
// PATCH/POST/PUT/DELETE mutations can legitimately return 401 for authorization
// reasons unrelated to the session (e.g. endpoint-level access control).
// Firing auth:unauthorized on those would log the user out during normal use.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/api/auth');
    const isBlobRequest  = error.config?.responseType === 'blob';
    // Only background GET reads are safe session-expiry indicators.
    const isGetRequest   = error.config?.method?.toLowerCase() === 'get';

    if (
      isGetRequest &&
      !isBlobRequest &&
      !isAuthEndpoint &&
      error.response?.status === 401
    ) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
