import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowDownToLine, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BalanceResponse,
  WithdrawalMethod,
  Withdrawal,
  BalanceTransaction,
  formatCurrency,
  formatDate,
} from '@/lib/api';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Balance() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balanceTx, setBalanceTx] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethodId, setWithdrawMethodId] = useState<number | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const token = getStoredToken();

  const loadAll = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [balanceRes, methodsRes, withdrawalsRes, txRes] = await Promise.all([
        fetch(`${getAPIBaseURL()}/api/v1/balance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getAPIBaseURL()}/api/v1/withdrawal-methods`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getAPIBaseURL()}/api/v1/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getAPIBaseURL()}/api/v1/balance/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (balanceRes.ok) setBalance(await balanceRes.json());
      if (methodsRes.ok) {
        const j = await methodsRes.json();
        setMethods(j.items || []);
      }
      if (withdrawalsRes.ok) {
        const j = await withdrawalsRes.json();
        setWithdrawals(j.items || []);
      }
      if (txRes.ok) {
        const j = await txRes.json();
        setBalanceTx(j.items || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount.replace(/,/g, '.'));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Indica un monto válido');
      return;
    }
    const currentBalance = balance?.balance ?? 0;
    if (amount > currentBalance) {
      toast.error('Saldo insuficiente');
      return;
    }
    if (!withdrawMethodId) {
      toast.error('Selecciona un método de retiro');
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          withdrawal_method_id: withdrawMethodId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Error al solicitar retiro');
      setBalance((prev) => (prev ? { ...prev, balance: data.balance_after ?? prev.balance - amount } : null));
      setWithdrawAmount('');
      toast.success('Solicitud de retiro enviada');
      loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al solicitar retiro');
    } finally {
      setWithdrawing(false);
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const currentBalance = balance?.balance ?? 0;

  return (
    <DashboardLayout userType={userType ?? 'client'} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mi saldo</h1>
          <p className="text-slate-500 mt-1">
            Saldo disponible por pagos liberados. Conecta un método de retiro para recibir tu dinero.
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-700" />
              Saldo disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-40" />
            ) : (
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(currentBalance)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5" />
              Retirar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">Monto (COP)</Label>
                <Input
                  id="withdraw-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 max-w-xs"
                />
              </div>
              <div>
                <Label>Método de retiro</Label>
                <select
                  className="mt-1 flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={withdrawMethodId ?? ''}
                  onChange={(e) => setWithdrawMethodId(e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label || m.bank_name || `Cuenta ****${m.account_last4 || ''}`}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={withdrawing || currentBalance <= 0 || methods.length === 0}>
                {withdrawing ? 'Enviando...' : 'Solicitar retiro'}
              </Button>
            </form>
            <p className="text-sm text-slate-500 mt-3">
              Para añadir o cambiar cuentas de retiro, ve a{' '}
              <Link to="/settings" className="text-amber-600 hover:underline font-medium inline-flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {withdrawals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retiros recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-200">
                {withdrawals.slice(0, 10).map((w) => (
                  <li key={w.id} className="py-3 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{formatCurrency(w.amount)}</p>
                      <p className="text-sm text-slate-500">
                        {w.method_label || w.bank_name || `****${w.account_last4 || ''}`} · {formatDate(w.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        w.status === 'completed'
                          ? 'text-green-600 text-sm font-medium'
                          : w.status === 'pending'
                            ? 'text-amber-600 text-sm font-medium'
                            : 'text-red-600 text-sm font-medium'
                      }
                    >
                      {w.status === 'completed' ? 'Completado' : w.status === 'pending' ? 'Pendiente' : 'Fallido'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {balanceTx.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Movimientos de saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-200">
                {balanceTx.slice(0, 15).map((tx) => (
                  <li key={tx.id} className="py-3 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {tx.type === 'released_payment' ? 'Pago liberado' : tx.type === 'withdrawal' ? 'Retiro' : tx.type}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={tx.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
