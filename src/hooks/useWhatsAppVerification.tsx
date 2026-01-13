import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface VerificationStatus {
  isVerified: boolean;
  phoneNumber: string | null;
  verifiedAt: string | null;
}

export const useWhatsAppVerification = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>({
    isVerified: true, // Default to true to avoid flash
    phoneNumber: null,
    verifiedAt: null
  });
  const [loading, setLoading] = useState(true);

  // Rotas onde NÃO mostrar o modal de verificação
  const excludedRoutes = [
    '/',
    '/auth',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/email-confirmation',
    '/send-confirmation',
    '/privacy',
    '/terms',
    '/sobre-nos',
    '/about-us',
    '/parceria',
    '/partnership',
    '/asociacion',
    '/checkout-direto',
    '/checkout-email-confirmation',
    '/landing-simple',
    '/install',
    '/auth/callback'
  ];

  const checkVerificationStatus = useCallback(async () => {
    if (!user?.id) {
      setShouldShowModal(false);
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone_number, whatsapp_verified_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking WhatsApp verification:', error);
        setLoading(false);
        return;
      }

      const isVerified = !!profile?.whatsapp_verified_at;
      const hasPhone = !!profile?.phone_number && profile.phone_number.length > 0;

      setStatus({
        isVerified,
        phoneNumber: profile?.phone_number || null,
        verifiedAt: profile?.whatsapp_verified_at || null
      });

      // Mostrar modal se não verificado E estiver em rota protegida
      const isExcludedRoute = excludedRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith(route + '/')
      );

      setShouldShowModal(!isVerified && !isExcludedRoute);
      setLoading(false);
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
      setLoading(false);
    }
  }, [user?.id, location.pathname]);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  const onVerificationSuccess = useCallback(() => {
    setShouldShowModal(false);
    setStatus(prev => ({
      ...prev,
      isVerified: true,
      verifiedAt: new Date().toISOString()
    }));
  }, []);

  const refreshStatus = useCallback(() => {
    setLoading(true);
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  return {
    shouldShowModal,
    status,
    loading,
    onVerificationSuccess,
    refreshStatus
  };
};
