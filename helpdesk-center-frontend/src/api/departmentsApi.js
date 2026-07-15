import api from './axiosInstance';

export const getDepartments = () =>
  api.get('/api/departments');

export const getDepartmentDetail = (id) =>
  api.get(`/api/departments/${id}`);

export const createDepartment = (data) =>
  api.post('/api/departments', data);
// data: { name, managerId, agentIds[] }

export const deleteDepartment = (id) =>
  api.delete(`/api/departments/${id}`);

export const getEligibleAgents = (id) =>
  api.get(`/api/departments/${id}/eligible-agents`);

export const addAgent = (id, data) =>
  api.post(`/api/departments/${id}/agents`, data);
// data: { userId, confirmTransfer }

export const changeManager = (id, data) =>
  api.patch(`/api/departments/${id}/manager`, data);
// data: { newManagerId }
