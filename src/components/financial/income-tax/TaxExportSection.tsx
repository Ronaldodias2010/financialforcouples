import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  FileSpreadsheet, 
  Download,
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { TaxReportSummary, TaxableIncome, DeductibleExpense, TaxAsset, PendingItem } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportTaxReportPDF, exportTaxReportExcel } from '@/utils/taxExportUtils';
import { toast } from 'sonner';

interface TaxExportSectionProps {
  taxYear: number;
  summary: TaxReportSummary;
  taxableIncomes: TaxableIncome[];
  exemptIncomes: TaxableIncome[];
  deductibleExpenses: DeductibleExpense[];
  taxAssets: TaxAsset[];
  pendingItems?: PendingItem[];
  profile?: {
    display_name?: string;
    cpf?: string;
  };
  onReviewAll?: () => void;
}

export function TaxExportSection({ 
  taxYear,
  summary,
  taxableIncomes,
  exemptIncomes,
  deductibleExpenses,
  taxAssets,
  pendingItems,
  profile,
  onReviewAll
}: TaxExportSectionProps) {
  const { t } = useLanguage();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const exportData = {
    taxYear,
    summary,
    taxableIncomes,
    exemptIncomes,
    deductibleExpenses,
    taxAssets,
    pendingItems,
    profile
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportTaxReportPDF(exportData);
      toast.success(t('tax.export.pdfSuccess') || 'PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('tax.export.error') || 'Erro ao exportar');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportTaxReportExcel(exportData);
      toast.success(t('tax.export.excelSuccess') || 'Excel exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error(t('tax.export.error') || 'Erro ao exportar');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleReviewAll = () => {
    if (onReviewAll) {
      onReviewAll();
    } else {
      // Scroll to pending section
      const pendingSection = document.getElementById('pending-section');
      if (pendingSection) {
        pendingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t('tax.export.title')}
        </CardTitle>
        <CardDescription>{t('tax.export.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* PDF Export */}
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
          >
            {isExportingPDF ? (
              <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            ) : (
              <FileText className="h-8 w-8 text-red-500" />
            )}
            <div className="text-center">
              <div className="font-medium">{t('tax.export.pdf')}</div>
              <div className="text-xs text-muted-foreground">{t('tax.export.pdfDesc')}</div>
            </div>
          </Button>

          {/* Excel Export */}
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
          >
            {isExportingExcel ? (
              <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
            )}
            <div className="text-center">
              <div className="font-medium">{t('tax.export.excel')}</div>
              <div className="text-xs text-muted-foreground">{t('tax.export.excelDesc')}</div>
            </div>
          </Button>

          {/* Receita Federal Link */}
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            asChild
          >
            <a href="https://www.gov.br/receitafederal/pt-br" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <div className="font-medium">{t('tax.export.receita')}</div>
                <div className="text-xs text-muted-foreground">{t('tax.export.receitaDesc')}</div>
              </div>
            </a>
          </Button>

          {/* Review All */}
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={handleReviewAll}
          >
            <RefreshCw className="h-8 w-8 text-purple-500" />
            <div className="text-center">
              <div className="font-medium">{t('tax.export.review')}</div>
              <div className="text-xs text-muted-foreground">{t('tax.export.reviewDesc')}</div>
            </div>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            {t('tax.export.disclaimer')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
