import api from './axiosInstance';

export const getTickets = () =>
  api.get('/api/tickets');

export const getTicket = (id) =>
  api.get(`/api/tickets/${id}`);

export const createTicket = (data) =>
  api.post('/api/tickets', data);

export const previewTicket = (data) =>
  api.post('/api/tickets/preview', data);

export const updateStatus = (id, status) =>
  api.put(`/api/tickets/${id}/status`, { status });

export const assignTicket = (id, agentId) =>
  api.put(`/api/tickets/${id}/assign`, { agentId });

// New endpoints
export const getMyQueue = () =>
  api.get('/api/tickets/my-queue');

export const getDepartmentPool = () =>
  api.get('/api/tickets/pool');

export const getDepartmentArchive = () =>
  api.get('/api/tickets/archive');

export const getTriageQueue = () =>
  api.get('/api/tickets/triage');

export const assignToMe = (id) =>
  api.post(`/api/tickets/${id}/assign-me`);

export const rerouteTicket = (id, targetDepartmentId) =>
  api.post(`/api/tickets/${id}/reroute`, { targetDepartmentId });

export const splitTicket = (id, splits) =>
  api.post(`/api/tickets/${id}/split`, splits);
