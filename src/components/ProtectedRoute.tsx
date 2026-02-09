import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { Loader2 } from 'lucide-react';
import { UnverifiedEmailBanner } from '@/components/auth/UnverifiedEmailBanner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isPartOfCouple, loading: coupleLoading } = useCouple();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending redirect when user becomes available
    if (user) {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    }

    if (!loading && !user) {
      // Debounce the redirect to avoid redirecting during transient auth states
      // (e.g., token refresh momentarily clearing the session)
      if (!redirectTimerRef.current) {
        redirectTimerRef.current = setTimeout(() => {
          // Re-check: if still no user after delay, redirect
          window.location.href = '/auth';
        }, 2000);
      }
    }
    
    // Verificar se o usuário precisa alterar a senha e não está na página de alteração
    if (!loading && user && user.user_metadata?.requires_password_change) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/change-password') {
        window.location.href = '/change-password';
      }
    }

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [user, loading]);

  if (loading || coupleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Show loading while debounce timer is pending instead of null
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <UnverifiedEmailBanner />
      {children}
    </>
  );
}