import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const LogoutCallbackPage: React.FC = () => {
  useEffect(() => {
    // The OIDC provider has logged out the user and redirected here
    // We can redirect to the home page or show a logout success message
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Logout Successful
        </h2>
        <p className="text-gray-600 mb-4">
          You have been successfully logged out.
        </p>
        <p className="text-sm text-gray-500">Redirecting to home page...</p>
      </div>
    </div>
  );
};

export default LogoutCallbackPage;
