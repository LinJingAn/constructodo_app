import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Shield,
  CreditCard,
  History,
} from 'lucide-react';
import {
  client,
  ProjectRequest,
  Quote,
  ProjectTransaction,
  PROJECT_STATUS,
  QUOTE_STATUS,
  TRANSACTION_TYPE_LABELS,
  formatCurrency,
  formatDate,
  CLIENT_COMMISSION_PERCENT,
} from '@/lib/api';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const { getUnreadByProjectId } = useUnreadChat();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [completingProject, setCompletingProject] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [transactions, setTransactions] = useState<ProjectTransaction[]>([]);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  useEffect(() => {
    if (profileLoading) return;
    if (userType === 'professional') navigate('/dashboard', { replace: true });
  }, [userType, profileLoading, navigate]);

  const loadProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await client.entities.project_requests.get({ id });
      const data = response.data as ProjectRequest;
      setProject(data);

      const token = getStoredToken();
      const quotesRes = await fetch(`${getAPIBaseURL()}/api/v1/entities/quotes/by-project/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (quotesRes.ok) {
        const json = await quotesRes.json();
        setQuotes(json.items || []);
      } else {
        setQuotes([]);
      }

      const txRes = await fetch(`${getAPIBaseURL()}/api/v1/entities/project_transactions/by-project/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (txRes.ok) {
        const txJson = await txRes.json();
        setTransactions(txJson.items || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('No se pudo cargar el proyecto');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const setQuoteStatus = async (quoteId: number, status: 'accepted' | 'rejected') => {
    const token = getStoredToken();
    const res = await fetch(`${getAPIBaseURL()}/api/v1/entities/quotes/${quoteId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    if (!project) return;
    try {
      setActionLoading(quote.id);
      await setQuoteStatus(quote.id, 'accepted');
      await client.entities.project_requests.update({
        id: String(project.id),
        data: {
          selected_quote_id: quote.id,
          status: 'in_progress',
          payment_status: 'pending_payment',
        },
      });
      const otherPending = quotes.filter((q) => q.status === 'pending' && q.id !== quote.id);
      for (const q of otherPending) {
        await setQuoteStatus(q.id, 'rejected');
      }
      toast.success('Cotización aceptada. El proyecto está en progreso.');
      loadProject();
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error('No se pudo aceptar la cotización');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      setActionLoading(quote.id);
      await setQuoteStatus(quote.id, 'rejected');
      toast.success('Cotización rechazada.');
      loadProject();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error('No se pudo rechazar la cotización');
    } finally {
      setActionLoading(null);
    }
  };

  const hasAcceptedQuote = quotes.some((q) => q.status === 'accepted') || project?.selected_quote_id;

  const handleConfirmPayment = async () => {
    if (!project?.id) return;
    const acceptedQuote = quotes.find(
      (q) => q.id === project.selected_quote_id || q.status === 'accepted'
    );
    if (!acceptedQuote) return;
    const totalToPay =
      acceptedQuote.amount * (1 + CLIENT_COMMISSION_PERCENT / 100);
    try {
      setConfirmingPayment(true);
      await client.entities.project_requests.update({
        id: String(project.id),
        data: {
          payment_status: 'paid',
          total_client_paid: totalToPay,
          paid_at: new Date().toISOString(),
        },
      });
      toast.success('Pago registrado. CONSTRUCTODO actúa como garante de la entrega.');
      loadProject();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('No se pudo registrar el pago');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const [releasingPayment, setReleasingPayment] = useState(false);

  const handleMarkCompleted = async () => {
    if (!project?.id) return;
    try {
      setCompletingProject(true);
      await client.entities.project_requests.update({
        id: String(project.id),
        data: { status: 'completed' },
      });
      toast.success('Proyecto marcado como completado.');
      loadProject();
    } catch (error) {
      console.error('Error marking project completed:', error);
      toast.error('No se pudo marcar el proyecto como completado');
    } finally {
      setCompletingProject(false);
    }
  };

  /** Freelancer-style: release escrow to professional and mark project complete */
  const handleReleaseAndComplete = async () => {
    if (!project?.id) return;
    try {
      setReleasingPayment(true);
      await client.entities.project_requests.update({
        id: String(project.id),
        data: { payment_status: 'released', status: 'completed' },
      });
      toast.success('Pago liberado al profesional. Proyecto completado.');
      loadProject();
      window.dispatchEvent(new Event('constructodo:chat-read'));
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast.error('No se pudo liberar el pago');
    } finally {
      setReleasingPayment(false);
    }
  };

  if (profileLoading || userType === 'professional') {
    return (
      <DashboardLayout userType="client" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userType={userType} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout userType={userType} onLogout={handleLogout}>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/my-projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Proyectos
          </Button>
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Proyecto no encontrado</h3>
            <p className="text-slate-500">El proyecto que buscas no existe o no tienes acceso.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const status = PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.pending;

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">{project.title}</h1>
            <p className="text-slate-500 mt-1">Detalle del proyecto</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 relative"
            onClick={() => navigate(`/projects/${project.id}/chat`)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
            {getUnreadByProjectId(project.id) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {getUnreadByProjectId(project.id) > 99 ? '99+' : getUnreadByProjectId(project.id)}
              </span>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">Información del proyecto</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={status.color}>{status.label}</Badge>
                {project.status === 'in_progress' && project.payment_status !== 'released' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    disabled={completingProject}
                    onClick={handleMarkCompleted}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar como completado
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">{project.description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              {project.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </div>
              )}
              {project.estimated_budget != null && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(project.estimated_budget)}
                </div>
              )}
              {project.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.created_at)}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {project.is_all_inclusive && (
                <Badge variant="outline">A todo costo</Badge>
              )}
              {project.client_provides_materials && (
                <Badge variant="outline">Cliente provee materiales</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {hasAcceptedQuote && (() => {
          const acceptedQuote = quotes.find(
            (q) => q.id === project.selected_quote_id || q.status === 'accepted'
          );
          if (!acceptedQuote) return null;
          const quoteAmount = acceptedQuote.amount;
          const commission = quoteAmount * (CLIENT_COMMISSION_PERCENT / 100);
          const totalToPay = quoteAmount + commission;
          const isPaid = project.payment_status === 'paid';
          const isReleased = project.payment_status === 'released';
          return (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                  Fondos en garantía (escrow)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-white border border-amber-200 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Oferta contratada</span>
                    <span className="font-medium">{formatCurrency(quoteAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Comisión CONSTRUCTODO ({CLIENT_COMMISSION_PERCENT}% sobre la oferta)
                    </span>
                    <span className="font-medium">{formatCurrency(commission)}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2 flex justify-between font-semibold text-amber-900">
                    <span>Total a pagar a garantía</span>
                    <span>{formatCurrency(totalToPay)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-100/80 rounded-lg p-3">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    CONSTRUCTODO retiene el pago en garantía hasta que apruebes el trabajo. Al liberar el pago, el profesional recibe el dinero (menos la comisión de la plataforma).
                  </p>
                </div>
                {isReleased ? (
                  <p className="text-sm text-green-700 font-medium">
                    Pago liberado al profesional. Proyecto completado.
                    {project.paid_at && ` Pagado el ${formatDate(project.paid_at)}`}.
                  </p>
                ) : isPaid ? (
                  <div className="space-y-3">
                    <p className="text-sm text-green-700 font-medium">
                      Fondos en garantía
                      {project.paid_at && ` (pagado el ${formatDate(project.paid_at)})`}.
                    </p>
                    <p className="text-sm text-slate-600">
                      Cuando el trabajo esté listo, libera el pago para que el profesional lo reciba y el proyecto quede completado.
                    </p>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={releasingPayment}
                      onClick={handleReleaseAndComplete}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {releasingPayment ? 'Liberando...' : 'Liberar pago y marcar completado'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Realiza el pago a la cuenta CONSTRUCTODO para depositar los fondos en garantía. Después de pagar, confirma aquí.
                    </p>
                    <Button
                      className="bg-amber-500 hover:bg-amber-600"
                      disabled={confirmingPayment}
                      onClick={handleConfirmPayment}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {confirmingPayment ? 'Registrando...' : 'Confirmar pago (depositar en garantía)'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {(hasAcceptedQuote || transactions.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay movimientos registrados.</p>
              ) : (
                <ul className="space-y-0 divide-y divide-slate-200">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {TRANSACTION_TYPE_LABELS[tx.transaction_type]}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                      {tx.amount != null && (
                        <span className="text-sm font-semibold text-slate-700 shrink-0">
                          {formatCurrency(tx.amount)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {quotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Ofertas ({quotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                {hasAcceptedQuote
                  ? project?.status === 'completed'
                    ? 'Proyecto completado. Puedes calificar al profesional en Mis Reseñas.'
                    : 'Has contratado a un profesional. Paga a garantía y, cuando el trabajo esté listo, libera el pago para completar.'
                  : 'Revisa las ofertas y contrata a un profesional. Al contratar, las demás ofertas quedarán rechazadas.'}
              </p>
              <div className="space-y-3">
                {quotes.map((quote) => {
                  const quoteStatus = QUOTE_STATUS[quote.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.pending;
                  const isPending = quote.status === 'pending';
                  const busy = actionLoading === quote.id;
                  return (
                    <div
                      key={quote.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="space-y-0.5">
                          {quote.professional_name ? (
                            <p className="text-sm font-medium text-slate-700">
                              Oferta de <span className="text-slate-900">{quote.professional_name}</span>
                            </p>
                          ) : null}
                          <p className="font-medium text-slate-800">{formatCurrency(quote.amount)}</p>
                        </div>
                        {quote.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">{quote.description}</p>
                        )}
                        {quote.estimated_days != null && (
                          <p className="text-xs text-slate-500 mt-1">~{quote.estimated_days} días</p>
                        )}
                        {quote.created_at && (
                          <p className="text-xs text-slate-400 mt-1">{formatDate(quote.created_at)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={quoteStatus.color}>{quoteStatus.label}</Badge>
                        {isPending && !hasAcceptedQuote && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={busy}
                              onClick={() => handleAcceptQuote(quote)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Contratar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={busy}
                              onClick={() => handleRejectQuote(quote)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Declinar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
