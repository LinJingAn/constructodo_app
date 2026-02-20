import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail } from 'lucide-react';
import { authApi } from '@/lib/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Introduce tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.requestPasswordReset(email.trim());
      setSent(true);
      if (data.reset_link) setResetLink(data.reset_link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Revisa tu correo</CardTitle>
            <CardDescription>
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. El enlace caduca en 1 hora.
            </CardDescription>
          </CardHeader>
          {resetLink && (
            <CardContent>
              <p className="text-sm text-slate-600 mb-2">En desarrollo puedes usar este enlace:</p>
              <a
                href={resetLink}
                className="text-sm text-amber-600 hover:text-amber-700 break-all underline"
              >
                {resetLink}
              </a>
            </CardContent>
          )}
          <CardFooter className="flex flex-col gap-2 border-t border-slate-200 pt-6">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Volver a iniciar sesión</Link>
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
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription>
            Introduce tu correo y te enviaremos un enlace para restablecerla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full h-12 bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar enlace de restablecimiento'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600 text-center">
            <Link to="/login" className="font-medium text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
