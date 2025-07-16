import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import APP_ROUTE from '@/lib/app-route';

export function useRedirectIfNoMfaToken() {
  const navigate = useNavigate();

  useEffect(() => {
    const mfaTransferToken = sessionStorage.getItem('mfaTransferToken');
    
    if (!mfaTransferToken) {
      // If there's no MFA transfer token, redirect to login
      navigate(APP_ROUTE.AUTH.LOGIN);
    }
  }, [navigate]);
}