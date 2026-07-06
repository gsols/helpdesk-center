import api from './axiosInstance';

export const getFrt = () =>
  api.get('/api/analytics/frt');

export const getMttr = () =>
  api.get('/api/analytics/mttr');

export const getAiAccuracy = () =>
  api.get('/api/analytics/ai-accuracy');
