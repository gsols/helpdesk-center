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
    // Blob responses carry their own error state in the UI — never redirect from them.
    const isBlobRequest   = error.config?.responseType === 'blob';
    const token           = localStorage.getItem('hd_token');

    // Only force-logout when:
    //  1. Status is explicitly 401
    //  2. Not a blob request or auth endpoint
    //  3. The token is absent (truly unauthenticated) OR the backend says the token
    //     itself is invalid (WWW-Authenticate header present, meaning JWT rejection)
    //     — NOT just any 401 from a data endpoint while the token is still valid.
    const wwwAuth = error.response?.headers?.['www-authenticate'] ?? '';
    const isTokenRejected = wwwAuth.includes('invalid_token') || wwwAuth.includes('expired');
    const isUnauthenticated = !token;

    if (
      !isBlobRequest &&
      !isAuthEndpoint &&
      error.response?.status === 401 &&
      (isUnauthenticated || isTokenRejected)
    ) {
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
