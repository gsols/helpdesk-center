import api from './axiosInstance';

export const getDepartments = () =>
  api.get('/api/departments');
