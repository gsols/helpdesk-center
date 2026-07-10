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

// On 401 — token is missing, expired, or invalid.
// Clear the stored session and redirect to login so the user re-authenticates.
// Skip auth endpoints so a failed login attempt doesn't trigger a redirect loop.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint  = error.config?.url?.startsWith('/api/auth');
    // Blob responses (e.g. attachment downloads/views) carry their own error
    // state in the UI — never redirect to login from them, and never try to
    // read error.response.status directly (it arrives as a Blob, not JSON).
    const isBlobRequest   = error.config?.responseType === 'blob';
    const hadToken        = !!localStorage.getItem('hd_token');

    if (!isBlobRequest && error.response?.status === 401 && !isAuthEndpoint && hadToken) {
      localStorage.removeItem('hd_token');
      localStorage.removeItem('hd_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
