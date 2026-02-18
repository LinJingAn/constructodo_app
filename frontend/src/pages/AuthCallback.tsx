import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { client } from '@/lib/api';
import { authApi } from '@/lib/auth';
import { getAPIBaseURL } from '@/lib/config';
import { Building2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (tokenFromUrl) {
          authApi.setToken(tokenFromUrl);
          const res = await fetch(`${getAPIBaseURL()}/api/v1/entities/user_profiles?limit=1`, {
            headers: { Authorization: `Bearer ${tokenFromUrl}` },
          });
          const data = await res.json();
          const hasProfile = data?.items?.length > 0;
          navigate(hasProfile ? '/dashboard' : '/profile-setup');
          return;
        }
        await client.auth.login();
        const profileResponse = await client.entities.user_profiles.query({ limit: 1 });
        if (profileResponse.data?.items?.length > 0) {
          navigate('/dashboard');
        } else {
          navigate('/profile-setup');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, tokenFromUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Autenticando...
        </h2>
        <p className="text-slate-500">
          Por favor espera mientras verificamos tu cuenta.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}