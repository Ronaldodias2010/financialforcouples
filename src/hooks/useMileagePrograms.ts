import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getProgramByCode, MILEAGE_PROGRAMS } from '@/data/mileagePrograms';
import { toast } from 'sonner';

export interface MileageProgram {
  id: string;
  user_id: string;
  program_code: string;
  program_name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  balance_miles: number;
  balance_value: number | null;
  last_sync_at: string | null;
  last_error: string | null;
  external_member_id: string | null;
  sync_source?: 'manual' | 'browser_extension' | null;
  created_at: string;
  updated_at: string;
}

export interface MileageProgramHistory {
  id: string;
  program_id: string;
  transaction_date: string;
  description: string | null;
  miles_amount: number;
  transaction_type: string | null;
  source: string;
}

const CONNECTING_TIMEOUT_MS = 60_000; // 1 minute timeout

export function useMileagePrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<MileageProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Check for stuck "connecting" programs and update them to error after 1 minute
  const checkConnectingTimeouts = useCallback(async (programsList: MileageProgram[]) => {
    const now = Date.now();
    const stuckPrograms = programsList.filter(p => {
      if (p.status !== 'connecting') return false;
      const updatedAt = new Date(p.updated_at).getTime();
      return now - updatedAt > CONNECTING_TIMEOUT_MS;
    });

    if (stuckPrograms.length > 0) {
      console.log(`[useMileagePrograms] Found ${stuckPrograms.length} stuck programs, updating to error`);
      
      for (const program of stuckPrograms) {
        await supabase
          .from('mileage_programs')
          .update({
            status: 'error',
            last_error: 'Tempo limite de 1 minuto excedido. Tente novamente.',
            updated_at: new Date().toISOString()
          })
          .eq('id', program.id);
      }

      // Reload programs after updating
      return true;
    }
    return false;
  }, []);

  const loadPrograms = useCallback(async () => {
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mileage_programs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const programsList = (data as MileageProgram[]) || [];
      
      // Check for timeout on connecting programs
      const hadTimeouts = await checkConnectingTimeouts(programsList);
      
      if (hadTimeouts) {
        // Reload after updating stuck programs
        const { data: refreshedData } = await supabase
          .from('mileage_programs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        setPrograms((refreshedData as MileageProgram[]) || []);
      } else {
        setPrograms(programsList);
      }
    } catch (error) {
      console.error('Error loading mileage programs:', error);
      toast.error('Erro ao carregar programas de milhagem');
    } finally {
      setLoading(false);
    }
  }, [user, checkConnectingTimeouts]);

  useEffect(() => {
    loadPrograms();

    // Set up periodic check for stuck programs (every 15 seconds)
    timeoutCheckRef.current = setInterval(() => {
      if (programs.some(p => p.status === 'connecting')) {
        loadPrograms();
      }
    }, 15000);

    // Set up Realtime subscription to detect changes from browser extension sync
    const channel = supabase
      .channel('mileage_programs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mileage_programs',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        (payload) => {
          console.log('[useMileagePrograms] Realtime update received:', payload.eventType);
          loadPrograms();
        }
      )
      .subscribe();

    return () => {
      if (timeoutCheckRef.current) {
        clearInterval(timeoutCheckRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [loadPrograms, user]);

  const connectProgram = async (programCode: string, memberId?: string) => {
    if (!user) return null;

    const programConfig = getProgramByCode(programCode);
    if (!programConfig) {
      toast.error('Programa não encontrado');
      return null;
    }

    try {
      // Check if already exists
      const existing = programs.find(p => p.program_code === programCode);
      
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('mileage_programs')
          .update({
            status: 'connecting',
            external_member_id: memberId || null,
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        await loadPrograms();
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('mileage_programs')
          .insert({
            user_id: user.id,
            program_code: programCode,
            program_name: programConfig.name,
            status: 'connecting',
            external_member_id: memberId || null,
            balance_miles: 0
          })
          .select()
          .single();

        if (error) throw error;
        await loadPrograms();
        return data;
      }
    } catch (error) {
      console.error('Error connecting program:', error);
      toast.error('Erro ao conectar programa');
      return null;
    }
  };

  const disconnectProgram = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('mileage_programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      
      toast.success('Programa desconectado com sucesso');
      await loadPrograms();
    } catch (error) {
      console.error('Error disconnecting program:', error);
      toast.error('Erro ao desconectar programa');
    }
  };

  const updateProgramBalance = async (programId: string, balance: number, memberId?: string) => {
    if (!user) return;

    const program = programs.find(p => p.id === programId);
    if (!program) return;

    const programConfig = getProgramByCode(program.program_code);
    const estimatedValue = programConfig 
      ? (balance * programConfig.estimatedValuePerMile) / 100 
      : null;

    try {
      const { error } = await supabase
        .from('mileage_programs')
        .update({
          balance_miles: balance,
          balance_value: estimatedValue,
          status: 'connected',
          last_sync_at: new Date().toISOString(),
          last_error: null,
          external_member_id: memberId || program.external_member_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      if (error) throw error;
      
      toast.success('Saldo atualizado com sucesso');
      await loadPrograms();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Erro ao atualizar saldo');
    }
  };

  const setError = async (programId: string, errorMessage: string) => {
    try {
      const { error } = await supabase
        .from('mileage_programs')
        .update({
          status: 'error',
          last_error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', programId);

      if (error) throw error;
      await loadPrograms();
    } catch (error) {
      console.error('Error setting program error:', error);
    }
  };

  const syncProgram = async (programId: string) => {
    setSyncing(programId);
    
    try {
      console.log(`[syncProgram] Calling edge function for program ${programId}`);
      
      const { data, error } = await supabase.functions.invoke('sync-mileage-program', {
        body: { programId }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Erro ao sincronizar programa');
        return;
      }

      if (data?.success) {
        if (data.requiresManualUpdate) {
          toast.info('Sincronização automática não disponível. Atualize o saldo manualmente.');
        } else {
          toast.success('Programa sincronizado com sucesso');
        }
      } else if (data?.error) {
        toast.error(data.error);
      }

      await loadPrograms();
    } catch (error) {
      console.error('Error syncing program:', error);
      toast.error('Erro ao sincronizar programa');
    } finally {
      setSyncing(null);
    }
  };

  // Calculate totals
  const totalSyncedMiles = programs
    .filter(p => p.status === 'connected')
    .reduce((sum, p) => sum + (p.balance_miles || 0), 0);

  const totalEstimatedValue = programs
    .filter(p => p.status === 'connected')
    .reduce((sum, p) => sum + (p.balance_value || 0), 0);

  const connectedProgramsCount = programs.filter(p => p.status === 'connected').length;

  const getAvailableProgramsToConnect = () => {
    const connectedCodes = programs.map(p => p.program_code);
    return MILEAGE_PROGRAMS.filter(p => !connectedCodes.includes(p.code));
  };

  return {
    programs,
    loading,
    syncing,
    totalSyncedMiles,
    totalEstimatedValue,
    connectedProgramsCount,
    loadPrograms,
    connectProgram,
    disconnectProgram,
    updateProgramBalance,
    setError,
    syncProgram,
    getAvailableProgramsToConnect
  };
}
