import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notificationsApi';

const POLL_INTERVAL_MS = 30_000;

/**
 * useNotifications — manages the full lifecycle of the notification panel.
 *
 * Returns:
 *   notifications  – full list (used when panel is open)
 *   unreadCount    – live badge number (polled every 30s)
 *   loading        – true on initial full fetch
 *   markRead(id)   – PATCH one notification then refresh
 *   markAllRead()  – PATCH all-read then refresh
 *   refresh()      – manual re-fetch
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const abortRef                          = useRef(null);

  /* ── Badge poll: lightweight, runs every 30 s ──────────────────────────── */
  const pollBadge = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // ignore — user might be logging out
    }
  }, []);

  useEffect(() => {
    pollBadge();
    const id = setInterval(pollBadge, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollBadge]);

  /* ── Full fetch: called when panel opens ────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data ?? []);
      // Sync badge from the freshly fetched list
      const unread = (res.data ?? []).filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Mark one read ──────────────────────────────────────────────────────── */
  const markRead = useCallback(async (id) => {
    try {
      const res = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? res.data : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  /* ── Mark all read ──────────────────────────────────────────────────────── */
  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchAll,
    markRead,
    markAllRead,
  };
}
