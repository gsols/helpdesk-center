import api from './axiosInstance';

export const getFrt = () =>
  api.get('/api/analytics/frt');

export const getMttr = () =>
  api.get('/api/analytics/mttr');

export const getAiAccuracy = () =>
  api.get('/api/analytics/ai-accuracy');

export const getDeptSummary = () =>
  api.get('/api/analytics/dept-summary');

export const getDeptDaily = () =>
  api.get('/api/analytics/dept-daily');

export const getAdminOverview = () =>
  api.get('/api/analytics/admin-overview');
