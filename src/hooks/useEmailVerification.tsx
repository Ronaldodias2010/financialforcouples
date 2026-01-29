import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmailVerificationState {
  emailVerified: boolean;
  provisionalLogin: boolean;
  loading: boolean;
  error: string | null;
}

export function useEmailVerification() {
  const { user } = useAuth();
  const [state, setState] = useState<EmailVerificationState>({
    emailVerified: true, // Default to true to prevent flash of unverified state
    provisionalLogin: false,
    loading: true,
    error: null,
  });

  const fetchVerificationStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      console.log('[EmailVerification] Fetching verification status for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verified, provisional_login')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[EmailVerification] Error fetching status:', error);
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      if (data) {
        console.log('[EmailVerification] Status:', data);
        setState({
          emailVerified: data.email_verified ?? false,
          provisionalLogin: data.provisional_login ?? true,
          loading: false,
          error: null,
        });
      } else {
        // Profile doesn't exist yet, assume unverified
        setState({
          emailVerified: false,
          provisionalLogin: true,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('[EmailVerification] Unexpected error:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to fetch verification status' }));
    }
  }, [user]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const verifyEmail = useCallback(async () => {
    if (!user) return false;

    try {
      console.log('[EmailVerification] Verifying email for user:', user.id);
      
      const { error } = await supabase.rpc('verify_user_email', { p_user_id: user.id });

      if (error) {
        console.error('[EmailVerification] Error verifying email:', error);
        return false;
      }

      setState(prev => ({
        ...prev,
        emailVerified: true,
        provisionalLogin: false,
      }));

      return true;
    } catch (err) {
      console.error('[EmailVerification] Unexpected error:', err);
      return false;
    }
  }, [user]);

  const resendConfirmationEmail = useCallback(async () => {
    if (!user?.email) return false;

    try {
      console.log('[EmailVerification] Resending confirmation email to:', user.email);
      
      const { error } = await supabase.functions.invoke('send-confirmation', {
        body: { userEmail: user.email }
      });

      if (error) {
        console.error('[EmailVerification] Error resending email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[EmailVerification] Unexpected error:', err);
      return false;
    }
  }, [user]);

  const isActionBlocked = useCallback((action: 'change_email' | 'change_password' | 'withdrawal' | 'delete_account') => {
    if (state.emailVerified) return false;
    
    const blockedActions = ['change_email', 'change_password', 'withdrawal', 'delete_account'];
    return blockedActions.includes(action);
  }, [state.emailVerified]);

  return {
    ...state,
    verifyEmail,
    resendConfirmationEmail,
    isActionBlocked,
    refetch: fetchVerificationStatus,
  };
}
