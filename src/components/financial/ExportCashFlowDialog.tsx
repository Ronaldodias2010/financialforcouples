import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CashFlowEntry, CashFlowSummary, ConsolidatedCategory } from '@/hooks/useCashFlowHistory';
import { toast } from 'sonner';

interface ExportCashFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: CashFlowEntry[];
  summary: CashFlowSummary | null;
  consolidatedExpenses: ConsolidatedCategory[];
  consolidatedRevenues: ConsolidatedCategory[];
  dateRange: { start: Date; end: Date };
}

type ExportFormat = 'pdf' | 'xlsx' | 'csv';
type ExportContent = 'cashflow' | 'expenses' | 'revenues' | 'all';

export function ExportCashFlowDialog({
  open,
  onOpenChange,
  entries,
  summary,
  consolidatedExpenses,
  consolidatedRevenues,
  dateRange
}: ExportCashFlowDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportContent, setExportContent] = useState<ExportContent>('all');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const periodText = `${format(dateRange.start, "dd/MM/yyyy")} - ${format(dateRange.end, "dd/MM/yyyy")}`;
    
    // Title
    doc.setFontSize(18);
    doc.text('Relatório de Fluxo de Caixa', 20, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${periodText}`, 20, 28);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 20, 34);

    let yPosition = 45;

    // Summary
    if (summary && (exportContent === 'cashflow' || exportContent === 'all')) {
      doc.setFontSize(14);
      doc.text('Resumo do Período', 20, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Indicador', 'Valor']],
        body: [
          ['Saldo Inicial', formatCurrency(summary.initial_balance)],
          ['Total de Entradas', formatCurrency(summary.total_income)],
          ['Total de Saídas', formatCurrency(summary.total_expense)],
          ['Resultado do Período', formatCurrency(summary.net_result)],
          ['Saldo Final', formatCurrency(summary.final_balance)],
        ],
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 10 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Cash Flow Details
    if (includeDetails && (exportContent === 'cashflow' || exportContent === 'all')) {
      doc.setFontSize(14);
      doc.text('Histórico de Movimentações', 20, yPosition);
      yPosition += 8;

      const movementTypeLabels: Record<string, string> = {
        'income': 'Receita',
        'expense': 'Despesa',
        'initial_balance': 'Saldo Inicial',
        'adjustment': 'Ajuste',
        'transfer_in': 'Transf. Entrada',
        'transfer_out': 'Transf. Saída'
      };

      autoTable(doc, {
        startY: yPosition,
        head: [['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Saldo']],
        body: entries.map(entry => [
          format(new Date(entry.movement_date), 'dd/MM/yyyy'),
          entry.description.substring(0, 30),
          movementTypeLabels[entry.movement_type] || entry.movement_type,
          entry.category_name || '-',
          formatCurrency(entry.amount),
          formatCurrency(entry.balance_after)
        ]),
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { cellWidth: 50 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Consolidated Expenses
    if ((exportContent === 'expenses' || exportContent === 'all') && consolidatedExpenses.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Despesas Consolidadas por Categoria', 20, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Categoria', 'Total', 'Qtd', '%', 'Média']],
        body: consolidatedExpenses.map(e => [
          e.category_name,
          formatCurrency(e.total_amount),
          e.transaction_count.toString(),
          `${e.percentage.toFixed(1)}%`,
          formatCurrency(e.avg_amount)
        ]),
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Consolidated Revenues
    if ((exportContent === 'revenues' || exportContent === 'all') && consolidatedRevenues.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Receitas Consolidadas por Categoria', 20, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Categoria', 'Total', 'Qtd', '%', 'Média']],
        body: consolidatedRevenues.map(r => [
          r.category_name,
          formatCurrency(r.total_amount),
          r.transaction_count.toString(),
          `${r.percentage.toFixed(1)}%`,
          formatCurrency(r.avg_amount)
        ]),
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 9 }
      });
    }

    const filename = `fluxo-de-caixa-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const periodText = `${format(dateRange.start, "dd-MM-yyyy")} a ${format(dateRange.end, "dd-MM-yyyy")}`;

    // Summary Sheet
    if (summary && (exportContent === 'cashflow' || exportContent === 'all')) {
      const summaryData = [
        ['Relatório de Fluxo de Caixa'],
        [`Período: ${periodText}`],
        [],
        ['Indicador', 'Valor'],
        ['Saldo Inicial', summary.initial_balance],
        ['Total de Entradas', summary.total_income],
        ['Total de Saídas', summary.total_expense],
        ['Resultado do Período', summary.net_result],
        ['Saldo Final', summary.final_balance],
        ['Total de Movimentações', summary.transaction_count],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
    }

    // Cash Flow Details Sheet
    if (includeDetails && (exportContent === 'cashflow' || exportContent === 'all')) {
      const movementTypeLabels: Record<string, string> = {
        'income': 'Receita',
        'expense': 'Despesa',
        'initial_balance': 'Saldo Inicial',
        'adjustment': 'Ajuste',
        'transfer_in': 'Transf. Entrada',
        'transfer_out': 'Transf. Saída'
      };

      const detailsData = [
        ['Data', 'Descrição', 'Tipo', 'Categoria', 'Forma Pagamento', 'Conta', 'Valor', 'Saldo Após'],
        ...entries.map(entry => [
          format(new Date(entry.movement_date), 'dd/MM/yyyy'),
          entry.description,
          movementTypeLabels[entry.movement_type] || entry.movement_type,
          entry.category_name || '',
          entry.payment_method || '',
          entry.account_name || '',
          entry.amount,
          entry.balance_after
        ])
      ];
      const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Movimentações');
    }

    // Expenses Sheet
    if ((exportContent === 'expenses' || exportContent === 'all') && consolidatedExpenses.length > 0) {
      const expensesData = [
        ['Categoria', 'Total', 'Quantidade', 'Percentual', 'Média', 'Mínimo', 'Máximo'],
        ...consolidatedExpenses.map(e => [
          e.category_name,
          e.total_amount,
          e.transaction_count,
          e.percentage,
          e.avg_amount,
          e.min_amount,
          e.max_amount
        ])
      ];
      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Despesas');
    }

    // Revenues Sheet
    if ((exportContent === 'revenues' || exportContent === 'all') && consolidatedRevenues.length > 0) {
      const revenuesData = [
        ['Categoria', 'Total', 'Quantidade', 'Percentual', 'Média', 'Mínimo', 'Máximo'],
        ...consolidatedRevenues.map(r => [
          r.category_name,
          r.total_amount,
          r.transaction_count,
          r.percentage,
          r.avg_amount,
          r.min_amount,
          r.max_amount
        ])
      ];
      const revenuesSheet = XLSX.utils.aoa_to_sheet(revenuesData);
      XLSX.utils.book_append_sheet(workbook, revenuesSheet, 'Receitas');
    }

    const filename = `fluxo-de-caixa-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportToCSV = () => {
    const movementTypeLabels: Record<string, string> = {
      'income': 'Receita',
      'expense': 'Despesa',
      'initial_balance': 'Saldo Inicial',
      'adjustment': 'Ajuste',
      'transfer_in': 'Transf. Entrada',
      'transfer_out': 'Transf. Saída'
    };

    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Forma Pagamento', 'Conta', 'Valor', 'Saldo'];
    const rows = entries.map(entry => [
      format(new Date(entry.movement_date), 'dd/MM/yyyy'),
      `"${entry.description.replace(/"/g, '""')}"`,
      movementTypeLabels[entry.movement_type] || entry.movement_type,
      entry.category_name || '',
      entry.payment_method || '',
      entry.account_name || '',
      entry.amount.toString().replace('.', ','),
      entry.balance_after.toString().replace('.', ',')
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo-de-caixa-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'pdf':
          exportToPDF();
          break;
        case 'xlsx':
          exportToExcel();
          break;
        case 'csv':
          exportToCSV();
          break;
      }
      
      toast.success('Relatório exportado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Escolha o formato e o conteúdo do relatório a ser exportado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Formato</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="xlsx" id="xlsx" className="peer sr-only" />
                <Label
                  htmlFor="xlsx"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="h-6 w-6 mb-2" />
                  <span className="text-sm">Excel</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">PDF</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                <Label
                  htmlFor="csv"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <File className="h-6 w-6 mb-2" />
                  <span className="text-sm">CSV</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Content Selection */}
          <div className="space-y-3">
            <Label>Conteúdo</Label>
            <RadioGroup
              value={exportContent}
              onValueChange={(v) => setExportContent(v as ExportContent)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">Relatório Completo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cashflow" id="cashflow" />
                <Label htmlFor="cashflow" className="cursor-pointer">Apenas Fluxo de Caixa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expenses" id="expenses" />
                <Label htmlFor="expenses" className="cursor-pointer">Apenas Despesas Consolidadas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="revenues" id="revenues" />
                <Label htmlFor="revenues" className="cursor-pointer">Apenas Receitas Consolidadas</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          {(exportContent === 'cashflow' || exportContent === 'all') && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDetails"
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(!!checked)}
              />
              <Label htmlFor="includeDetails" className="cursor-pointer">
                Incluir histórico detalhado de movimentações
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
