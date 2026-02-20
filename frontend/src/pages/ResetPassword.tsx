import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock } from 'lucide-react';
import { authApi } from '@/lib/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError('Falta el enlace de restablecimiento. Solicita uno nuevo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800">CONSTRUCTODO</span>
        </Link>

        <Card className="w-full max-w-md shadow-xl border-slate-200">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Contraseña actualizada</CardTitle>
            <CardDescription>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2 border-t border-slate-200 pt-6">
            <Button
              className="w-full h-12 bg-amber-600 hover:bg-amber-700"
              onClick={() => navigate('/login', { replace: true })}
            >
              Ir a iniciar sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-800">CONSTRUCTODO</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
          <CardDescription>
            Introduce tu nueva contraseña (mínimo 6 caracteres).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenFromUrl && (
              <div className="space-y-2">
                <Label htmlFor="token">Código de restablecimiento</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Pega aquí el código del correo"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                'Restablecer contraseña'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600 text-center">
            <Link to="/forgot-password" className="font-medium text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
              Solicitar otro enlace
            </Link>
          </p>
          <Button variant="ghost" asChild>
            <Link to="/login">Volver a iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
