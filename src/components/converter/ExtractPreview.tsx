import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileSpreadsheet, 
  Download, 
  Edit2, 
  Check, 
  X, 
  ArrowUpDown,
  Filter,
  Search
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImportedTransaction } from './ConverterDashboard';

interface ExtractPreviewProps {
  transactions: ImportedTransaction[];
  metadata: {
    bankName?: string;
    accountNumber?: string;
    currency: string;
    statementPeriod?: {
      start: string;
      end: string;
    };
  };
  onTransactionsUpdate: (transactions: ImportedTransaction[]) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const ExtractPreview: React.FC<ExtractPreviewProps> = ({
  transactions,
  metadata,
  onTransactionsUpdate,
  onExportExcel,
  onExportCSV
}) => {
  const { t } = useLanguage();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(transactions.map(t => t.id)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ImportedTransaction>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'normalizedDate', 
    direction: 'desc' 
  });

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredTransactions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleStartEdit = (transaction: ImportedTransaction) => {
    setEditingId(transaction.id);
    setEditValues({
      originalDescription: transaction.originalDescription,
      normalizedAmount: transaction.normalizedAmount,
      transactionType: transaction.transactionType
    });
  };

  const handleSaveEdit = (id: string) => {
    const updatedTransactions = transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          originalDescription: editValues.originalDescription || t.originalDescription,
          normalizedAmount: editValues.normalizedAmount ?? t.normalizedAmount,
          transactionType: editValues.transactionType || t.transactionType
        };
      }
      return t;
    });
    onTransactionsUpdate(updatedTransactions);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.originalDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.transactionType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof ImportedTransaction];
      const bValue = b[sortConfig.key as keyof ImportedTransaction];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate summary
  const summary = {
    totalIncome: filteredTransactions.filter(t => t.transactionType === 'income').reduce((sum, t) => sum + t.normalizedAmount, 0),
    totalExpense: filteredTransactions.filter(t => t.transactionType === 'expense').reduce((sum, t) => sum + t.normalizedAmount, 0),
    selectedCount: selectedRows.size,
    totalCount: filteredTransactions.length
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview do Extrato
            </CardTitle>
            {metadata.bankName && (
              <p className="text-sm text-muted-foreground mt-1">
                {metadata.bankName} {metadata.accountNumber && `• Conta: ${metadata.accountNumber}`}
                {metadata.statementPeriod && (
                  <span> • Período: {metadata.statementPeriod.start} a {metadata.statementPeriod.end}</span>
                )}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Entradas</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(summary.totalIncome, metadata.currency)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Saídas</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(summary.totalExpense, metadata.currency)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-semibold ${summary.totalIncome - summary.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.totalIncome - summary.totalExpense, metadata.currency)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Transações</p>
            <p className="text-lg font-semibold">{summary.selectedCount}/{summary.totalCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(v: 'all' | 'income' | 'expense') => setFilterType(v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
              <SelectItem value="expense">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('normalizedDate')}>
                  <div className="flex items-center gap-1">
                    Data
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('normalizedAmount')}>
                  <div className="flex items-center justify-end gap-1">
                    Valor
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow 
                  key={transaction.id}
                  className={!selectedRows.has(transaction.id) ? 'opacity-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(transaction.id)}
                      onCheckedChange={() => handleSelectRow(transaction.id)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(transaction.normalizedDate)}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Input
                        value={editValues.originalDescription || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, originalDescription: e.target.value }))}
                        className="h-8"
                      />
                    ) : (
                      <span className="line-clamp-1">{transaction.originalDescription}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === transaction.id ? (
                      <Input
                        type="number"
                        value={editValues.normalizedAmount || 0}
                        onChange={(e) => setEditValues(prev => ({ ...prev, normalizedAmount: parseFloat(e.target.value) || 0 }))}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      <span className={transaction.transactionType === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transactionType === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.normalizedAmount, metadata.currency)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <Select 
                        value={editValues.transactionType || 'expense'}
                        onValueChange={(v: 'income' | 'expense') => setEditValues(prev => ({ ...prev, transactionType: v }))}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Entrada</SelectItem>
                          <SelectItem value="expense">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={transaction.transactionType === 'income' ? 'default' : 'secondary'}>
                        {transaction.transactionType === 'income' ? 'Entrada' : 'Saída'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === transaction.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(transaction.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleStartEdit(transaction)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma transação encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
