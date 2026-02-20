import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog, RefreshCw, Users, Mail, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, type AdminUser } from '@/api/admin';
import { toast } from 'sonner';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(50, 0);
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, role: 'user' | 'admin') => {
    setUpdatingRole(userId);
    try {
      await adminApi.setUserRole(userId, role);
      toast.success('Rol actualizado');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar rol');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  return (
    <DashboardLayout userType="client" onLogout={handleLogout} isAdmin>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <UserCog className="w-8 h-8 text-amber-600" />
              Gestión de usuarios
            </h1>
            <p className="text-slate-500 mt-1">
              Lista de clientes y profesionales. Cambia roles y conecta manualmente según necesites.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              <Users className="w-4 h-4" />
              {usersTotal} usuarios
            </div>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-slate-500" />
                  Listado de usuarios
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Cambia el rol (Usuario / Admin) con el selector de cada fila.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit text-sm font-normal">
                Total: {usersTotal}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No hay usuarios registrados</p>
                <p className="text-slate-400 text-sm mt-1">Los usuarios aparecerán aquí al registrarse.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b">
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nombre</TableHead>
                      <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nombre perfil</TableHead>
                      <TableHead className="font-semibold text-slate-700">WhatsApp</TableHead>
                      <TableHead className="font-semibold text-slate-700">Rol</TableHead>
                      <TableHead className="font-semibold text-slate-700">Último acceso</TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[160px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, i) => (
                      <TableRow
                        key={u.id}
                        className={`border-b transition-colors hover:bg-amber-50/50 ${
                          i % 2 === 1 ? 'bg-slate-50/30' : ''
                        }`}
                      >
                        <TableCell className="font-mono text-sm text-slate-800">{u.email}</TableCell>
                        <TableCell className="text-slate-700">{u.name || '—'}</TableCell>
                        <TableCell>
                          {u.user_type ? (
                            <Badge
                              variant="outline"
                              className={
                                u.user_type === 'professional'
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-blue-300 bg-blue-50 text-blue-800'
                              }
                            >
                              {u.user_type === 'professional' ? 'Profesional' : 'Cliente'}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">{u.profile_full_name || '—'}</TableCell>
                        <TableCell className="text-slate-600">{u.whatsapp || '—'}</TableCell>
                        <TableCell>
                          {u.role === 'admin' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-0 gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600 gap-1">
                              <Shield className="w-3.5 h-3.5" />
                              Usuario
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm tabular-nums">
                          {u.last_login
                            ? new Date(u.last_login).toLocaleString('es', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value as 'user' | 'admin')}
                            disabled={updatingRole === u.id}
                          >
                            <SelectTrigger
                              className={`w-[130px] ml-auto ${
                                u.role === 'admin'
                                  ? 'border-amber-200 bg-amber-50/50'
                                  : 'border-slate-200'
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
