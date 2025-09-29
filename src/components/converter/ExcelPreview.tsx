import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Edit3, 
  Save, 
  X, 
  ArrowUpDown, 
  Filter,
  FileSpreadsheet,
  Plus,
  Minus,
  Calculator
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ImportedTransaction } from './ConverterDashboard';

interface ExcelPreviewProps {
  transactions: ImportedTransaction[];
  detectedCurrency: string;
  fileName: string;
  onTransactionsUpdate?: (transactions: ImportedTransaction[]) => void;
}

interface ExcelRow {
  id: string;
  date: string;
  description: string;
  income: number;
  expense: number;
  balance: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  paymentMethod: string;
  confidence: number;
  isEditing: boolean;
}

type SortField = 'date' | 'description' | 'income' | 'expense' | 'balance';
type SortDirection = 'asc' | 'desc';

export const ExcelPreview: React.FC<ExcelPreviewProps> = ({
  transactions,
  detectedCurrency,
  fileName,
  onTransactionsUpdate
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Convert transactions to Excel rows format
  const excelRows = useMemo((): ExcelRow[] => {
    let runningBalance = 0;
    
    return transactions
      .sort((a, b) => {
        const dateA = new Date(a.normalizedDate || a.originalDate);
        const dateB = new Date(b.normalizedDate || b.originalDate);
        return dateA.getTime() - dateB.getTime();
      })
      .map(transaction => {
        const amount = Math.abs(transaction.normalizedAmount);
        const isIncome = transaction.transactionType === 'income';
        
        runningBalance += isIncome ? amount : -amount;
        
        return {
          id: transaction.id,
          date: transaction.normalizedDate 
            ? transaction.normalizedDate.toLocaleDateString('pt-BR')
            : transaction.originalDate,
          description: transaction.originalDescription,
          income: isIncome ? amount : 0,
          expense: isIncome ? 0 : amount,
          balance: runningBalance,
          type: transaction.transactionType || 'expense',
          category: transaction.finalCategoryId || 'Sem categoria',
          paymentMethod: transaction.finalPaymentMethod || transaction.suggestedPaymentMethod || 'cash',
          confidence: transaction.confidenceScore,
          isEditing: false
        };
      });
  }, [transactions]);

  // Apply filters and sorting
  const filteredAndSortedRows = useMemo(() => {
    let filtered = excelRows;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(row => row.type === filterType);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        row.description.toLowerCase().includes(search) ||
        row.category.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(a.date.split('/').reverse().join('-'));
        bValue = new Date(b.date.split('/').reverse().join('-'));
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [excelRows, filterType, searchTerm, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalIncome = filteredAndSortedRows.reduce((sum, row) => sum + row.income, 0);
    const totalExpense = filteredAndSortedRows.reduce((sum, row) => sum + row.expense, 0);
    const finalBalance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, finalBalance };
  }, [filteredAndSortedRows]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        transactions: filteredAndSortedRows,
        totals,
        fileName: fileName.replace(/\.[^/.]+$/, '') + '_converted.xlsx',
        currency: detectedCurrency,
        metadata: {
          totalTransactions: filteredAndSortedRows.length,
          exportDate: new Date().toISOString(),
          filters: { type: filterType, search: searchTerm }
        }
      };

      const response = await supabase.functions.invoke('excel-generator', {
        body: exportData
      });

      if (response.error) {
        throw new Error('Falha na geração do Excel');
      }

      // Download the generated file
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('converter.export.excel'),
        description: `${filteredAndSortedRows.length} transações exportadas`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Falha ao gerar arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: detectedCurrency || 'BRL'
    }).format(amount);
  };

  const getRowClassName = (row: ExcelRow) => {
    const baseClass = "hover:bg-muted/50 transition-colors";
    
    if (row.confidence < 0.6) {
      return `${baseClass} bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400`;
    }
    
    return baseClass;
  };

  const getAmountClassName = (amount: number, type: 'income' | 'expense') => {
    if (amount === 0) return "text-muted-foreground";
    
    return type === 'income' 
      ? "text-green-600 dark:text-green-400 font-semibold" 
      : "text-red-600 dark:text-red-400 font-semibold";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle>Preview Excel - {fileName}</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Calculator className="h-3 w-3" />
                {filteredAndSortedRows.length} transações
              </Badge>
              
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Gerando...' : t('converter.export.excel')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Excel Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b-2">
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none min-w-[100px]"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none min-w-[200px]"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-1">
                      Descrição
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[120px]"
                    onClick={() => handleSort('income')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Plus className="h-3 w-3 text-green-600" />
                      Entradas
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[120px]"
                    onClick={() => handleSort('expense')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Minus className="h-3 w-3 text-red-600" />
                      Saídas
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[120px]"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Saldo
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead className="min-w-[100px]">Confiança</TableHead>
                  <TableHead className="min-w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredAndSortedRows.map((row, index) => (
                  <TableRow key={row.id} className={getRowClassName(row)}>
                    <TableCell className="font-mono text-sm">
                      {row.date}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{row.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.category} • {row.paymentMethod}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono">
                      <span className={getAmountClassName(row.income, 'income')}>
                        {row.income > 0 ? formatCurrency(row.income) : ''}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono">
                      <span className={getAmountClassName(row.expense, 'expense')}>
                        {row.expense > 0 ? formatCurrency(row.expense) : ''}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono font-semibold">
                      <span className={row.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(row.balance)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={row.confidence >= 0.8 ? 'default' : row.confidence >= 0.6 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {Math.round(row.confidence * 100)}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover-scale"
                        onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Totals Row */}
                <TableRow className="border-t-2 bg-muted/20 font-semibold">
                  <TableCell colSpan={2} className="text-right">
                    <strong>TOTAIS:</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {formatCurrency(totals.totalIncome)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      {formatCurrency(totals.totalExpense)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={`font-bold ${totals.finalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(totals.finalBalance)}
                    </span>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totals.totalIncome)}
                </p>
              </div>
              <Plus className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totals.totalExpense)}
                </p>
              </div>
              <Minus className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Final</p>
                <p className={`text-2xl font-bold ${totals.finalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(totals.finalBalance)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};