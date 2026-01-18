import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, AlertTriangle, TrendingUp, Calendar, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface AIHistoryEntry {
  id: string;
  entry_type: string;
  message: string;
  user_question?: string | null;
  card_name?: string | null;
  amount?: number | null;
  currency?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface AIHistorySectionRef {
  refresh: () => void;
}

export const AIHistorySection = forwardRef<AIHistorySectionRef>((_, ref) => {
  const [historyEntries, setHistoryEntries] = useState<AIHistoryEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchHistory();
    }
  }));

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

  const deleteHistoryEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('ai_history')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Remove from local state
      setHistoryEntries(prev => prev.filter(entry => entry.id !== entryId));
      toast.success("Histórico excluído com sucesso");
    } catch (error) {
      console.error('Error deleting AI history entry:', error);
      toast.error("Erro ao excluir histórico");
    }
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getMessagePreview = (entry: AIHistoryEntry) => {
    // If user question exists, show it as preview
    if (entry.user_question) {
      const question = entry.user_question;
      return question.length > 100 ? question.substring(0, 100) + '...' : question;
    }
    // Fallback to first line of AI response
    const firstLine = entry.message.split('\n')[0];
    return firstLine.length > 120 ? firstLine.substring(0, 120) + '...' : firstLine;
  };

  const getContextInfo = (entry: AIHistoryEntry) => {
    if (entry.card_name && entry.amount) {
      return `${entry.card_name} - ${formatCurrency(entry.amount, entry.currency || 'BRL')}`;
    }
    if (entry.card_name) {
      return `Cartão: ${entry.card_name}`;
    }
    return 'Análise geral';
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
        <div className="space-y-2">
          {historyEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('aiRecommendations.noHistory')}</p>
              <p className="text-sm">{t('aiRecommendations.historyDesc')}</p>
            </div>
          ) : (
            historyEntries.map((entry) => {
              const isExpanded = expandedEntries.has(entry.id);
              return (
                <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => toggleExpanded(entry.id)}>
                  <div className="border rounded-lg hover:bg-accent/30 transition-colors">
                     <div className="flex items-start gap-2 p-4">
                       <CollapsibleTrigger className="flex-1 text-left">
                         <div className="space-y-2">
                           {/* Header line with analysis type, context and date */}
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                               {getEntryIcon(entry.entry_type)}
                               <Badge variant="outline" className="text-xs">
                                 {getEntryTypeLabel(entry.entry_type)}
                               </Badge>
                               <span className="text-sm text-muted-foreground">•</span>
                               <span className="text-sm text-muted-foreground">
                                 {getContextInfo(entry)}
                               </span>
                             </div>
                             <div className="flex items-center gap-1">
                               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                 <Calendar className="h-3 w-3" />
                                 {format(new Date(entry.created_at), 'dd/MM HH:mm', { locale: dateLocale })}
                               </div>
                               {isExpanded ? (
                                 <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
                               ) : (
                                 <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                               )}
                             </div>
                           </div>
                           
                           {/* Preview line - show user question if exists */}
                           <div className="text-sm text-foreground/80 text-left">
                             {entry.user_question && (
                               <span className="text-muted-foreground mr-1">Você:</span>
                             )}
                             {getMessagePreview(entry)}
                           </div>
                         </div>
                       </CollapsibleTrigger>
                       
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este histórico de IA? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteHistoryEntry(entry.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                     </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t bg-muted/20">
                        <div className="pt-3 space-y-3">
                          {/* Show user question if exists */}
                          {entry.user_question && (
                            <div className="bg-muted/50 rounded-lg p-3 border-l-2 border-primary">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">Sua pergunta:</div>
                              <div className="text-sm text-foreground">{entry.user_question}</div>
                            </div>
                          )}
                          
                          {/* AI Response */}
                          <div className="text-sm leading-relaxed text-foreground">
                            {entry.user_question && (
                              <div className="text-xs text-muted-foreground mb-2 font-medium">Resposta da PrIscA:</div>
                            )}
                            <div className="space-y-2">
                              {entry.message.split('\n').map((line, index) => {
                                // Skip empty lines
                                if (!line.trim()) return null;
                                
                                // Headers (lines with all caps or ending with :)
                                if (line.match(/^[A-Z\s]+:?$/) || line.endsWith(':')) {
                                  return (
                                    <div key={index} className="font-semibold text-primary mt-3 first:mt-0">
                                      {line}
                                    </div>
                                  );
                                }
                                
                                // Bullet points or numbered items
                                if (line.match(/^[\s]*[-•*]\s/) || line.match(/^\d+\.\s/)) {
                                  return (
                                    <div key={index} className="ml-2 flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>{line.replace(/^[\s]*[-•*]\s/, '').replace(/^\d+\.\s/, '')}</span>
                                    </div>
                                  );
                                }
                                
                                // Regular paragraphs
                                return (
                                  <div key={index} className="leading-relaxed">
                                    {line}
                                  </div>
                                );
                              }).filter(Boolean)}
                            </div>
                          </div>
                          
                          {(entry.card_name || entry.amount) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                              {entry.card_name && (
                                <Badge variant="secondary" className="text-xs">
                                  Cartão: {entry.card_name}
                                </Badge>
                              )}
                              {entry.amount && entry.currency && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(entry.amount, entry.currency)}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
});

AIHistorySection.displayName = 'AIHistorySection';