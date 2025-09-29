import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeftRight, Upload, FileText, Eye, Download, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { FileUploadZone } from './components/FileUploadZone';
import { DocumentPreview } from './components/DocumentPreview';
import { TransactionTable } from './components/TransactionTable';
import { BulkEditPanel } from './components/BulkEditPanel';
import { ImportRules } from './components/ImportRules';
import { ExportPanel } from './components/ExportPanel';

export interface ImportedTransaction {
  id: string;
  originalDescription: string;
  originalDate: string;
  originalAmount: string;
  originalCurrency: string;
  normalizedDate: Date | null;
  normalizedAmount: number;
  normalizedCurrency: string;
  transactionType: 'income' | 'expense' | 'transfer' | null;
  suggestedCategoryId: string | null;
  suggestedPaymentMethod: string | null;
  confidenceScore: number;
  isInstallment: boolean;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  isFee: boolean;
  isTransfer: boolean;
  isDuplicate: boolean;
  duplicateTransactionId: string | null;
  validationStatus: 'pending' | 'approved' | 'rejected' | 'needs_review';
  reviewNotes: string | null;
  finalCategoryId: string | null;
  finalAccountId: string | null;
  finalCardId: string | null;
  finalPaymentMethod: string | null;
  finalTags: string[];
}

export interface ImportedFile {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'csv' | 'ofx' | 'image';
  fileSize: number;
  detectedLanguage: 'pt' | 'en' | 'es';
  detectedCurrency: string;
  detectedRegion: string | null;
  statementType: 'bank' | 'credit_card' | 'auto';
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  processingError: string | null;
  totalTransactions: number;
  transactions: ImportedTransaction[];
}

type ConverterStep = 'upload' | 'preview' | 'rules' | 'export';

export const ConverterDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<ConverterStep>('upload');
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback(async (file: File, statementType: string) => {
    setIsProcessing(true);
    
    try {
      // TODO: Implement file upload and processing
      toast({
        title: t('converter.alerts.processing'),
        description: t('converter.upload.processing'),
      });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful processing
      const mockFile: ImportedFile = {
        id: `file_${Date.now()}`,
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'pdf' : 'csv',
        fileSize: file.size,
        detectedLanguage: 'pt',
        detectedCurrency: 'BRL',
        detectedRegion: 'BR',
        statementType: statementType as any,
        processingStatus: 'completed',
        processingError: null,
        totalTransactions: 5,
        transactions: [] // Mock transactions will be added via AI processing
      };

      setImportedFile(mockFile);
      setCurrentStep('preview');
      
      toast({
        title: t('converter.alerts.ready'),
        description: `${mockFile.totalTransactions} ${t('converter.detection.transactions').toLowerCase()}`,
      });
      
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: t('converter.alerts.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [t, toast]);

  const handleSendToTransactions = useCallback(async () => {
    if (!importedFile) return;
    
    try {
      // TODO: Implement sending approved transactions to main transactions table
      toast({
        title: t('converter.alerts.success'),
        description: `${selectedTransactions.length} transações enviadas`,
      });
      
      // Reset converter state
      setImportedFile(null);
      setSelectedTransactions([]);
      setCurrentStep('upload');
      
    } catch (error) {
      console.error('Send to transactions error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar transações',
        variant: 'destructive',
      });
    }
  }, [importedFile, selectedTransactions, t, toast]);

  const handleExport = useCallback(async (format: 'excel' | 'csv', includeFiltered: boolean) => {
    if (!importedFile) return;
    
    try {
      // TODO: Implement export functionality
      toast({
        title: 'Exportando...',
        description: `Formato: ${format.toUpperCase()}`,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Falha ao exportar dados',
        variant: 'destructive',
      });
    }
  }, [importedFile, toast]);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[
        { key: 'upload', icon: Upload, label: t('converter.upload.title') },
        { key: 'preview', icon: Eye, label: t('converter.preview.title') },
        { key: 'rules', icon: FileText, label: t('converter.rules.title') },
        { key: 'export', icon: Download, label: t('converter.export.title') },
      ].map(({ key, icon: Icon, label }, index) => (
        <div key={key} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${currentStep === key 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'border-muted-foreground/30 text-muted-foreground'
            }`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className={`ml-2 text-sm font-medium
            ${currentStep === key ? 'text-foreground' : 'text-muted-foreground'}
          `}>
            {label}
          </span>
          {index < 3 && (
            <div className="w-8 h-px bg-muted-foreground/30 mx-4" />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUploadZone
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
        );
        
      case 'preview':
        return importedFile ? (
          <div className="space-y-6">
            <DocumentPreview importedFile={importedFile} />
            <TransactionTable
              transactions={importedFile.transactions}
              selectedTransactions={selectedTransactions}
              onSelectionChange={setSelectedTransactions}
            />
            <BulkEditPanel
              selectedTransactions={selectedTransactions}
              onBulkUpdate={(updates) => {
                // TODO: Implement bulk updates
                console.log('Bulk updates:', updates);
              }}
            />
          </div>
        ) : null;
        
      case 'rules':
        return (
          <ImportRules
            onRuleCreated={(rule) => {
              // TODO: Implement rule creation
              console.log('New rule:', rule);
            }}
          />
        );
        
      case 'export':
        return (
          <ExportPanel
            importedFile={importedFile}
            onExport={handleExport}
            onSendToTransactions={handleSendToTransactions}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <PremiumFeatureGuard
      feature="converter"
      fallback={
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
              <CardTitle>{t('converter.title')}</CardTitle>
            </div>
            <p className="text-muted-foreground">{t('converter.subtitle')}</p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade está disponível apenas para usuários Premium.
            </p>
          </CardContent>
        </Card>
      }
    >
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('converter.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">{t('converter.subtitle')}</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Content */}
        <div className="min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => {
              const steps: ConverterStep[] = ['upload', 'preview', 'rules', 'export'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            disabled={currentStep === 'upload'}
          >
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {importedFile && currentStep === 'preview' && (
              <Button
                onClick={() => setCurrentStep('export')}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {t('converter.actions.sendToTransactions')}
              </Button>
            )}
          </div>
          
          <Button
            onClick={() => {
              const steps: ConverterStep[] = ['upload', 'preview', 'rules', 'export'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}
            disabled={currentStep === 'export' || (currentStep === 'upload' && !importedFile)}
          >
            Próximo
          </Button>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
};