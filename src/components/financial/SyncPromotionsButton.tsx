import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plane } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncPromotionsButtonProps {
  onSyncComplete?: () => void;
}

export const SyncPromotionsButton = ({ onSyncComplete }: SyncPromotionsButtonProps) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-airline-promotions', {
        body: {}
      });

      if (error) {
        throw error;
      }

      const result = data;
      const totalProcessed = result?.processed || 0;
      const moblixStats = result?.moblix_stats;

      let message = `Sincronização concluída! ${totalProcessed} promoções processadas.`;
      
      if (moblixStats && moblixStats.total_fetched > 0) {
        message += ` Moblix: ${moblixStats.inserted} novas + ${moblixStats.updated} atualizadas.`;
      }

      toast({
        title: "Sucesso",
        description: message,
      });

      onSyncComplete?.();
    } catch (error) {
      console.error('Error syncing promotions:', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar promoções",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="gap-2"
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Plane className="h-4 w-4" />
      )}
      {syncing ? 'Sincronizando...' : 'Sincronizar Promoções'}
    </Button>
  );
};