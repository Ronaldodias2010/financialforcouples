import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeftRight, 
  Check, 
  AlertTriangle, 
  Plus,
  Minus,
  FileQuestion,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImportedTransaction } from './ConverterDashboard';

interface ExistingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_name?: string;
  payment_method?: string;
  source: 'transactions' | 'future_expenses';
}

interface MatchedPair {
  imported: ImportedTransaction;
  existing: ExistingTransaction;
  matchScore: number;
  matchReasons: string[];
}

interface DifferencesViewProps {
  importedTransactions: ImportedTransaction[];
  existingTransactions: ExistingTransaction[];
  sourceName: string;
  currency: string;
  onProceedToImport: (transactionsToImport: ImportedTransaction[]) => void;
  onBack: () => void;
}

export const DifferencesView: React.FC<DifferencesViewProps> = ({
  importedTransactions,
  existingTransactions,
  sourceName,
  currency,
  onProceedToImport,
  onBack
}) => {
  const { t } = useLanguage();
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
  };

  // Perform matching analysis
  const analysis = useMemo(() => {
    const matches: MatchedPair[] = [];
    const onlyInExtract: ImportedTransaction[] = [];
    const onlyInSystem: ExistingTransaction[] = [];
    const usedExistingIds = new Set<string>();

    // For each imported transaction, try to find a match
    importedTransactions.forEach(imported => {
      let bestMatch: { existing: ExistingTransaction; score: number; reasons: string[] } | null = null;

      existingTransactions.forEach(existing => {
        if (usedExistingIds.has(existing.id)) return;

        const reasons: string[] = [];
        let score = 0;

        // Compare amount (exact match = 40 points, within 1% = 20 points)
        const amountDiff = Math.abs(imported.normalizedAmount - existing.amount);
        const amountPercentDiff = amountDiff / Math.max(imported.normalizedAmount, existing.amount);
        
        if (amountDiff < 0.01) {
          score += 40;
          reasons.push('Valor exato');
        } else if (amountPercentDiff < 0.01) {
          score += 20;
          reasons.push('Valor aproximado');
        }

        // Compare date (same day = 30 points, within 2 days = 15 points)
        const importedDate = imported.normalizedDate ? new Date(imported.normalizedDate) : null;
        const existingDate = new Date(existing.date);
        
        if (importedDate) {
          const daysDiff = Math.abs((importedDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 1) {
            score += 30;
            reasons.push('Data igual');
          } else if (daysDiff <= 2) {
            score += 15;
            reasons.push('Data próxima');
          }
        }

        // Compare description (similar = 30 points)
        const importedDesc = imported.originalDescription.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existingDesc = existing.description.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (importedDesc === existingDesc) {
          score += 30;
          reasons.push('Descrição igual');
        } else if (importedDesc.includes(existingDesc) || existingDesc.includes(importedDesc)) {
          score += 15;
          reasons.push('Descrição similar');
        }

        // Compare type
        if (imported.transactionType === existing.type) {
          score += 10;
        }

        if (score >= 50 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { existing, score, reasons };
        }
      });

      if (bestMatch) {
        matches.push({
          imported,
          existing: bestMatch.existing,
          matchScore: bestMatch.score,
          matchReasons: bestMatch.reasons
        });
        usedExistingIds.add(bestMatch.existing.id);
      } else {
        onlyInExtract.push(imported);
      }
    });

    // Find existing transactions not matched
    existingTransactions.forEach(existing => {
      if (!usedExistingIds.has(existing.id)) {
        onlyInSystem.push(existing);
      }
    });

    return { matches, onlyInExtract, onlyInSystem };
  }, [importedTransactions, existingTransactions]);

  // Auto-select all "only in extract" for import
  React.useEffect(() => {
    setSelectedForImport(new Set(analysis.onlyInExtract.map(t => t.id)));
  }, [analysis.onlyInExtract]);

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedForImport);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedForImport(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedForImport(new Set(analysis.onlyInExtract.map(t => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedForImport(new Set());
  };

  const handleProceed = () => {
    const toImport = analysis.onlyInExtract.filter(t => selectedForImport.has(t.id));
    onProceedToImport(toImport);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Alta</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Média</Badge>;
    return <Badge className="bg-orange-500">Baixa</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Análise de Diferenças: {sourceName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{analysis.matches.length}</p>
              <p className="text-sm text-muted-foreground">Correspondências</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{analysis.onlyInExtract.length}</p>
              <p className="text-sm text-muted-foreground">Apenas no Extrato</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <Minus className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{analysis.onlyInSystem.length}</p>
              <p className="text-sm text-muted-foreground">Apenas no Sistema</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
              <FileQuestion className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{selectedForImport.size}</p>
              <p className="text-sm text-muted-foreground">Selecionados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="gap-2">
            <Plus className="h-4 w-4" />
            Novas ({analysis.onlyInExtract.length})
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <Check className="h-4 w-4" />
            Matches ({analysis.matches.length})
          </TabsTrigger>
          <TabsTrigger value="missing" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Ausentes ({analysis.onlyInSystem.length})
          </TabsTrigger>
        </TabsList>

        {/* New Transactions (Only in Extract) */}
        <TabsContent value="new">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transações Novas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas transações existem no extrato mas não estão no sistema
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Selecionar Todas
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Limpar Seleção
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {analysis.onlyInExtract.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer
                        ${selectedForImport.has(transaction.id) 
                          ? 'bg-primary/5 border-primary' 
                          : 'hover:bg-muted/50'
                        }`}
                      onClick={() => handleToggleSelection(transaction.id)}
                    >
                      <Checkbox 
                        checked={selectedForImport.has(transaction.id)}
                        onCheckedChange={() => handleToggleSelection(transaction.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.originalDescription}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.normalizedDate)}
                        </p>
                      </div>
                      <span className={`font-semibold whitespace-nowrap
                        ${transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'}
                      `}>
                        {transaction.transactionType === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.normalizedAmount)}
                      </span>
                    </div>
                  ))}
                  {analysis.onlyInExtract.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Todas as transações do extrato já existem no sistema! 🎉
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matched Transactions */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transações Correspondentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Estas transações existem tanto no extrato quanto no sistema
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {analysis.matches.map(({ imported, existing, matchScore, matchReasons }) => (
                    <div key={imported.id} className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Correspondência encontrada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreBadge(matchScore)}
                          <span className="text-xs text-muted-foreground">
                            {matchReasons.join(' • ')}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-background/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Extrato</p>
                          <p className="font-medium truncate">{imported.originalDescription}</p>
                          <p>{formatDate(imported.normalizedDate)} • {formatCurrency(imported.normalizedAmount)}</p>
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                          <p className="font-medium truncate">{existing.description}</p>
                          <p>{formatDate(existing.date)} • {formatCurrency(existing.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysis.matches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma correspondência encontrada
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missing from Extract */}
        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transações Ausentes no Extrato</CardTitle>
              <p className="text-sm text-muted-foreground">
                Estas transações existem no sistema mas não aparecem no extrato
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {analysis.onlyInSystem.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-orange-50/50 dark:bg-orange-900/10"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                          {transaction.category_name && ` • ${transaction.category_name}`}
                        </p>
                      </div>
                      <span className={`font-semibold whitespace-nowrap
                        ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}
                      `}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                  {analysis.onlyInSystem.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Todas as transações do sistema aparecem no extrato! 🎉
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleProceed}
          disabled={selectedForImport.size === 0}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          Importar {selectedForImport.size} Transações
        </Button>
      </div>
    </div>
  );
};
