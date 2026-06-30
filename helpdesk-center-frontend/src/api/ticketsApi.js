import api from './axiosInstance';

export const getTickets = () =>
  api.get('/api/tickets');

export const getTicket = (id) =>
  api.get(`/api/tickets/${id}`);

export const createTicket = (data) =>
  api.post('/api/tickets', data);

export const updateStatus = (id, status) =>
  api.put(`/api/tickets/${id}/status`, { status });
