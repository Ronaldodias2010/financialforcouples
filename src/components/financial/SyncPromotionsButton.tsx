import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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

      toast({
        title: "Sucesso",
        description: "Promoções sincronizadas com sucesso!",
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
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Promoções'}
    </Button>
  );
};