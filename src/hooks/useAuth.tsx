import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('🔄 AuthProvider renderizando...');
  
  // Versão simplificada para debug
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect iniciando...');
    let mounted = true;
    
    const ensureProfile = async (userId: string) => {
      try {
        console.log('🔍 [AUTH] Verificando perfil para usuário:', userId);
        
        // Check if profile exists
        const { data: profile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (checkError) {
          console.error('❌ [AUTH] Erro ao verificar perfil:', checkError);
          throw checkError;
        }
        
        if (profile) {
          console.log('✅ [AUTH] Perfil existe');
          return true;
        }
        
        // Profile doesn't exist, try to create it via edge function
        console.log('⚠️ [AUTH] Perfil não existe, criando...');
        
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) {
          console.error('❌ [AUTH] Sem sessão para criar perfil');
          return false;
        }
        
        const { data: result, error: ensureError } = await supabase.functions.invoke('ensure-profile');
        
        if (ensureError) {
          console.error('❌ [AUTH] Erro ao criar perfil:', ensureError);
          throw ensureError;
        }
        
        console.log('✅ [AUTH] Perfil criado com sucesso:', result);
        return true;
        
      } catch (error) {
        console.error('❌ [AUTH] Erro em ensureProfile:', error);
        return false;
      }
    };
    
    const initAuth = async () => {
      try {
        console.log('🔄 Obtendo sessão inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('❌ Erro de auth:', error);
          } else {
            console.log('✅ Sessão obtida:', session ? 'Logado' : 'Não logado');
          }
          
          // If user is logged in, ensure profile exists
          if (session?.user) {
            await ensureProfile(session.user.id);
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização do auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de estado auth:', event);
        if (mounted) {
          // If signed in, ensure profile exists
          if (session?.user && event === 'SIGNED_IN') {
            setTimeout(async () => {
              await ensureProfile(session.user.id);
            }, 0);
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      console.log('🧹 AuthProvider cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('🔄 Fazendo logout...');
      // Clean up auth state to prevent limbo
      const { cleanupAuthState } = await import('@/utils/authCleanup');
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  console.log('✅ AuthProvider renderizado com sucesso');
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}