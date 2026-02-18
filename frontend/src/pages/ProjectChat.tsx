import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageSquare, Send, AlertCircle, Check, CheckCheck } from 'lucide-react';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDate } from '@/lib/api';

export interface ChatMessage {
  id: number;
  project_id: number;
  user_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  read_by?: string[];
}

const POLL_INTERVAL_MS = 10000; // fallback when socket is disconnected

export default function ProjectChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const token = getStoredToken();
  const base = getAPIBaseURL();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (id) {
      loadProjectTitle();
      loadMessages();
    }
  }, [id]);

  // Socket: connect and join project room when we have id and token
  useEffect(() => {
    if (!id || !token) return;
    const url = base.replace(/\/$/, '');
    const socket = io(url, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_project', id, (cb: { error?: string }) => {
        if (cb?.error) console.warn('Socket join_project:', cb.error);
      });
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));

    socket.on('chat:message', (msg: ChatMessage) => {
      if (Number(msg.project_id) !== Number(id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, read_by: msg.read_by ?? [] }];
      });
      // User is on chat page → mark as read so new messages are considered read
      markAsRead();
    });

    socket.on('chat:read', (payload: { user_id: string; project_id: number; last_read_at: string }) => {
      if (Number(payload.project_id) !== Number(id)) return;
      const readAt = new Date(payload.last_read_at).getTime();
      setMessages((prev) =>
        prev.map((m) => {
          const created = new Date(m.created_at).getTime();
          if (created > readAt) return m;
          const readBy = m.read_by ?? [];
          if (readBy.includes(payload.user_id)) return m;
          return { ...m, read_by: [...readBy, payload.user_id] };
        })
      );
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:read');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, token, base]);

  // Fallback polling when socket is disconnected
  useEffect(() => {
    if (!id || socketConnected) return;
    const t = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [id, socketConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProjectTitle = async () => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${base}/api/v1/entities/project_requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjectTitle(data.title ?? null);
      }
    } catch {
      // ignore
    }
  };

  const loadMessages = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${base}/api/v1/chat/projects/${id}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((data.items ?? []).map((m: ChatMessage) => ({ ...m, read_by: m.read_by ?? [] })));
        // User is viewing this chat → mark all as read
        markAsRead();
      } else if (res.status === 403) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (loading) toast.error('No se pudo cargar el chat');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!id || !token) return;
    try {
      await fetch(`${base}/api/v1/chat/projects/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event('constructodo:chat-read'));
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !id || !token) return;
    setSending(true);
    try {
      const res = await fetch(`${base}/api/v1/chat/projects/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setNewMessage('');
      // Keep chat marked as read while user is on page
      markAsRead();
      // New message will arrive via socket; no need to refetch unless socket is down
      if (!socketRef.current?.connected) await loadMessages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  if (profileLoading) {
    return (
      <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">
              {projectTitle ? `Chat: ${projectTitle}` : 'Chat del proyecto'}
            </h1>
            <p className="text-sm text-slate-500">Mensajes sobre este proyecto</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes
            </CardTitle>
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                No compartas datos de contacto (teléfono, correo, redes) en este chat. CONSTRUCTODO
                mantiene la comunicación en la plataforma para tu garantía.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-2/3" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aún no hay mensajes. Envía el primero.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {messages.map((msg) => {
                  const isRead = (msg.read_by?.length ?? 0) > 0;
                  return (
                    <div
                      key={msg.id}
                      className="flex flex-col gap-0.5"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-700">
                          {msg.sender_name ?? 'Usuario'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(msg.created_at)}</span>
                        <span className="text-xs text-slate-500 ml-auto flex items-center gap-0.5">
                          {isRead ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                              <span>Leído</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                              <span>Entregado</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-wrap break-words bg-slate-100 rounded-lg px-3 py-2 text-sm">
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Textarea
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                className="resize-none"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
