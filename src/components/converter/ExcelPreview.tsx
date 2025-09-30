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
  isCompactMode?: boolean;
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
  onTransactionsUpdate,
  isCompactMode = false
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
      // Validate data before export
      if (!filteredAndSortedRows || filteredAndSortedRows.length === 0) {
        toast({
          title: 'Sem dados',
          description: 'Não há transações para exportar',
          variant: 'destructive',
        });
        return;
      }

      console.log('Starting Excel export...', {
        transactionCount: filteredAndSortedRows.length,
        fileName: fileName
      });

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

      console.log('Excel generator response:', {
        hasError: !!response.error,
        hasData: !!response.data,
        dataType: typeof response.data
      });

      if (response.error) {
        console.error('Excel generation error:', response.error);
        throw new Error(`Falha na geração do Excel: ${response.error.message || 'Erro desconhecido'}`);
      }

      if (!response.data) {
        throw new Error('Nenhum dado retornado pelo gerador de Excel');
      }

      // Download the generated file
      // The response.data is already a Uint8Array from the edge function
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      console.log('Creating download blob:', {
        blobSize: blob.size,
        blobType: blob.type
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Excel file downloaded successfully');

      toast({
        title: 'Sucesso!',
        description: `${filteredAndSortedRows.length} transações exportadas para Excel`,
      });

    } catch (error) {
      console.error('❌ Export error:', error);
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Falha ao gerar arquivo Excel',
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
    <div className={`space-y-6 animate-fade-in ${isCompactMode ? 'h-full flex flex-col' : ''}`}>
      {/* Header */}
      {!isCompactMode && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base truncate">Preview Excel - {fileName}</CardTitle>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Calculator className="h-3 w-3" />
                  {filteredAndSortedRows.length}
                </Badge>
                
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="gap-2 flex-1 sm:flex-none"
                  size="sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {isExporting ? 'Gerando...' : t('converter.export.excel')}
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Compact mode header */}
      {isCompactMode && (
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Excel Gerado</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Calculator className="h-2 w-2" />
              {filteredAndSortedRows.length}
            </Badge>
            
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="h-6 px-2"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      {!isCompactMode && (
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-10 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
      )}

      {/* Compact filters */}
      {isCompactMode && (
        <div className="flex gap-2 px-3">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs h-6"
          />
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-20 h-6 text-xs">
              <Filter className="h-2 w-2 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="income">+</SelectItem>
              <SelectItem value="expense">-</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Excel Table */}
      <Card className={isCompactMode ? 'flex-1 flex flex-col' : ''}>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className={`overflow-x-auto overflow-y-auto ${isCompactMode ? 'flex-1 max-h-none' : 'max-h-[400px] sm:max-h-[600px]'}`}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b-2">
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none min-w-[80px] text-xs sm:text-sm"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none min-w-[150px] text-xs sm:text-sm"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-1">
                      Descrição
                      <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[90px] text-xs sm:text-sm"
                    onClick={() => handleSort('income')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Plus className="h-2 w-2 sm:h-3 sm:w-3 text-green-600" />
                      <span className="hidden sm:inline">Entradas</span>
                      <span className="sm:hidden">+</span>
                      <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[90px] text-xs sm:text-sm"
                    onClick={() => handleSort('expense')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Minus className="h-2 w-2 sm:h-3 sm:w-3 text-red-600" />
                      <span className="hidden sm:inline">Saídas</span>
                      <span className="sm:hidden">-</span>
                      <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none min-w-[90px] text-xs sm:text-sm"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Saldo
                      <ArrowUpDown className="h-2 w-2 sm:h-3 sm:w-3" />
                    </div>
                  </TableHead>
                  
                  <TableHead className="min-w-[70px] text-xs sm:text-sm hidden sm:table-cell">Confiança</TableHead>
                  <TableHead className="min-w-[60px] text-xs sm:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredAndSortedRows.map((row, index) => (
                  <TableRow key={row.id} className={getRowClassName(row)}>
                    <TableCell className="font-mono text-[10px] sm:text-sm p-2 sm:p-4">
                      {row.date}
                    </TableCell>
                    
                    <TableCell className="p-2 sm:p-4">
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="font-medium text-xs sm:text-sm line-clamp-2">{row.description}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                          {row.category} • {row.paymentMethod}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono text-[10px] sm:text-sm p-2 sm:p-4">
                      <span className={getAmountClassName(row.income, 'income')}>
                        {row.income > 0 ? formatCurrency(row.income) : ''}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono text-[10px] sm:text-sm p-2 sm:p-4">
                      <span className={getAmountClassName(row.expense, 'expense')}>
                        {row.expense > 0 ? formatCurrency(row.expense) : ''}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right font-mono font-semibold text-[10px] sm:text-sm p-2 sm:p-4">
                      <span className={row.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(row.balance)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                      <Badge 
                        variant={row.confidence >= 0.8 ? 'default' : row.confidence >= 0.6 ? 'secondary' : 'destructive'}
                        className="text-[10px] sm:text-xs"
                      >
                        {Math.round(row.confidence * 100)}%
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="p-2 sm:p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover-scale"
                        onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                      >
                        <Edit3 className="h-2 w-2 sm:h-3 sm:w-3" />
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