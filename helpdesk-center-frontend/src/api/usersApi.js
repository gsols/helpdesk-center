import api from './axiosInstance';

export const getAgents = () =>
  api.get('/api/users/agents');

export const getTeam = () =>
  api.get('/api/users/team');

/** All agents across the whole company — SYS_ADMIN only. */
export const getAllAgents = () =>
  api.get('/api/users/all-agents');
