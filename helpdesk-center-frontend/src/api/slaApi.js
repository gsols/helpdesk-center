import api from './axiosInstance';

export const getSlaRules = () =>
  api.get('/api/sla-rules');

export const createSlaRule = (data) =>
  api.post('/api/sla-rules', data);

export const updateSlaRule = (id, data) =>
  api.put(`/api/sla-rules/${id}`, data);

export const deleteSlaRule = (id) =>
  api.delete(`/api/sla-rules/${id}`);
