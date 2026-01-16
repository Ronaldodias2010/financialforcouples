import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  AlertTriangle, 
  Upload,
  Loader2,
  XCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { ImportedTransaction } from './ConverterDashboard';
import { useInvalidateFinancialData } from '@/hooks/useInvalidateFinancialData';

interface ImportConfirmationProps {
  transactions: ImportedTransaction[];
  sourceType: 'account' | 'card';
  sourceId: string;
  sourceName: string;
  currency: string;
  onComplete: () => void;
  onBack: () => void;
}

interface ImportRule {
  skipDuplicates: boolean;
  defaultCategoryId: string | null;
  defaultPaymentMethod: string;
  markAsReconciled: boolean;
}

export const ImportConfirmation: React.FC<ImportConfirmationProps> = ({
  transactions,
  sourceType,
  sourceId,
  sourceName,
  currency,
  onComplete,
  onBack
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { invalidateAll } = useInvalidateFinancialData();
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{ success: number; skipped: number; failed: number }>({
    success: 0, skipped: 0, failed: 0
  });
  
  const [rules, setRules] = useState<ImportRule>({
    skipDuplicates: true,
    defaultCategoryId: null,
    defaultPaymentMethod: sourceType === 'card' ? 'credit_card' : 'transfer',
    markAsReconciled: true
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, category_type, color')
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  // Calculate summary
  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.normalizedAmount, 0);
    
    const totalExpense = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.normalizedAmount, 0);

    return {
      count: transactions.length,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense
    };
  }, [transactions]);

  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus('importing');
    setImportProgress(0);

    const results = { success: 0, skipped: 0, failed: 0 };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        setImportProgress(Math.round(((i + 1) / transactions.length) * 100));

        try {
          // Check for duplicates if enabled
          if (rules.skipDuplicates) {
            const { data: existing } = await supabase
              .from('transactions')
              .select('id')
              .eq('user_id', user.id)
              .eq('transaction_date', tx.normalizedDate?.toISOString().split('T')[0])
              .eq('amount', tx.transactionType === 'expense' ? -tx.normalizedAmount : tx.normalizedAmount)
              .ilike('description', tx.originalDescription.substring(0, 50) + '%')
              .is('deleted_at', null)
              .limit(1);

            if (existing && existing.length > 0) {
              results.skipped++;
              continue;
            }
          }

          // Prepare transaction data
          const transactionData: any = {
            user_id: user.id,
            description: tx.originalDescription,
            amount: tx.transactionType === 'expense' ? -tx.normalizedAmount : tx.normalizedAmount,
            transaction_date: tx.normalizedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            transaction_type: tx.transactionType || 'expense',
            payment_method: tx.finalPaymentMethod || rules.defaultPaymentMethod,
            currency: currency,
            is_reconciled: rules.markAsReconciled
          };

          // Add source reference
          if (sourceType === 'account') {
            transactionData.account_id = sourceId;
          } else {
            transactionData.card_id = sourceId;
          }

          // Add category if specified
          if (tx.finalCategoryId || rules.defaultCategoryId) {
            transactionData.category_id = tx.finalCategoryId || rules.defaultCategoryId;
          }

          // Insert transaction
          const { error } = await supabase
            .from('transactions')
            .insert(transactionData);

          if (error) {
            console.error('Insert error:', error);
            results.failed++;
          } else {
            results.success++;
          }

        } catch (txError) {
          console.error('Transaction import error:', txError);
          results.failed++;
        }
      }

      setImportResults(results);
      setImportStatus(results.failed === 0 ? 'success' : 'error');

      // Invalidate caches to refresh data
      await invalidateAll(false);

      toast({
        title: 'Importação Concluída',
        description: `${results.success} transações importadas, ${results.skipped} ignoradas, ${results.failed} falharam`,
        variant: results.failed > 0 ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast({
        title: 'Erro na Importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (importStatus === 'success' || importStatus === 'error') {
    return (
      <Card>
        <CardHeader className="text-center">
          {importStatus === 'success' ? (
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
          ) : (
            <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
          )}
          <CardTitle>
            {importStatus === 'success' ? 'Importação Concluída!' : 'Importação Finalizada com Erros'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
              <p className="text-sm text-muted-foreground">Importadas</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
              <p className="text-sm text-muted-foreground">Ignoradas</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
              <p className="text-sm text-muted-foreground">Falharam</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onComplete} size="lg">
            <Check className="h-4 w-4 mr-2" />
            Concluir
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Confirmar Importação
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Revise as transações e regras antes de importar para {sourceName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{summary.count} transações</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-lg font-semibold ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netAmount)}
              </p>
            </div>
          </div>

          {/* Import Rules */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Regras de Importação
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="skipDuplicates"
                  checked={rules.skipDuplicates}
                  onCheckedChange={(checked) => setRules(prev => ({ ...prev, skipDuplicates: !!checked }))}
                />
                <Label htmlFor="skipDuplicates" className="text-sm">
                  Ignorar transações duplicadas
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="markAsReconciled"
                  checked={rules.markAsReconciled}
                  onCheckedChange={(checked) => setRules(prev => ({ ...prev, markAsReconciled: !!checked }))}
                />
                <Label htmlFor="markAsReconciled" className="text-sm">
                  Marcar como reconciliadas
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Categoria Padrão</Label>
                <Select 
                  value={rules.defaultCategoryId || 'none'}
                  onValueChange={(v) => setRules(prev => ({ ...prev, defaultCategoryId: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Método de Pagamento</Label>
                <Select 
                  value={rules.defaultPaymentMethod}
                  onValueChange={(v) => setRules(prev => ({ ...prev, defaultPaymentMethod: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Esta ação irá adicionar {summary.count} transações ao seu histórico. 
              Certifique-se de que as informações estão corretas antes de prosseguir.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Transaction Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações a Importar</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {transactions.slice(0, 50).map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.originalDescription}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.normalizedDate)}</p>
                  </div>
                  <Badge variant={tx.transactionType === 'income' ? 'default' : 'secondary'}>
                    {tx.transactionType === 'income' ? '+' : '-'}{formatCurrency(tx.normalizedAmount)}
                  </Badge>
                </div>
              ))}
              {transactions.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {transactions.length - 50} transações
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Progress (during import) */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Importando transações...</span>
              </div>
              <Progress value={importProgress} />
              <p className="text-center text-sm text-muted-foreground">
                {importProgress}% concluído
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          Voltar
        </Button>
        <Button onClick={handleImport} disabled={isImporting} size="lg">
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Confirmar Importação
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
