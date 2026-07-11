import api from './axiosInstance';

export const getAgents = () =>
  api.get('/api/users/agents');

export const getTeam = () =>
  api.get('/api/users/team');
