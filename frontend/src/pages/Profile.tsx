import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/ui/star-rating';
import { Save, Shield, Star, User, Lock } from 'lucide-react';
import { client, UserProfile, CONSTRUCTION_SERVICES } from '@/lib/api';
import { DEFAULT_AVATAR_URL } from '@/lib/config';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    id_number: '',
    bio: '',
    services: [] as string[],
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await client.entities.user_profiles.query({ limit: 1 });
      
      if (response.data?.items?.length > 0) {
        const profileData = response.data.items[0];
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          whatsapp: profileData.whatsapp || '',
          id_number: profileData.id_number || '',
          bio: profileData.bio || '',
          services: profileData.services ? JSON.parse(profileData.services) : [],
        });
      } else {
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.full_name || !formData.email) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      await client.entities.user_profiles.update({
        id: profile!.id,
        data: {
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp || null,
          id_number: formData.id_number || null,
          bio: formData.bio || null,
          services: profile?.user_type === 'professional' ? JSON.stringify(formData.services) : null,
        },
      });

      toast.success('Perfil actualizado exitosamente');
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (!passwordForm.current_password) {
      toast.error('Introduce tu contraseña actual');
      return;
    }
    setChangingPassword(true);
    try {
      const token = getStoredToken();
      const res = await fetch(`${getAPIBaseURL()}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.detail || 'Error al cambiar contraseña');
        return;
      }
      toast.success(data.message || 'Contraseña actualizada');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      toast.error('Error de conexión');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <DashboardLayout userType="client" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  const userType = profile?.user_type || 'client';
  const initials = formData.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Mi Perfil</h1>
          <p className="text-slate-500 mt-1">Actualiza tu información personal</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.profile_image || DEFAULT_AVATAR_URL} alt={profile?.full_name} />
                  <AvatarFallback className="bg-amber-100 text-amber-600 text-2xl">
                    {initials || <User className="w-10 h-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <Badge className={userType === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>
                    {userType === 'client' ? 'Cliente' : 'Profesional'}
                  </Badge>
                  {profile?.is_verified && (
                    <Badge className="ml-2 bg-green-100 text-green-800">Verificado</Badge>
                  )}
                </div>
                {(profile?.average_rating ?? 0) > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <StarRating rating={profile?.average_rating || 0} readonly size="sm" />
                    <span className="text-sm text-slate-500">
                      ({profile?.total_reviews} reseñas)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombres y Apellidos *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">Número de Identificación</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="bio">Perfil (Opcional)</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services (Professional only) */}
        {userType === 'professional' && (
          <Card>
            <CardHeader>
              <CardTitle>Servicios que Ofrezco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0">
                {CONSTRUCTION_SERVICES.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all min-w-0 ${
                      formData.services.includes(service.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.services.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                      className="shrink-0"
                    />
                    <service.icon className="h-5 w-5 text-slate-600 shrink-0" />
                    <span className="text-sm font-medium min-w-0 break-words line-clamp-2">{service.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambiar contraseña
            </CardTitle>
            <p className="text-sm text-slate-500">
              Si iniciaste sesión con correo y contraseña, puedes actualizar tu contraseña aquí.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña actual</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  disabled={changingPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  disabled={changingPassword}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  disabled={changingPassword}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card className={userType === 'client' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className={`w-6 h-6 ${userType === 'client' ? 'text-amber-600' : 'text-slate-600'}`} />
              <div>
                {userType === 'client' ? (
                  <>
                    <h3 className="font-semibold text-amber-800">Garantía CONSTRUCTODO</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      CONSTRUCTODO actúa como garante de la entrega de tu obra. Se aplica una comisión del{' '}
                      <strong>4.5%</strong> sobre la cotización. Cualquier negociación directa con el profesional
                      fuera de la plataforma anulará la garantía.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-800">Información de Comisión</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Se cobra un <strong>10%</strong> sobre el pago recibido. Está estrictamente prohibido
                      negociar fuera de la plataforma CONSTRUCTODO. El incumplimiento puede resultar en la
                      suspensión de tu cuenta.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}