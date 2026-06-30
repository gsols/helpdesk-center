import api from './axiosInstance';

export const getComments = (ticketId) =>
  api.get(`/api/tickets/${ticketId}/comments`);

export const addComment = (ticketId, message) =>
  api.post(`/api/tickets/${ticketId}/comments`, { message });
