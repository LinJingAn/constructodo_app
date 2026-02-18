import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  ExternalLink,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { getAPIBaseURL, DEFAULT_AVATAR_URL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDate, formatCurrency, PROJECT_STATUS } from '@/lib/api';

const POLL_INTERVAL_MS = 10000;
const INBOX_SNIPPET_LEN = 45;

export interface InboxParticipant {
  user_id: string;
  full_name: string | null;
}

export interface InboxConversation {
  project_id: number;
  project_title: string | null;
  participants: InboxParticipant[];
  last_message: { body: string; created_at: string } | null;
  unread_count: number;
  is_owner?: boolean;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  user_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
  read_by?: string[];
}

type FilterTab = 'all' | 'owner' | 'quotes';

function formatMessageTime(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays} días`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function ChatInbox() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [projectDetails, setProjectDetails] = useState<{ status?: string; total_client_paid?: number } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const token = getStoredToken();
  const base = getAPIBaseURL();
  const myUserId = user?.id ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Inbox list
  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    if (!token) {
      setLoadingInbox(false);
      return;
    }
    try {
      const res = await fetch(`${base}/api/v1/chat/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.items ?? []);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error loading inbox:', err);
      toast.error('No se pudo cargar la bandeja de mensajes');
      setConversations([]);
    } finally {
      setLoadingInbox(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchFilter =
      filterTab === 'all' ||
      (filterTab === 'owner' && c.is_owner) ||
      (filterTab === 'quotes' && !c.is_owner);
    if (!matchFilter) return false;
    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return true;
    const title = (c.project_title ?? '').toLowerCase();
    const participantNames = c.participants.map((p) => (p.full_name ?? '').toLowerCase()).join(' ');
    return title.includes(searchLower) || participantNames.includes(searchLower);
  });

  const selectedConv = selectedProjectId
    ? conversations.find((c) => c.project_id === selectedProjectId)
    : null;

  const participantNames = (participants: InboxParticipant[]) => {
    const names = participants.map((p) => p.full_name || 'Usuario').filter(Boolean);
    if (names.length === 0) return 'Sin participantes';
    if (names.length === 1) return names[0];
    return names.join(', ');
  };

  const primaryParticipantName = selectedConv
    ? participantNames(selectedConv.participants)
    : '';

  // Socket + messages for selected project
  useEffect(() => {
    if (!selectedProjectId || !token) return;
    const id = String(selectedProjectId);
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
      if (Number(msg.project_id) !== selectedProjectId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, read_by: msg.read_by ?? [] }];
      });
      markAsRead();
    });

    socket.on('chat:read', (payload: { user_id: string; project_id: number; last_read_at: string }) => {
      if (Number(payload.project_id) !== selectedProjectId) return;
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
  }, [selectedProjectId, token, base]);

  useEffect(() => {
    if (!selectedProjectId) return;
    setMessages([]);
    loadMessages();
    loadProjectMeta();
  }, [selectedProjectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!selectedProjectId || socketConnected) return;
    const t = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [selectedProjectId, socketConnected]);

  const loadMessages = async () => {
    if (!selectedProjectId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${base}/api/v1/chat/projects/${selectedProjectId}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((data.items ?? []).map((m: ChatMessage) => ({ ...m, read_by: m.read_by ?? [] })));
        markAsRead();
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadProjectMeta = async () => {
    if (!selectedProjectId || !token) return;
    try {
      const res = await fetch(`${base}/api/v1/entities/project_requests/${selectedProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjectTitle(data.title ?? null);
        setProjectDetails({
          status: data.status,
          total_client_paid: data.total_client_paid,
        });
      } else {
        setProjectTitle(null);
        setProjectDetails(null);
      }
    } catch {
      setProjectTitle(null);
      setProjectDetails(null);
    }
  };

  const markAsRead = async () => {
    if (!selectedProjectId || !token) return;
    try {
      await fetch(`${base}/api/v1/chat/projects/${selectedProjectId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      window.dispatchEvent(new Event('constructodo:chat-read'));
      loadInbox();
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !selectedProjectId || !token) return;
    setSending(true);
    try {
      const res = await fetch(`${base}/api/v1/chat/projects/${selectedProjectId}/messages`, {
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
      markAsRead();
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
        <div className="flex h-[calc(100vh-6rem)] gap-0">
          <Skeleton className="w-80 shrink-0" />
          <Skeleton className="flex-1" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
      <div className="flex h-[calc(100vh-5rem)] rounded-lg border border-slate-200 bg-white overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
          {/* Left: conversation list */}
          <ResizablePanel
            defaultSize={28}
            minSize={18}
            maxSize={50}
            className="flex flex-col border-r border-slate-200 bg-slate-50/50"
          >
            <div className="p-3 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Mensajes</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-50 border-slate-200"
                />
              </div>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
                {(
                  [
                    { id: 'all' as const, label: 'Todos' },
                    { id: 'owner' as const, label: 'Mis proyectos' },
                    { id: 'quotes' as const, label: 'Ofertas enviadas' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filterTab === tab.id
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingInbox ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {conversations.length === 0
                    ? 'No tienes conversaciones aún.'
                    : 'No hay resultados con ese filtro o búsqueda.'}
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredConversations.map((conv) => {
                    const isSelected = conv.project_id === selectedProjectId;
                    const name = participantNames(conv.participants);
                    const initial = (name.slice(0, 1) || '?').toUpperCase();
                    return (
                      <button
                        key={conv.project_id}
                        type="button"
                        onClick={() => setSelectedProjectId(conv.project_id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-amber-50 border border-amber-200'
                            : 'hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarImage src={DEFAULT_AVATAR_URL} alt={name} />
                          <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">{name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {conv.project_title || `Proyecto #${conv.project_id}`}
                          </p>
                          {conv.last_message && (
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {conv.last_message.body.length > INBOX_SNIPPET_LEN
                                ? conv.last_message.body.slice(0, INBOX_SNIPPET_LEN) + '…'
                                : conv.last_message.body}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                          {conv.last_message && (
                            <span className="text-xs text-slate-400">
                              {formatMessageTime(conv.last_message.created_at)}
                            </span>
                          )}
                          {conv.unread_count > 0 && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 hover:bg-amber-400/50 data-[resize-handle-active]:bg-amber-500 transition-colors" />

          {/* Center: chat */}
          <ResizablePanel defaultSize={72} minSize={50} className="flex flex-col min-w-0 bg-white">
          {!selectedProjectId ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50/50">
              <div className="text-center">
                <MessageSquare className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                <p className="font-medium">Selecciona una conversación</p>
                <p className="text-sm mt-1">Elige un chat de la lista para ver los mensajes.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {projectTitle || selectedConv?.project_title || `Proyecto #${selectedProjectId}`}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    {primaryParticipantName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/projects/${selectedProjectId}`)}
                  className="shrink-0"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver proyecto
                </Button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      No compartas datos de contacto en este chat. CONSTRUCTODO mantiene la
                      comunicación en la plataforma para tu garantía.
                    </p>
                  </div>
                  {loadingMessages ? (
                    <div className="space-y-3">
                      <Skeleton className="h-14 w-3/4" />
                      <Skeleton className="h-14 w-1/2 ml-auto" />
                      <Skeleton className="h-14 w-2/3" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Aún no hay mensajes. Envía el primero.</p>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.user_id === myUserId;
                      const isRead = (msg.read_by?.length ?? 0) > 0;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          {!isMe && (
                            <span className="text-xs font-medium text-slate-600">
                              {msg.sender_name ?? 'Usuario'}
                            </span>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-amber-500 text-white rounded-br-md'
                                : 'bg-slate-100 text-slate-800 rounded-bl-md'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">{msg.body}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs text-slate-400">
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMe && (
                              <span className="text-xs text-slate-500 flex items-center gap-0.5">
                                {isRead ? (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                                    Leído
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Entregado
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-slate-200 bg-slate-50/50">
                  <div className="flex gap-2">
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
                      className="resize-none flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="shrink-0 bg-amber-500 hover:bg-amber-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Right: project details (collapsible on small) */}
        <div className="hidden xl:flex w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50/30">
          {!selectedProjectId ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              Selecciona un chat para ver detalles del proyecto.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center justify-between p-3 border-b border-slate-200 hover:bg-slate-100/50"
              >
                <span className="font-medium text-slate-700">Detalles del proyecto</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${detailsOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {detailsOpen && (
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Proyecto
                      </p>
                      <p className="text-sm font-medium text-slate-800 truncate" title={projectTitle ?? undefined}>
                        {projectTitle || `#${selectedProjectId}`}
                      </p>
                      {projectDetails?.status && (
                        <span
                          className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${
                            PROJECT_STATUS[projectDetails.status as keyof typeof PROJECT_STATUS]?.color ??
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {PROJECT_STATUS[projectDetails.status as keyof typeof PROJECT_STATUS]?.label ??
                            projectDetails.status}
                        </span>
                      )}
                    </div>
                    {projectDetails?.total_client_paid != null && projectDetails.total_client_paid > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Pagado por cliente
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(projectDetails.total_client_paid)}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/projects/${selectedProjectId}`)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver proyecto completo
                    </Button>
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
