import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CurrencyRefreshButton: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('[CurrencyRefresh] Calling update-exchange-rates edge function...');
      
      const { data, error } = await supabase.functions.invoke('update-exchange-rates', {
        body: { manual: true }
      });
      
      if (error) {
        console.error('[CurrencyRefresh] Error:', error);
        toast.error('Erro ao atualizar cotações: ' + error.message);
        return;
      }
      
      console.log('[CurrencyRefresh] Success:', data);
      toast.success('Cotações atualizadas com sucesso!');
      
      // Reload page to show updated rates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      console.error('[CurrencyRefresh] Unexpected error:', err);
      toast.error('Erro inesperado ao atualizar cotações');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Atualizando...' : 'Atualizar Cotações'}
    </Button>
  );
};