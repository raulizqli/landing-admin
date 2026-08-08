import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canUseCmsInbox } from '../utils/permissions';
import {
  listMyNotificationsRemote,
  markAllNotificationsReadRemote,
  markNotificationReadRemote,
} from '../utils/inboxFunctions';

export function useInboxNotifications({ pollMs = 60000 } = {}) {
  const { user, profile } = useAuth();
  const enabled = Boolean(user && canUseCmsInbox(profile, user.uid));
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await listMyNotificationsRemote({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled || !pollMs) return undefined;
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, enabled, pollMs]);

  const markRead = async (notificationId) => {
    await markNotificationReadRemote(notificationId);
    await refresh();
  };

  const markAllRead = async () => {
    await markAllNotificationsReadRemote();
    await refresh();
  };

  return {
    enabled,
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
