import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, Clock, X, Edit3, Eye } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImportedTransaction } from '../ConverterDashboard';

interface TransactionTableProps {
  transactions: ImportedTransaction[];
  selectedTransactions: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  selectedTransactions,
  onSelectionChange
}) => {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock some transactions for preview
  const mockTransactions: ImportedTransaction[] = [
    {
      id: '1',
      originalDescription: 'PAGAMENTO NETFLIX 11/08',
      originalDate: '2024-08-11',
      originalAmount: '-29,90',
      originalCurrency: 'BRL',
      normalizedDate: new Date('2024-08-11'),
      normalizedAmount: 29.90,
      normalizedCurrency: 'BRL',
      transactionType: 'expense',
      suggestedCategoryId: 'cat_entertainment',
      suggestedPaymentMethod: 'credit',
      confidenceScore: 0.95,
      isInstallment: false,
      installmentCurrent: null,
      installmentTotal: null,
      isFee: false,
      isTransfer: false,
      isDuplicate: false,
      duplicateTransactionId: null,
      validationStatus: 'pending',
      reviewNotes: null,
      finalCategoryId: null,
      finalAccountId: null,
      finalCardId: null,
      finalPaymentMethod: null,
      finalTags: []
    },
    {
      id: '2', 
      originalDescription: 'TRANSFERENCIA PIX JOAO SILVA',
      originalDate: '2024-08-10',
      originalAmount: '-150,00',
      originalCurrency: 'BRL',
      normalizedDate: new Date('2024-08-10'),
      normalizedAmount: 150.00,
      normalizedCurrency: 'BRL',
      transactionType: 'expense',
      suggestedCategoryId: 'cat_transfer',
      suggestedPaymentMethod: 'pix',
      confidenceScore: 0.87,
      isInstallment: false,
      installmentCurrent: null,
      installmentTotal: null,
      isFee: false,
      isTransfer: true,
      isDuplicate: false,
      duplicateTransactionId: null,
      validationStatus: 'needs_review',
      reviewNotes: null,
      finalCategoryId: null,
      finalAccountId: null,
      finalCardId: null,
      finalPaymentMethod: null,
      finalTags: []
    },
    {
      id: '3',
      originalDescription: 'SUPERMERCADO EXTRA 12345',
      originalDate: '2024-08-09',
      originalAmount: '-85,47',
      originalCurrency: 'BRL',
      normalizedDate: new Date('2024-08-09'),
      normalizedAmount: 85.47,
      normalizedCurrency: 'BRL',
      transactionType: 'expense',
      suggestedCategoryId: 'cat_food',
      suggestedPaymentMethod: 'debit',
      confidenceScore: 0.92,
      isInstallment: false,
      installmentCurrent: null,
      installmentTotal: null,
      isFee: false,
      isTransfer: false,
      isDuplicate: false,
      duplicateTransactionId: null,
      validationStatus: 'approved',
      reviewNotes: null,
      finalCategoryId: 'cat_food',
      finalAccountId: null,
      finalCardId: null,
      finalPaymentMethod: 'debit',
      finalTags: ['supermercado', 'alimentação']
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;

  const filteredTransactions = displayTransactions.filter(transaction => {
    const matchesStatus = filterStatus === 'all' || transaction.validationStatus === filterStatus;
    const matchesSearch = transaction.originalDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredTransactions.map(t => t.id));
    }
  };

  const handleSelectTransaction = (id: string) => {
    if (selectedTransactions.includes(id)) {
      onSelectionChange(selectedTransactions.filter(tid => tid !== id));
    } else {
      onSelectionChange([...selectedTransactions, id]);
    }
  };

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === 'approved') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === 'rejected') return <X className="h-4 w-4 text-destructive" />;
    if (status === 'needs_review' || confidence < 0.7) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, confidence: number) => {
    if (status === 'approved') return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejeitado</Badge>;
    if (status === 'needs_review' || confidence < 0.7) return <Badge className="bg-warning text-warning-foreground">Revisar</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('converter.preview.title')}
          </CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('converter.preview.all')}</SelectItem>
                <SelectItem value="pending">{t('converter.preview.pending')}</SelectItem>
                <SelectItem value="approved">{t('converter.preview.approved')}</SelectItem>
                <SelectItem value="needs_review">{t('converter.preview.suspicious')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selection Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                {t('converter.bulk.selectAll')} ({selectedTransactions.length}/{filteredTransactions.length})
              </label>
            </div>
            
            {selectedTransactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                {t('converter.bulk.deselectAll')}
              </Button>
            )}
          </div>

          {/* Transactions Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{t('converter.columns.date')}</TableHead>
                  <TableHead className="min-w-[200px]">{t('converter.columns.description')}</TableHead>
                  <TableHead className="text-right">{t('converter.columns.amount')}</TableHead>
                  <TableHead>{t('converter.columns.type')}</TableHead>
                  <TableHead>{t('converter.columns.category')}</TableHead>
                  <TableHead>{t('converter.columns.payment')}</TableHead>
                  <TableHead className="text-center">{t('converter.columns.confidence')}</TableHead>
                  <TableHead className="text-center">{t('converter.columns.status')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={() => handleSelectTransaction(transaction.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {transaction.normalizedDate?.toLocaleDateString('pt-BR') || transaction.originalDate}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.originalDescription}
                      {transaction.isInstallment && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {transaction.installmentCurrent}/{transaction.installmentTotal}
                        </Badge>
                      )}
                      {transaction.isTransfer && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Transfer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.transactionType === 'expense' ? 'text-expense' : 'text-income'}>
                        {formatAmount(transaction.normalizedAmount, transaction.normalizedCurrency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.transactionType === 'expense' ? 'Despesa' : 
                         transaction.transactionType === 'income' ? 'Receita' : 'Transfer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {transaction.suggestedCategoryId ? 'Categoria Sugerida' : 'Sem categoria'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.suggestedPaymentMethod?.toUpperCase() || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{Math.round(transaction.confidenceScore * 100)}%</span>
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.confidenceScore >= 0.8 ? 'bg-success' :
                          transaction.confidenceScore >= 0.6 ? 'bg-warning' : 'bg-destructive'
                        }`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(transaction.validationStatus, transaction.confidenceScore)}
                        {getStatusBadge(transaction.validationStatus, transaction.confidenceScore)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              <p className="text-sm text-muted-foreground">{t('converter.summary.total')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-income">
                {filteredTransactions.filter(t => t.transactionType === 'income').length}
              </p>
              <p className="text-sm text-muted-foreground">{t('converter.summary.income')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-expense">
                {filteredTransactions.filter(t => t.transactionType === 'expense').length}
              </p>
              <p className="text-sm text-muted-foreground">{t('converter.summary.expenses')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round(filteredTransactions.reduce((acc, t) => acc + t.confidenceScore, 0) / filteredTransactions.length * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">{t('converter.summary.confidence')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};