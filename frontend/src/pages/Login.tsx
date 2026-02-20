import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { client } from '@/lib/api';
import { authApi } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Introduce correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      await authApi.emailLogin(email.trim(), password);
      // Full page redirect so SDK client is re-created with token from localStorage
      window.location.href = '/dashboard';
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await client.auth.toLogin();
      // Redirect happens via backend
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setLoading(false);
    }
  };

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
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-2">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Accede con tu correo o con Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-300"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión con correo'
              )}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">o continúa con</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium border-slate-300 hover:bg-slate-50 hover:border-slate-400"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="flex items-center gap-3">
              <GoogleIcon className="w-5 h-5" />
              Continuar con Google
            </span>
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600 text-center">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
              Regístrate
            </Link>
          </p>
          <Button variant="ghost" className="text-slate-600" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
