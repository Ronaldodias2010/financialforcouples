import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeftRight, Upload, FileText, Eye, Download, Send, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadZone } from './components/FileUploadZone';
import { DocumentPreview } from './components/DocumentPreview';
import { TransactionTable } from './components/TransactionTable';
import { BulkEditPanel } from './components/BulkEditPanel';
import { ImportRules } from './components/ImportRules';
import { ExportPanel } from './components/ExportPanel';
import { ExcelPreview } from './ExcelPreview';
import { ReconciliationPanel } from './ReconciliationPanel';
import { SideBySideViewer } from './SideBySideViewer';

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

// Update ConverterDashboard to use new step: "reconciliation" 
type ConverterStep = 'upload' | 'preview' | 'reconciliation' | 'rules' | 'export';

export const ConverterDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<ConverterStep>('upload');
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleFileUpload = useCallback(async (file: File, statementType: string) => {
    setIsProcessing(true);
    setOriginalFile(file); // Store original file for PDF viewer
    
    try {
      toast({
        title: t('converter.alerts.processing'),
        description: t('converter.upload.processing'),
      });

      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileType = file.type.includes('pdf') ? 'pdf' : 
                      file.type.includes('csv') ? 'csv' : 
                      file.type.includes('image') ? 'image' : 'csv';

      // Step 1: Extract text/OCR
      let extractResponse;
      if (fileType === 'image') {
        extractResponse = await supabase.functions.invoke('ocr-processor', {
          body: { imageData: fileData, fileName: file.name }
        });
      } else {
        extractResponse = await supabase.functions.invoke('pdf-extractor', {
          body: { fileData, fileName: file.name, fileType }
        });
      }

      if (extractResponse.error) {
        throw new Error('Falha na extração de texto');
      }

      const { extractedText, detectedLanguage, detectedCurrency, detectedRegion, statementType: detectedStatementType } = extractResponse.data;

      // Step 2: Process with AI
      const aiResponse = await supabase.functions.invoke('ai-transaction-processor', {
        body: {
          extractedText,
          detectedLanguage,
          detectedCurrency,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (aiResponse.error) {
        console.error('AI processing error:', aiResponse.error);
        throw new Error('Falha no processamento IA');
      }

      const { processedTransactions } = aiResponse.data;

      // Create mock transactions with processed data
      const mockTransactions: ImportedTransaction[] = processedTransactions.map((tx: any, index: number) => ({
        id: `tx_${Date.now()}_${index}`,
        originalDescription: tx.originalDescription,
        originalDate: tx.originalDate,
        originalAmount: tx.originalAmount,
        originalCurrency: detectedCurrency,
        normalizedDate: new Date(tx.normalizedDate),
        normalizedAmount: tx.normalizedAmount,
        normalizedCurrency: detectedCurrency,
        transactionType: tx.transactionType,
        suggestedCategoryId: null,
        suggestedPaymentMethod: tx.paymentMethod,
        confidenceScore: tx.confidenceScore,
        isInstallment: tx.isInstallment,
        installmentCurrent: tx.installmentInfo ? parseInt(tx.installmentInfo.split('/')[0]) : null,
        installmentTotal: tx.installmentInfo ? parseInt(tx.installmentInfo.split('/')[1]) : null,
        isFee: tx.isFee,
        isTransfer: tx.isTransfer,
        isDuplicate: tx.isDuplicate,
        duplicateTransactionId: tx.duplicateTransactionId,
        validationStatus: 'pending',
        reviewNotes: null,
        finalCategoryId: null,
        finalAccountId: null,
        finalCardId: null,
        finalPaymentMethod: tx.paymentMethod,
        finalTags: []
      }));

      const processedFile: ImportedFile = {
        id: `file_${Date.now()}`,
        fileName: file.name,
        fileType: fileType as any,
        fileSize: file.size,
        detectedLanguage: detectedLanguage as any,
        detectedCurrency,
        detectedRegion,
        statementType: detectedStatementType || statementType as any,
        processingStatus: 'completed',
        processingError: null,
        totalTransactions: mockTransactions.length,
        transactions: mockTransactions
      };

      setImportedFile(processedFile);
      setCurrentStep('preview');
      
      toast({
        title: t('converter.alerts.ready'),
        description: `${processedFile.totalTransactions} ${t('converter.detection.transactions').toLowerCase()}`,
      });
      
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: t('converter.alerts.error'),
        description: error instanceof Error ? error.message : 'Erro no processamento',
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
    <div className="flex items-center justify-center mb-8">
      {/* Desktop version */}
      <div className="hidden md:flex items-center space-x-4">
        {[
          { key: 'upload', icon: Upload, label: t('converter.upload.title') },
          { key: 'preview', icon: Eye, label: 'Excel Preview' },
          { key: 'reconciliation', icon: Users, label: 'Reconciliação' },
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
            {index < 4 && (
              <div className="w-8 h-px bg-muted-foreground/30 mx-4" />
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile version - simplified */}
      <div className="md:hidden flex items-center space-x-2">
        {[
          { key: 'upload', icon: Upload, shortLabel: t('converter.upload.shortLabel') },
          { key: 'preview', icon: Eye, shortLabel: 'Excel' },
          { key: 'reconciliation', icon: Users, shortLabel: 'Match' },
          { key: 'rules', icon: FileText, shortLabel: t('converter.rules.shortLabel') },
          { key: 'export', icon: Download, shortLabel: t('converter.export.shortLabel') },
        ].map(({ key, icon: Icon, shortLabel }, index) => (
          <div key={key} className="flex items-center">
            <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full border-2 
              ${currentStep === key 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground/30 text-muted-foreground'
              }`}>
              <Icon className="h-3 w-3" />
            </div>
            <span className={`ml-1 text-xs font-medium
              ${currentStep === key ? 'text-foreground' : 'text-muted-foreground'}
            `}>
              {shortLabel}
            </span>
            {index < 4 && (
              <div className="w-3 h-px bg-muted-foreground/30 mx-1" />
            )}
          </div>
        ))}
      </div>
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
            <ExcelPreview 
              transactions={importedFile.transactions}
              detectedCurrency={importedFile.detectedCurrency}
              fileName={importedFile.fileName}
              onTransactionsUpdate={(updatedTransactions) => {
                // Update imported file with modified transactions
                setImportedFile(prev => prev ? {
                  ...prev,
                  transactions: updatedTransactions
                } : null);
              }}
            />
            
            {/* Side-by-Side Detailed View */}
            <div className="mt-8 pt-6 border-t">
              <SideBySideViewer
                pdfFile={originalFile}
                fileName={importedFile.fileName}
                fileType={importedFile.fileType}
                transactions={importedFile.transactions}
                detectedCurrency={importedFile.detectedCurrency}
                onTransactionsUpdate={(updatedTransactions) => {
                  setImportedFile(prev => prev ? {
                    ...prev,
                    transactions: updatedTransactions
                  } : null);
                }}
              />
            </div>
          </div>
        ) : null;
        
      case 'reconciliation':
        return importedFile ? (
          <ReconciliationPanel
            importedTransactions={importedFile.transactions}
            existingTransactions={[]} // TODO: Fetch from database
            onReconciliationComplete={(selectedTransactions) => {
              // Update selected transactions and move to next step
              setImportedFile(prev => prev ? {
                ...prev,
                transactions: selectedTransactions
              } : null);
              setCurrentStep('rules');
            }}
          />
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
              const steps: ConverterStep[] = ['upload', 'preview', 'reconciliation', 'rules', 'export'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            disabled={currentStep === 'upload'}
          >
            {t('nav.previous')}
          </Button>
          
          <div className="flex gap-2">
            {importedFile && currentStep === 'preview' && (
              <Button
                onClick={() => setCurrentStep('reconciliation')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Reconciliar
              </Button>
            )}
          </div>
          
          <Button
            onClick={() => {
              const steps: ConverterStep[] = ['upload', 'preview', 'reconciliation', 'rules', 'export'];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}
            disabled={currentStep === 'export' || (currentStep === 'upload' && !importedFile)}
          >
            {t('nav.next')}
          </Button>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
};