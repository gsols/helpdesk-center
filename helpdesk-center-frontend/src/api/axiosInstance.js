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

export default axiosInstance;
