import api from './axiosInstance';

/** Fetch all notifications for the authenticated user. */
export const getNotifications = () =>
  api.get('/api/notifications');

/** Fetch only the unread count (lightweight badge poll). */
export const getUnreadCount = () =>
  api.get('/api/notifications/unread-count');

/** Mark a single notification as read. */
export const markNotificationRead = (id) =>
  api.patch(`/api/notifications/${id}/read`);

/** Mark every notification as read for the authenticated user. */
export const markAllNotificationsRead = () =>
  api.patch('/api/notifications/mark-all-read');
