import api from './axiosInstance';

export const uploadAttachment = (ticketId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAttachments = (ticketId) =>
  api.get(`/api/tickets/${ticketId}/attachments`);

export const downloadUrl = (id) =>
  `http://localhost:8080/api/attachments/${id}/download`;

export const deleteAttachment = (id) =>
  api.delete(`/api/attachments/${id}`);
