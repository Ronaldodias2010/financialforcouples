import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

interface AIHistoryEntry {
  id: string;
  entry_type: string;
  message: string;
  card_name?: string | null;
  amount?: number | null;
  currency?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const AIHistorySection = () => {
  const [historyEntries, setHistoryEntries] = useState<AIHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistoryEntries(data || []);
    } catch (error) {
      console.error('Error fetching AI history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'limit_exceeded':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'ai_analysis':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'recommendation':
        return <History className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getEntryTypeLabel = (entryType: string) => {
    switch (entryType) {
      case 'limit_exceeded':
        return t('aiRecommendations.limitExceeded');
      case 'ai_analysis':
        return t('aiRecommendations.aiAnalysis');
      case 'recommendation':
        return t('aiRecommendations.recommendation');
      default:
        return entryType;
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('aiRecommendations.history')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
            <p>Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('aiRecommendations.history')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {historyEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('aiRecommendations.noHistory')}</p>
              <p className="text-sm">{t('aiRecommendations.historyDesc')}</p>
            </div>
          ) : (
            historyEntries.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getEntryIcon(entry.entry_type)}
                    <Badge variant="outline" className="text-xs">
                      {getEntryTypeLabel(entry.entry_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                  </div>
                </div>
                
                <p className="text-sm leading-relaxed">{entry.message}</p>
                
                {entry.card_name && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      Cartão: {entry.card_name}
                    </Badge>
                    {entry.amount && entry.currency && (
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(entry.amount, entry.currency)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};