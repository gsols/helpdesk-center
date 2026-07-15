import api from './axiosInstance';

export const getAgents = () =>
  api.get('/api/users/agents');

export const getTeam = () =>
  api.get('/api/users/team');

/** All agents across the whole company — SYS_ADMIN only. */
export const getAllAgents = () =>
  api.get('/api/users/all-agents');

/** All users in the company (any role) — SYS_ADMIN only. Used by dept creation pickers. */
export const getAllUsers = () =>
  api.get('/api/users/all-users');
