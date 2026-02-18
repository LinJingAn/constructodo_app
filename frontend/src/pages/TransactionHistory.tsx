import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight } from 'lucide-react';
import {
  ProjectTransaction,
  TRANSACTION_TYPE_LABELS,
  formatCurrency,
  formatDate,
} from '@/lib/api';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ProjectTransaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const token = getStoredToken();
    try {
      setLoading(true);
      const res = await fetch(`${getAPIBaseURL()}/api/v1/entities/project_transactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.items || []);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
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
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial de transacciones</h1>
          <p className="text-slate-500 mt-1">
            Todas las transacciones de tus proyectos (ofertas aceptadas, pagos en garantía y liberaciones).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay transacciones registradas.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {transactions.map((tx) => (
                  <li key={tx.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {TRANSACTION_TYPE_LABELS[tx.transaction_type]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {tx.project_title && (
                            <Link
                              to={`/projects/${tx.project_id}`}
                              className="text-xs text-amber-600 hover:underline font-medium"
                            >
                              {tx.project_title}
                            </Link>
                          )}
                          <span className="text-xs text-slate-500">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {tx.amount != null && (
                          <span className="text-sm font-semibold text-slate-700">
                            {formatCurrency(tx.amount)}
                          </span>
                        )}
                        <Link
                          to={`/projects/${tx.project_id}`}
                          className="text-slate-400 hover:text-amber-600 p-1"
                          title="Ver proyecto"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
