import { useState, useEffect, useCallback } from 'react';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';

export interface UnreadChatItem {
  project_id: number;
  unread_count: number;
  project_title: string | null;
}

const POLL_MS = 30000;

export function useUnreadChat() {
  const [items, setItems] = useState<UnreadChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/chat/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    const onRead = () => refresh();
    window.addEventListener('constructodo:chat-read', onRead);
    return () => {
      clearInterval(t);
      window.removeEventListener('constructodo:chat-read', onRead);
    };
  }, [refresh]);

  const total = items.reduce((s, i) => s + i.unread_count, 0);
  const getUnreadByProjectId = (projectId: number) =>
    items.find((i) => i.project_id === projectId)?.unread_count ?? 0;

  return { items, total, loading, refresh, getUnreadByProjectId };
}
