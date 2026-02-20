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
import { UserCog, RefreshCw } from 'lucide-react';
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
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar usuarios
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Total: {usersTotal}. Puedes cambiar el rol (usuario / admin).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nombre perfil</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead className="w-[140px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.name || '—'}</TableCell>
                        <TableCell>
                          {u.user_type ? (
                            <Badge variant={u.user_type === 'professional' ? 'default' : 'secondary'}>
                              {u.user_type === 'professional' ? 'Profesional' : 'Cliente'}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>{u.profile_full_name || '—'}</TableCell>
                        <TableCell>{u.whatsapp || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {u.last_login
                            ? new Date(u.last_login).toLocaleString()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value as 'user' | 'admin')}
                            disabled={updatingRole === u.id}
                          >
                            <SelectTrigger className="w-[120px]">
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
