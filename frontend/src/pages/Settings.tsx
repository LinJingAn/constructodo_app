import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import type { WithdrawalMethod, BillingMethod } from '@/lib/api';
import { BILLING_TYPE_LABELS, WITHDRAWAL_TYPE_LABELS } from '@/lib/api';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType } = useUserProfile();
  const token = getStoredToken();

  const [billingMethods, setBillingMethods] = useState<BillingMethod[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const [billingAddOpen, setBillingAddOpen] = useState(false);
  const [billingAddType, setBillingAddType] = useState<'card' | 'paypal' | 'payoneer'>('card');
  const [billingFormCardLast4, setBillingFormCardLast4] = useState('');
  const [billingFormCardBrand, setBillingFormCardBrand] = useState('visa');
  const [billingFormEmail, setBillingFormEmail] = useState('');
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [billingDeleteId, setBillingDeleteId] = useState<number | null>(null);

  const [withdrawalAddOpen, setWithdrawalAddOpen] = useState(false);
  const [withdrawalAddType, setWithdrawalAddType] = useState<'paypal' | 'payoneer' | 'bank_account'>('paypal');
  const [withdrawalFormEmail, setWithdrawalFormEmail] = useState('');
  const [withdrawalFormBankName, setWithdrawalFormBankName] = useState('');
  const [withdrawalFormAccountNumber, setWithdrawalFormAccountNumber] = useState('');
  const [withdrawalFormRouting, setWithdrawalFormRouting] = useState('');
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [withdrawalDeleteId, setWithdrawalDeleteId] = useState<number | null>(null);

  const loadBilling = async () => {
    if (!token) return;
    setBillingLoading(true);
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/billing-methods`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const j = await res.json();
        setBillingMethods(j.items || []);
      }
    } catch {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setBillingLoading(false);
    }
  };

  const loadWithdrawal = async () => {
    if (!token) return;
    setWithdrawalLoading(true);
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/withdrawal-methods`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const j = await res.json();
        setWithdrawalMethods(j.items || []);
      }
    } catch {
      toast.error('Error al cargar métodos de retiro');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  useEffect(() => {
    if (userType === 'client') loadBilling();
    if (userType === 'professional') loadWithdrawal();
  }, [userType]);

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const handleAddBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (billingAddType === 'card') {
      if (!billingFormCardLast4.trim() || billingFormCardLast4.replace(/\s/g, '').length < 4) {
        toast.error('Indica los últimos 4 dígitos de la tarjeta');
        return;
      }
    } else {
      if (!billingFormEmail.trim() || !billingFormEmail.includes('@')) {
        toast.error('Indica un correo válido para PayPal o Payoneer');
        return;
      }
    }
    setBillingSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type: billingAddType,
        is_default: billingMethods.length === 0,
      };
      if (billingAddType === 'card') {
        body.card_number = billingFormCardLast4.padStart(4, '0').slice(-4);
        body.card_brand = billingFormCardBrand;
      } else {
        body.email = billingFormEmail.trim();
      }
      const res = await fetch(`${getAPIBaseURL()}/api/v1/billing-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al añadir');
      }
      toast.success('Método de pago añadido');
      setBillingAddOpen(false);
      setBillingFormCardLast4('');
      setBillingFormEmail('');
      loadBilling();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al añadir');
    } finally {
      setBillingSubmitting(false);
    }
  };

  const handleSetDefaultBilling = async (id: number) => {
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/billing-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error();
      toast.success('Método por defecto actualizado');
      loadBilling();
    } catch {
      toast.error('No se pudo establecer como predeterminado');
    }
  };

  const handleDeleteBilling = async (id: number) => {
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/billing-methods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      toast.success('Método eliminado');
      setBillingDeleteId(null);
      loadBilling();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawalAddType === 'bank_account') {
      if (!withdrawalFormBankName.trim() || !withdrawalFormAccountNumber.trim()) {
        toast.error('Nombre del banco y número de cuenta son obligatorios');
        return;
      }
    } else {
      if (!withdrawalFormEmail.trim() || !withdrawalFormEmail.includes('@')) {
        toast.error('Indica un correo válido para PayPal o Payoneer');
        return;
      }
    }
    setWithdrawalSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type: withdrawalAddType,
        is_default: withdrawalMethods.length === 0,
      };
      if (withdrawalAddType === 'bank_account') {
        body.bank_name = withdrawalFormBankName.trim();
        body.account_number = withdrawalFormAccountNumber.trim();
        body.routing_or_swift = withdrawalFormRouting.trim() || undefined;
      } else {
        body.email = withdrawalFormEmail.trim();
      }
      const res = await fetch(`${getAPIBaseURL()}/api/v1/withdrawal-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al añadir');
      }
      toast.success('Método de retiro añadido');
      setWithdrawalAddOpen(false);
      setWithdrawalFormEmail('');
      setWithdrawalFormBankName('');
      setWithdrawalFormAccountNumber('');
      setWithdrawalFormRouting('');
      loadWithdrawal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al añadir');
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const handleSetDefaultWithdrawal = async (id: number) => {
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/withdrawal-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error();
      toast.success('Método por defecto actualizado');
      loadWithdrawal();
    } catch {
      toast.error('No se pudo establecer como predeterminado');
    }
  };

  const handleDeleteWithdrawal = async (id: number) => {
    try {
      const res = await fetch(`${getAPIBaseURL()}/api/v1/withdrawal-methods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      toast.success('Método eliminado');
      setWithdrawalDeleteId(null);
      loadWithdrawal();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Configuración</h1>
          <p className="text-slate-500 mt-1">Administra tu cuenta y preferencias</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-amber-500/50" onClick={() => navigate('/profile')}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>Nombre, correo, teléfono y datos de tu cuenta</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="opacity-75">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Próximamente: preferencias de notificaciones</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="opacity-75">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <CardTitle>Privacidad y seguridad</CardTitle>
                <CardDescription>Próximamente: contraseña y seguridad</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        {userType === 'client' && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Métodos de facturación (pago)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Tarjeta, PayPal o Payoneer para pagar proyectos y depositar en garantía.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setBillingAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir método
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : billingMethods.length === 0 ? (
                <p className="text-slate-500 text-sm">No tienes métodos de pago. Añade tarjeta, PayPal o Payoneer.</p>
              ) : (
                <ul className="space-y-3">
                  {billingMethods.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="font-medium text-slate-800">{m.label}</p>
                        {m.last4 && <p className="text-sm text-slate-500">****{m.last4}</p>}
                        {m.is_default && (
                          <span className="inline-block mt-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Por defecto</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!m.is_default && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefaultBilling(m.id)}>
                            Usar por defecto
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setBillingDeleteId(m.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {userType === 'professional' && (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Métodos de retiro
                  </CardTitle>
                  <CardDescription className="mt-1">
                    PayPal, Payoneer o cuenta bancaria para recibir retiros desde Mi saldo.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setWithdrawalAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir método
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {withdrawalLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : withdrawalMethods.length === 0 ? (
                <p className="text-slate-500 text-sm">No tienes métodos de retiro. Añade PayPal, Payoneer o cuenta bancaria.</p>
              ) : (
                <ul className="space-y-3">
                  {withdrawalMethods.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div>
                        <p className="font-medium text-slate-800">{m.label}</p>
                        {m.account_last4 && <p className="text-sm text-slate-500">****{m.account_last4}</p>}
                        {m.is_default && (
                          <span className="inline-block mt-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Por defecto</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!m.is_default && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefaultWithdrawal(m.id)}>
                            Usar por defecto
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setWithdrawalDeleteId(m.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Acerca de CONSTRUCTODO
            </CardTitle>
            <CardDescription>
              Portal {userType === 'client' ? 'Cliente' : 'Profesional'} — gestión de proyectos y cotizaciones.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Dialog open={billingAddOpen} onOpenChange={setBillingAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir método de pago</DialogTitle>
            <DialogDescription>Tarjeta, PayPal o Payoneer para facturación.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBilling} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-2">
                {(['card', 'paypal', 'payoneer'] as const).map((t) => (
                  <Button key={t} type="button" variant={billingAddType === t ? 'default' : 'outline'} size="sm" onClick={() => setBillingAddType(t)}>
                    {BILLING_TYPE_LABELS[t] || t}
                  </Button>
                ))}
              </div>
            </div>
            {billingAddType === 'card' && (
              <>
                <div>
                  <Label htmlFor="billing-last4">Últimos 4 dígitos de la tarjeta</Label>
                  <Input id="billing-last4" value={billingFormCardLast4} onChange={(e) => setBillingFormCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" className="mt-1" maxLength={4} />
                </div>
                <div>
                  <Label htmlFor="billing-brand">Marca</Label>
                  <select id="billing-brand" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={billingFormCardBrand} onChange={(e) => setBillingFormCardBrand(e.target.value)}>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">Amex</option>
                    <option value="card">Otra</option>
                  </select>
                </div>
              </>
            )}
            {(billingAddType === 'paypal' || billingAddType === 'payoneer') && (
              <div>
                <Label htmlFor="billing-email">Correo de la cuenta {billingAddType === 'paypal' ? 'PayPal' : 'Payoneer'}</Label>
                <Input id="billing-email" type="email" value={billingFormEmail} onChange={(e) => setBillingFormEmail(e.target.value)} placeholder="correo@ejemplo.com" className="mt-1" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBillingAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={billingSubmitting}>{billingSubmitting ? 'Guardando...' : 'Añadir'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawalAddOpen} onOpenChange={setWithdrawalAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir método de retiro</DialogTitle>
            <DialogDescription>PayPal, Payoneer o cuenta bancaria para recibir pagos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddWithdrawal} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['paypal', 'payoneer', 'bank_account'] as const).map((t) => (
                  <Button key={t} type="button" variant={withdrawalAddType === t ? 'default' : 'outline'} size="sm" onClick={() => setWithdrawalAddType(t)}>
                    {WITHDRAWAL_TYPE_LABELS[t] || t}
                  </Button>
                ))}
              </div>
            </div>
            {(withdrawalAddType === 'paypal' || withdrawalAddType === 'payoneer') && (
              <div>
                <Label htmlFor="withdrawal-email">Correo de la cuenta {withdrawalAddType === 'paypal' ? 'PayPal' : 'Payoneer'}</Label>
                <Input id="withdrawal-email" type="email" value={withdrawalFormEmail} onChange={(e) => setWithdrawalFormEmail(e.target.value)} placeholder="correo@ejemplo.com" className="mt-1" />
              </div>
            )}
            {withdrawalAddType === 'bank_account' && (
              <>
                <div>
                  <Label htmlFor="withdrawal-bank-name">Nombre del banco</Label>
                  <Input id="withdrawal-bank-name" value={withdrawalFormBankName} onChange={(e) => setWithdrawalFormBankName(e.target.value)} placeholder="Ej. Bancolombia" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="withdrawal-account">Número de cuenta</Label>
                  <Input id="withdrawal-account" value={withdrawalFormAccountNumber} onChange={(e) => setWithdrawalFormAccountNumber(e.target.value)} placeholder="Número de cuenta" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="withdrawal-routing">Código Swift / Routing (opcional)</Label>
                  <Input id="withdrawal-routing" value={withdrawalFormRouting} onChange={(e) => setWithdrawalFormRouting(e.target.value)} placeholder="Opcional" className="mt-1" />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawalAddOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={withdrawalSubmitting}>{withdrawalSubmitting ? 'Guardando...' : 'Añadir'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={billingDeleteId !== null} onOpenChange={(open) => !open && setBillingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
            <AlertDialogDescription>Podrás volver a añadirlo en Configuración.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => billingDeleteId !== null && handleDeleteBilling(billingDeleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={withdrawalDeleteId !== null} onOpenChange={(open) => !open && setWithdrawalDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar método de retiro?</AlertDialogTitle>
            <AlertDialogDescription>Podrás volver a añadirlo en Configuración.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => withdrawalDeleteId !== null && handleDeleteWithdrawal(withdrawalDeleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
