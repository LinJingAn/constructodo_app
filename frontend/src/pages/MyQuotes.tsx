import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  HourglassIcon,
} from 'lucide-react';
import {
  client,
  Quote,
  QUOTE_STATUS,
  formatCurrency,
  formatDate,
  PROFESSIONAL_COMMISSION_PERCENT,
} from '@/lib/api';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MyQuotes() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const { getUnreadByProjectId } = useUnreadChat();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (userType === 'client') navigate('/dashboard', { replace: true });
  }, [userType, profileLoading, navigate]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await client.entities.quotes.query({
        sort: '-created_at',
        limit: 50,
      });
      
      if (response.data?.items) {
        setQuotes(response.data.items);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Error al cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const filteredQuotes = quotes.filter((quote) => {
    if (activeTab === 'all') return true;
    return quote.status === activeTab;
  });

  const getStatusCounts = () => {
    return {
      all: quotes.length,
      pending: quotes.filter((q) => q.status === 'pending').length,
      accepted: quotes.filter((q) => q.status === 'accepted').length,
      rejected: quotes.filter((q) => q.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <HourglassIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (profileLoading || userType === 'client') {
    return (
      <DashboardLayout userType="professional" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userType={userType} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Mis ofertas
          </h1>
          <p className="text-slate-500 mt-1">
            Ofertas que enviaste a proyectos (enviadas, contratadas, rechazadas)
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              Todas ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white">
              Enviadas ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="data-[state=active]:bg-white">
              Contratadas ({counts.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
              Rechazadas ({counts.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredQuotes.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No hay ofertas
                </h3>
                <p className="text-slate-500">
                  {activeTab === 'all'
                    ? 'Aún no has enviado ninguna oferta'
                    : `No tienes ofertas ${
                        activeTab === 'pending'
                          ? 'enviadas'
                          : activeTab === 'accepted'
                          ? 'contratadas'
                          : 'rechazadas'
                      }`}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuotes.map((quote) => {
                  const status =
                    QUOTE_STATUS[quote.status as keyof typeof QUOTE_STATUS] ||
                    QUOTE_STATUS.pending;

                  return (
                    <Card key={quote.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            {getStatusIcon(quote.status)}
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-slate-800">
                                  Oferta #{quote.id}
                                </h3>
                                <Badge className={status.color}>{status.label}</Badge>
                              </div>
                              {quote.description && (
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                  {quote.description}
                                </p>
                              )}
                              {quote.status === 'accepted' && (
                                <p className="text-sm text-green-700 font-medium mb-2">
                                  Contratado. Recibirás {formatCurrency(quote.amount * (1 - PROFESSIONAL_COMMISSION_PERCENT / 100))}{' '}
                                  (después del {PROFESSIONAL_COMMISSION_PERCENT}% de comisión) cuando el cliente libere el pago.
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-medium text-slate-700">
                                    {formatCurrency(quote.amount)}
                                  </span>
                                </div>
                                {quote.estimated_days && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {quote.estimated_days} días
                                  </div>
                                )}
                                {quote.created_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(quote.created_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link to={`/projects/${quote.project_id}/chat`}>
                            <Button variant="outline" size="sm" className="shrink-0 relative">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Chat
                              {getUnreadByProjectId(quote.project_id) > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                                  {getUnreadByProjectId(quote.project_id) > 99 ? '99+' : getUnreadByProjectId(quote.project_id)}
                                </span>
                              )}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}