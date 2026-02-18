import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertCircle } from 'lucide-react';

export default function AuthError() {
  const [searchParams] = useSearchParams();
  const msg = searchParams.get('msg') || 'Ocurrió un error al autenticar. Por favor intenta de nuevo.';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-800">CONSTRUCTODO</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-slate-200 border-destructive/20">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Error de autenticación</CardTitle>
          <CardDescription>
            No pudimos completar el inicio de sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
            {msg}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <Button asChild className="w-full bg-amber-500 hover:bg-amber-600">
            <Link to="/login">Intentar de nuevo</Link>
          </Button>
          <Button variant="ghost" asChild className="text-slate-600">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
