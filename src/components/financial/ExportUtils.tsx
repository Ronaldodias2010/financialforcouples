import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ExportFormat, ExportSelector } from '@/components/ui/ExportSelector';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV as utilExportToCSV, exportToPDF as utilExportToPDF, exportToExcel as utilExportToExcel } from '@/utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  purchase_date?: string;
  category?: { name: string };
  categories?: { name: string };
  owner_user?: string;
  payment_method?: string;
  cards?: { name: string };
  accounts?: { name: string };
}

interface ExportUtilsProps {
  data: Transaction[];
  filename: string;
  headers: string[];
  tableHeaders?: string[];
  formatRowForCSV: (transaction: Transaction) => string[];
  formatRowForPDF?: (transaction: Transaction) => string[];
  title?: string;
  additionalInfo?: { label: string; value: string }[];
  disabled?: boolean;
}

export const ExportUtils: React.FC<ExportUtilsProps> = ({
  data,
  filename,
  headers,
  tableHeaders,
  formatRowForCSV,
  formatRowForPDF,
  title,
  additionalInfo = [],
  disabled = false
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: t('export.error'),
        description: t('export.noData'),
        variant: "destructive",
      });
      return;
    }

    try {
      const csvData = data.map(formatRowForCSV);
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast({
        title: t('common.success'),
        description: t('export.success.csv'),
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: t('common.error'),
        description: t('export.error'),
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast({
        title: t('export.error'),
        description: t('export.noData'),
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      if (title) {
        doc.setFontSize(18);
        doc.text(title, 20, 20);
      }
      
      let yPosition = title ? 35 : 20;
      
      // Informações adicionais
      if (additionalInfo.length > 0) {
        doc.setFontSize(12);
        additionalInfo.forEach((info) => {
          doc.text(`${info.label}: ${info.value}`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }
      
      const pdfHeaders = tableHeaders || headers;
      const formatFunction = formatRowForPDF || formatRowForCSV;
      const tableData = data.map(formatFunction);

      autoTable(doc, {
        head: [pdfHeaders],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 102, 241],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
      });

      doc.save(`${filename}.pdf`);
      
      toast({
        title: t('common.success'),
        description: t('export.success.pdf'),
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: t('common.error'),
        description: t('export.error'),
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast({
        title: t('export.error'),
        description: t('export.noData'),
        variant: "destructive",
      });
      return;
    }

    try {
      const excelData = data.map(formatRowForCSV);
      
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Criar worksheet com dados
      const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
      
      // Configurar largura das colunas
      const colWidths = headers.map(() => ({ wch: 15 }));
      ws['!cols'] = colWidths;
      
      // Estilizar cabeçalhos
      const headerCells = headers.map((_, index) => 
        XLSX.utils.encode_cell({ r: 0, c: index })
      );
      
      headerCells.forEach(cellRef => {
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4266F1" } },
            color: { rgb: "FFFFFF" }
          };
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');
      
      // Exportar arquivo
      XLSX.writeFile(wb, `${filename}.xlsx`);
      
      toast({
        title: t('common.success'),
        description: t('export.success.excel'),
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: t('common.error'),
        description: t('export.error'),
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
    }
  };

  return (
    <ExportSelector 
      onExport={handleExport}
      disabled={disabled || data.length === 0}
    />
  );
};