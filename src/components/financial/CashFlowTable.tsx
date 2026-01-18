import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { CashFlowEntry } from '@/hooks/useCashFlowHistory';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface CashFlowTableProps {
  entries: CashFlowEntry[];
  isLoading: boolean;
  onFilterChange?: (type: string | null) => void;
}

type SortField = 'movement_date' | 'amount' | 'balance_after';
type SortOrder = 'asc' | 'desc';

export function CashFlowTable({ entries, isLoading, onFilterChange }: CashFlowTableProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('movement_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getDateLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const dateLocale = getDateLocale();

  const getMovementTypeLabel = (type: string): string => {
    switch (type) {
      case 'income': return t('cashFlow.table.income');
      case 'expense': return t('cashFlow.table.expense');
      case 'initial_balance': return t('cashFlow.table.initialBalance');
      case 'adjustment': return t('cashFlow.table.adjustment');
      case 'transfer_in': return t('cashFlow.table.transferIn');
      case 'transfer_out': return t('cashFlow.table.transferOut');
      default: return type;
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'cash': return t('transactionForm.cash');
      case 'pix': return 'PIX';
      case 'credit_card': return t('transactionForm.creditCard');
      case 'debit_card': return t('transactionForm.debitCard');
      case 'transfer': return t('transactionForm.transfer');
      case 'deposit': return t('transactionForm.deposit');
      case 'account_transfer': return t('transactionForm.accountTransfer');
      case 'account_investment': return t('transactionForm.accountInvestmentTransfer');
      case 'payment_transfer': return t('transactionForm.paymentTransfer');
      case 'boleto': return t('cashFlow.table.boleto');
      case 'check': return t('cashFlow.table.check');
      case 'other': return t('common.other');
      default: return method;
    }
  };

  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => 
        entry.description.toLowerCase().includes(term) ||
        entry.category_name?.toLowerCase().includes(term) ||
        entry.account_name?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(entry => entry.movement_type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'movement_date':
          comparison = new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'balance_after':
          comparison = a.balance_after - b.balance_after;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, searchTerm, typeFilter, sortField, sortOrder]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="h-4 w-4 ml-1" /> : 
      <SortDesc className="h-4 w-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('cashFlow.table.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t('cashFlow.table.historyTitle')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('cashFlow.table.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="income">{t('cashFlow.table.incomes')}</SelectItem>
                <SelectItem value="expense">{t('cashFlow.table.expenses')}</SelectItem>
                <SelectItem value="transfer_in">{t('cashFlow.table.transferInShort')}</SelectItem>
                <SelectItem value="transfer_out">{t('cashFlow.table.transferOutShort')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('movement_date')}
                >
                  <div className="flex items-center">
                    {t('cashFlow.table.date')}
                    <SortIcon field="movement_date" />
                  </div>
                </TableHead>
                <TableHead>{t('cashFlow.table.description')}</TableHead>
                <TableHead>{t('cashFlow.table.type')}</TableHead>
                <TableHead>{t('cashFlow.table.category')}</TableHead>
                <TableHead>{t('cashFlow.table.paymentMethod')}</TableHead>
                <TableHead>{t('cashFlow.table.account')}</TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    {t('cashFlow.table.value')}
                    <SortIcon field="amount" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('balance_after')}
                >
                  <div className="flex items-center justify-end">
                    {t('cashFlow.table.balance')}
                    <SortIcon field="balance_after" />
                  </div>
                </TableHead>
                <TableHead className="w-[50px]">{t('cashFlow.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">{t('cashFlow.table.noMovements')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(entry.movement_date), 'dd/MM/yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.movement_type === 'income' || entry.movement_type === 'transfer_in' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs">
                          {getMovementTypeLabel(entry.movement_type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.category_name || t('cashFlow.table.noCategory')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.payment_method ? 
                        getPaymentMethodLabel(entry.payment_method) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell className="text-xs">
                      {entry.account_name || '-'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      entry.movement_type === 'income' || entry.movement_type === 'transfer_in' 
                        ? "text-green-600" 
                        : "text-red-600"
                    )}>
                      {entry.movement_type === 'income' || entry.movement_type === 'transfer_in' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      entry.balance_after >= 0 ? "text-foreground" : "text-red-600"
                    )}>
                      {formatCurrency(entry.balance_after)}
                    </TableCell>
                    <TableCell>
                      {entry.is_reconciled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {/* Summary Footer */}
        {filteredAndSortedEntries.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <span>{filteredAndSortedEntries.length} {t('cashFlow.movements')}</span>
            <div className="flex gap-4">
              <span className="text-green-600">
                + {formatCurrency(
                  filteredAndSortedEntries
                    .filter(e => e.movement_type === 'income' || e.movement_type === 'transfer_in')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </span>
              <span className="text-red-600">
                - {formatCurrency(
                  filteredAndSortedEntries
                    .filter(e => e.movement_type === 'expense' || e.movement_type === 'transfer_out')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
