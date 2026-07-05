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
