import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Eye,
  Users,
  GitMerge,
  Target,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/use-toast';
import { ImportedTransaction } from './ConverterDashboard';
import { transactionMatcher, MatchResult, MatchCandidate } from '@/utils/TransactionMatcher';

interface ReconciliationPanelProps {
  importedTransactions: ImportedTransaction[];
  existingTransactions?: any[]; // From database
  onReconciliationComplete: (selectedTransactions: ImportedTransaction[]) => void;
}

export const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({
  importedTransactions,
  existingTransactions = [],
  onReconciliationComplete
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedImported, setSelectedImported] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(true);
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);

  useEffect(() => {
    processReconciliation();
  }, [importedTransactions, existingTransactions]);

  const processReconciliation = async () => {
    setIsProcessing(true);
    
    try {
      // Convert transactions to match candidates
      const importedCandidates: MatchCandidate[] = importedTransactions.map(tx => ({
        id: tx.id,
        date: tx.normalizedDate || new Date(tx.originalDate),
        amount: Math.abs(tx.normalizedAmount),
        description: tx.originalDescription,
        source: 'imported'
      }));

      const existingCandidates: MatchCandidate[] = existingTransactions.map(tx => ({
        id: tx.id,
        date: new Date(tx.transaction_date || tx.date),
        amount: Math.abs(tx.amount),
        description: tx.description,
        source: 'database'
      }));

      // Find matches
      const results = await transactionMatcher.findMatches(importedCandidates, existingCandidates);
      setMatchResults(results);

      // Auto-select transactions that are not duplicates
      const autoSelected = new Set<string>();
      results.forEach(result => {
        if (!result.isLikelyDuplicate) {
          autoSelected.add(result.importedTransaction.id);
        }
      });
      
      setSelectedImported(autoSelected);

      // Show summary
      const report = transactionMatcher.generateReconciliationReport(results);
      toast({
        title: 'Reconciliação Concluída',
        description: `${report.newTransactions} novas, ${report.likelyDuplicates} duplicatas encontradas`,
      });

    } catch (error) {
      console.error('Reconciliation error:', error);
      toast({
        title: 'Erro na Reconciliação',
        description: 'Falha ao processar correspondências',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedImported);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedImported(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set<string>();
    matchResults.forEach(result => {
      newSelected.add(result.importedTransaction.id);
    });
    setSelectedImported(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedImported(new Set());
  };

  const handleConfirmSelection = () => {
    const selectedTransactions = importedTransactions.filter(tx => 
      selectedImported.has(tx.id)
    );
    
    onReconciliationComplete(selectedTransactions);
    
    toast({
      title: 'Seleção Confirmada',
      description: `${selectedTransactions.length} transações selecionadas para importação`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getMatchBadgeVariant = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getMatchIcon = (result: MatchResult) => {
    if (result.isLikelyDuplicate) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    if (result.existingTransaction) {
      return <Target className="h-4 w-4 text-blue-600" />;
    }
    return <Zap className="h-4 w-4 text-green-600" />;
  };

  const filteredResults = showOnlyConflicts 
    ? matchResults.filter(result => result.isLikelyDuplicate || result.confidence === 'medium')
    : matchResults;

  const stats = {
    total: matchResults.length,
    newTransactions: matchResults.filter(r => !r.existingTransaction).length,
    duplicates: matchResults.filter(r => r.isLikelyDuplicate).length,
    needsReview: matchResults.filter(r => r.existingTransaction && r.confidence === 'medium').length,
    selected: selectedImported.size
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Processando reconciliação...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" />
              <CardTitle>Reconciliação de Transações</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">{stats.total} total</Badge>
              <Badge variant="default">{stats.newTransactions} novas</Badge>
              <Badge variant="destructive">{stats.duplicates} duplicatas</Badge>
              {stats.needsReview > 0 && (
                <Badge variant="secondary">{stats.needsReview} revisar</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-conflicts"
                checked={showOnlyConflicts}
                onCheckedChange={(checked) => setShowOnlyConflicts(checked === true)}
              />
              <label htmlFor="show-conflicts" className="text-sm font-medium">
                Mostrar apenas conflitos
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Desmarcar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todos
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedImported.size === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar ({stats.selected})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Results */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 p-4">
              {filteredResults.map((result, index) => {
                const isSelected = selectedImported.has(result.importedTransaction.id);
                const imported = result.importedTransaction;
                const existing = result.existingTransaction;
                
                return (
                  <div 
                    key={result.importedTransaction.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                    } ${result.isLikelyDuplicate ? 'border-l-4 border-l-yellow-400' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleTransaction(imported.id)}
                        />
                      </div>
                      
                      {/* Match Icon */}
                      <div className="pt-1">
                        {getMatchIcon(result)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        {/* Imported Transaction */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Transação Importada</h4>
                            {result.matchScore > 0 && (
                              <Badge 
                                variant={getMatchBadgeVariant(result.confidence)}
                                className="text-xs"
                              >
                                {Math.round(result.matchScore * 100)}% match
                              </Badge>
                            )}
                          </div>
                          
                          <div className="bg-muted/30 rounded p-3 space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{imported.description}</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(imported.amount)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {imported.date.toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        {/* Existing Transaction (if match found) */}
                        {existing && (
                          <>
                            <div className="flex items-center justify-center">
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">Transação Existente</h4>
                                <Badge variant="outline" className="text-xs">
                                  Já no sistema
                                </Badge>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3 space-y-1">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium">{existing.description}</span>
                                  <span className="font-mono text-sm">
                                    {formatCurrency(existing.amount)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {existing.date.toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Match Reasons */}
                        {result.matchReasons.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Correspondência:</strong> {result.matchReasons.join(', ')}
                          </div>
                        )}
                        
                        {/* No Match */}
                        {!existing && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Nova transação - será adicionada ao sistema
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {showOnlyConflicts 
                    ? 'Nenhum conflito encontrado!'
                    : 'Nenhuma transação para reconciliar'
                  }
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
