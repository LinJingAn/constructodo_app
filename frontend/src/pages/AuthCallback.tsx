import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/lib/api';
import { Building2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Process the OIDC callback
        await client.auth.login();
        
        // Check if user has a profile
        const profileResponse = await client.entities.user_profiles.query({ limit: 1 });
        
        if (profileResponse.data?.items?.length > 0) {
          // User has profile, go to dashboard
          navigate('/dashboard');
        } else {
          // New user, go to profile setup
          navigate('/profile-setup');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

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