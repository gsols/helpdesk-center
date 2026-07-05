import api from './axiosInstance';

export const getAgents = () =>
  api.get('/api/users/agents');
