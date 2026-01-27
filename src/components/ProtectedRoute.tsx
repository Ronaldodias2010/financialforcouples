import { useEffect } from 'react';
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

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
    
    // Verificar se o usuário precisa alterar a senha e não está na página de alteração
    if (!loading && user && user.user_metadata?.requires_password_change) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/change-password') {
        window.location.href = '/change-password';
      }
    }
  }, [user, loading]);

  if (loading || coupleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <UnverifiedEmailBanner />
      {children}
    </>
  );
}