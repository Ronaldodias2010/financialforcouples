import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeftRight, Upload, FileText, Eye, Download, Send, AlertTriangle, CheckCircle2, Users, Settings } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadZone } from './components/FileUploadZone';
import { DocumentPreview } from './components/DocumentPreview';
import { ImportRules } from './components/ImportRules';
import { ExportPanel } from './components/ExportPanel';
import { ExtractPreview } from './ExtractPreview';
import { ReconciliationSelector } from './ReconciliationSelector';
import { DifferencesView } from './DifferencesView';
import { ImportConfirmation } from './ImportConfirmation';
import * as XLSX from 'xlsx';

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
  metadata?: {
    bankName?: string;
    accountNumber?: string;
    statementPeriod?: {
      start: string;
      end: string;
    };
  };
}

interface ExistingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_name?: string;
  payment_method?: string;
  source: 'transactions' | 'future_expenses';
}

interface ReconciliationConfig {
  sourceType: 'account' | 'card';
  sourceId: string;
  sourceName: string;
  startDate: string;
  endDate: string;
}

// Updated steps for new flow
type ConverterStep = 'upload' | 'preview' | 'select-source' | 'differences' | 'import' | 'export';

export const ConverterDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<ConverterStep>('upload');
  const [importedFile, setImportedFile] = useState<ImportedFile | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // New state for reconciliation flow
  const [reconciliationConfig, setReconciliationConfig] = useState<ReconciliationConfig | null>(null);
  const [existingTransactions, setExistingTransactions] = useState<ExistingTransaction[]>([]);
  const [transactionsToImport, setTransactionsToImport] = useState<ImportedTransaction[]>([]);
  const [isLoadingReconciliation, setIsLoadingReconciliation] = useState(false);

  const handleFileUpload = useCallback(async (file: File, statementType: string) => {
    setIsProcessing(true);
    setOriginalFile(file);
    setProcessingProgress(0);
    setProcessingStep('Preparando arquivo...');
    
    try {
      toast({
        title: t('converter.alerts.processing'),
        description: t('converter.upload.processing'),
      });

      setProcessingProgress(10);

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

      setProcessingProgress(20);
      setProcessingStep('Processando OCR com Mistral AI...');

      // Use Mistral OCR for images and PDFs
      if (fileType === 'image' || fileType === 'pdf') {
        // Extract base64 data without prefix
        const base64Data = fileData.split(',')[1];
        
        const ocrResponse = await supabase.functions.invoke('mistral-ocr-processor', {
          body: { 
            document: base64Data, 
            type: fileType,
            fileName: file.name 
          }
        });

        setProcessingProgress(70);

        if (ocrResponse.error) {
          console.error('Mistral OCR error:', ocrResponse.error);
          
          // Fallback to old OCR processor
          setProcessingStep('Tentando método alternativo...');
          
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
            throw new Error(`Falha na extração: ${extractResponse.error.message}`);
          }

          // Process with AI
          setProcessingStep('Analisando transações...');
          const aiResponse = await supabase.functions.invoke('ai-transaction-processor', {
            body: {
              extractedText: extractResponse.data.extractedText,
              detectedLanguage: extractResponse.data.detectedLanguage || 'pt',
              detectedCurrency: extractResponse.data.detectedCurrency || 'BRL',
              userId: (await supabase.auth.getUser()).data.user?.id
            }
          });

          if (!aiResponse.error && aiResponse.data.processedTransactions) {
            const mockTransactions = createTransactionsFromAI(
              aiResponse.data.processedTransactions,
              extractResponse.data.detectedCurrency || 'BRL'
            );

            setImportedFile({
              id: `file_${Date.now()}`,
              fileName: file.name,
              fileType: fileType as any,
              fileSize: file.size,
              detectedLanguage: extractResponse.data.detectedLanguage || 'pt',
              detectedCurrency: extractResponse.data.detectedCurrency || 'BRL',
              detectedRegion: extractResponse.data.detectedRegion || 'BR',
              statementType: statementType as any,
              processingStatus: 'completed',
              processingError: null,
              totalTransactions: mockTransactions.length,
              transactions: mockTransactions
            });
            
            setCurrentStep('preview');
            toast({
              title: 'Extração concluída',
              description: `${mockTransactions.length} transações encontradas (método alternativo)`,
            });
            return;
          }
        }

        // Process Mistral OCR response
        if (ocrResponse.data?.success) {
          const { transactions, metadata, extractedText } = ocrResponse.data;
          
          const mockTransactions: ImportedTransaction[] = transactions.map((tx: any, index: number) => ({
            id: `tx_${Date.now()}_${index}`,
            originalDescription: tx.description,
            originalDate: tx.date,
            originalAmount: String(tx.amount),
            originalCurrency: metadata.currency || 'BRL',
            normalizedDate: new Date(tx.date),
            normalizedAmount: Math.abs(tx.amount),
            normalizedCurrency: metadata.currency || 'BRL',
            transactionType: tx.type as 'income' | 'expense',
            suggestedCategoryId: null,
            suggestedPaymentMethod: null,
            confidenceScore: tx.confidence || 0.8,
            isInstallment: false,
            installmentCurrent: null,
            installmentTotal: null,
            isFee: false,
            isTransfer: false,
            isDuplicate: false,
            duplicateTransactionId: null,
            validationStatus: 'pending' as const,
            reviewNotes: null,
            finalCategoryId: null,
            finalAccountId: null,
            finalCardId: null,
            finalPaymentMethod: null,
            finalTags: []
          }));

          setProcessingProgress(100);
          
          setImportedFile({
            id: `file_${Date.now()}`,
            fileName: file.name,
            fileType: fileType as any,
            fileSize: file.size,
            detectedLanguage: (metadata.language || 'pt') as 'pt' | 'en' | 'es',
            detectedCurrency: metadata.currency || 'BRL',
            detectedRegion: 'BR',
            statementType: statementType as any,
            processingStatus: 'completed',
            processingError: null,
            totalTransactions: mockTransactions.length,
            transactions: mockTransactions,
            metadata: {
              bankName: metadata.bankName,
              accountNumber: metadata.accountNumber,
              statementPeriod: metadata.statementPeriod
            }
          });

          setCurrentStep('preview');
          
          toast({
            title: t('converter.alerts.ready'),
            description: `${mockTransactions.length} transações extraídas com Mistral OCR`,
          });
          return;
        }
      }

      // CSV/OFX handling - direct parsing
      if (fileType === 'csv') {
        setProcessingStep('Processando arquivo CSV...');
        const csvText = await file.text();
        const transactions = parseCSV(csvText);
        
        setImportedFile({
          id: `file_${Date.now()}`,
          fileName: file.name,
          fileType: 'csv',
          fileSize: file.size,
          detectedLanguage: 'pt',
          detectedCurrency: 'BRL',
          detectedRegion: 'BR',
          statementType: statementType as any,
          processingStatus: 'completed',
          processingError: null,
          totalTransactions: transactions.length,
          transactions: transactions
        });

        setCurrentStep('preview');
        toast({
          title: t('converter.alerts.ready'),
          description: `${transactions.length} transações importadas do CSV`,
        });
        return;
      }

      // Fallback if nothing worked
      throw new Error('Não foi possível processar o arquivo');

    } catch (error) {
      console.error('File processing error:', error);
      
      toast({
        title: t('converter.alerts.error'),
        description: error instanceof Error ? error.message : 'Erro no processamento',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  }, [t, toast]);

  // Helper function to create transactions from AI response
  const createTransactionsFromAI = (processedTransactions: any[], currency: string): ImportedTransaction[] => {
    return processedTransactions.map((tx: any, index: number) => ({
      id: `tx_${Date.now()}_${index}`,
      originalDescription: tx.originalDescription || tx.description,
      originalDate: tx.originalDate || tx.date,
      originalAmount: tx.originalAmount || String(tx.amount),
      originalCurrency: currency,
      normalizedDate: tx.normalizedDate ? new Date(tx.normalizedDate) : new Date(tx.date),
      normalizedAmount: tx.normalizedAmount || Math.abs(tx.amount),
      normalizedCurrency: currency,
      transactionType: tx.transactionType || tx.type,
      suggestedCategoryId: null,
      suggestedPaymentMethod: tx.paymentMethod || null,
      confidenceScore: tx.confidenceScore || 0.7,
      isInstallment: tx.isInstallment || false,
      installmentCurrent: tx.installmentInfo ? parseInt(tx.installmentInfo.split('/')[0]) : null,
      installmentTotal: tx.installmentInfo ? parseInt(tx.installmentInfo.split('/')[1]) : null,
      isFee: tx.isFee || false,
      isTransfer: tx.isTransfer || false,
      isDuplicate: tx.isDuplicate || false,
      duplicateTransactionId: tx.duplicateTransactionId || null,
      validationStatus: 'pending' as const,
      reviewNotes: null,
      finalCategoryId: null,
      finalAccountId: null,
      finalCardId: null,
      finalPaymentMethod: tx.paymentMethod || null,
      finalTags: []
    }));
  };

  // Simple CSV parser
  const parseCSV = (csvText: string): ImportedTransaction[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
    const transactions: ImportedTransaction[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim());
      if (values.length < 3) continue;
      
      const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('description') || h.includes('historico'));
      const amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('value'));
      
      const dateStr = values[dateIdx >= 0 ? dateIdx : 0];
      const desc = values[descIdx >= 0 ? descIdx : 1];
      const amountStr = values[amountIdx >= 0 ? amountIdx : 2];
      
      const amount = parseFloat(amountStr.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (isNaN(amount)) continue;
      
      transactions.push({
        id: `tx_${Date.now()}_${i}`,
        originalDescription: desc,
        originalDate: dateStr,
        originalAmount: amountStr,
        originalCurrency: 'BRL',
        normalizedDate: new Date(dateStr.split('/').reverse().join('-')),
        normalizedAmount: Math.abs(amount),
        normalizedCurrency: 'BRL',
        transactionType: amount < 0 ? 'expense' : 'income',
        suggestedCategoryId: null,
        suggestedPaymentMethod: null,
        confidenceScore: 0.9,
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
      });
    }
    
    return transactions;
  };

  // Export handlers
  const handleExportExcel = useCallback(() => {
    if (!importedFile) return;
    
    const data = importedFile.transactions.map(tx => ({
      'Data': tx.normalizedDate ? new Intl.DateTimeFormat('pt-BR').format(new Date(tx.normalizedDate)) : tx.originalDate,
      'Descrição': tx.originalDescription,
      'Valor': tx.normalizedAmount,
      'Tipo': tx.transactionType === 'income' ? 'Entrada' : 'Saída',
      'Moeda': tx.normalizedCurrency
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');
    XLSX.writeFile(wb, `extrato_${importedFile.fileName.replace(/\.[^.]+$/, '')}.xlsx`);
    
    toast({
      title: 'Exportação concluída',
      description: 'Arquivo Excel baixado com sucesso',
    });
  }, [importedFile, toast]);

  const handleExportCSV = useCallback(() => {
    if (!importedFile) return;
    
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Moeda'];
    const rows = importedFile.transactions.map(tx => [
      tx.normalizedDate ? new Intl.DateTimeFormat('pt-BR').format(new Date(tx.normalizedDate)) : tx.originalDate,
      `"${tx.originalDescription.replace(/"/g, '""')}"`,
      tx.normalizedAmount,
      tx.transactionType === 'income' ? 'Entrada' : 'Saída',
      tx.normalizedCurrency
    ]);
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato_${importedFile.fileName.replace(/\.[^.]+$/, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV baixado com sucesso',
    });
  }, [importedFile, toast]);

  // Start reconciliation
  const handleStartReconciliation = useCallback(async (config: ReconciliationConfig) => {
    setReconciliationConfig(config);
    setIsLoadingReconciliation(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-reconciliation-data', {
        body: {
          sourceType: config.sourceType,
          sourceId: config.sourceId,
          startDate: config.startDate,
          endDate: config.endDate
        }
      });
      
      if (error) throw error;
      
      setExistingTransactions(data.existingTransactions || []);
      setCurrentStep('differences');
      
      toast({
        title: 'Dados carregados',
        description: `${data.existingTransactions?.length || 0} transações encontradas no sistema`,
      });
    } catch (error) {
      console.error('Reconciliation data error:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReconciliation(false);
    }
  }, [toast]);

  // Handle proceed to import
  const handleProceedToImport = useCallback((transactions: ImportedTransaction[]) => {
    setTransactionsToImport(transactions);
    setCurrentStep('import');
  }, []);

  // Handle import complete
  const handleImportComplete = useCallback(() => {
    // Reset state and go back to upload
    setImportedFile(null);
    setSelectedTransactions([]);
    setReconciliationConfig(null);
    setExistingTransactions([]);
    setTransactionsToImport([]);
    setCurrentStep('upload');
  }, []);

  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', icon: Upload, label: 'Upload', shortLabel: 'Upload' },
      { key: 'preview', icon: Eye, label: 'Preview', shortLabel: 'Preview' },
      { key: 'select-source', icon: Users, label: 'Origem', shortLabel: 'Origem' },
      { key: 'differences', icon: ArrowLeftRight, label: 'Diferenças', shortLabel: 'Dif.' },
      { key: 'import', icon: Send, label: 'Importar', shortLabel: 'Importar' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center mb-8">
        {/* Desktop version */}
        <div className="hidden md:flex items-center space-x-4">
          {steps.map(({ key, icon: Icon, label }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${currentStep === key 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : index < currentIndex
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                {index < currentIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium
                ${currentStep === key ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-4 ${index < currentIndex ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Mobile version */}
        <div className="md:hidden flex flex-wrap items-center justify-center gap-2 px-2">
          {steps.map(({ key, icon: Icon, shortLabel }, index) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${currentStep === key 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : index < currentIndex
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                {index < currentIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight max-w-[50px]
                ${currentStep === key ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {shortLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-4">
            <FileUploadZone
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
            />
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{processingStep}</span>
                      <span className="font-medium">{processingProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 'preview':
        return importedFile ? (
          <div className="space-y-6">
            <DocumentPreview importedFile={importedFile} />
            <ExtractPreview 
              transactions={importedFile.transactions}
              metadata={{
                bankName: importedFile.metadata?.bankName,
                accountNumber: importedFile.metadata?.accountNumber,
                currency: importedFile.detectedCurrency,
                statementPeriod: importedFile.metadata?.statementPeriod
              }}
              onTransactionsUpdate={(updatedTransactions) => {
                setImportedFile(prev => prev ? {
                  ...prev,
                  transactions: updatedTransactions
                } : null);
              }}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
            />
          </div>
        ) : null;
        
      case 'select-source':
        return importedFile ? (
          <ReconciliationSelector
            statementPeriod={importedFile.metadata?.statementPeriod}
            onStartReconciliation={handleStartReconciliation}
          />
        ) : null;
        
      case 'differences':
        return importedFile && reconciliationConfig ? (
          <DifferencesView
            importedTransactions={importedFile.transactions}
            existingTransactions={existingTransactions}
            sourceName={reconciliationConfig.sourceName}
            currency={importedFile.detectedCurrency}
            onProceedToImport={handleProceedToImport}
            onBack={() => setCurrentStep('select-source')}
          />
        ) : null;
        
      case 'import':
        return reconciliationConfig ? (
          <ImportConfirmation
            transactions={transactionsToImport}
            sourceType={reconciliationConfig.sourceType}
            sourceId={reconciliationConfig.sourceId}
            sourceName={reconciliationConfig.sourceName}
            currency={importedFile?.detectedCurrency || 'BRL'}
            onComplete={handleImportComplete}
            onBack={() => setCurrentStep('differences')}
          />
        ) : null;
        
      case 'export':
        return (
          <ExportPanel
            importedFile={importedFile}
            onExport={async (format) => { format === 'excel' ? handleExportExcel() : handleExportCSV(); }}
            onSendToTransactions={async () => { setCurrentStep('select-source'); }}
          />
        );
        
      default:
        return null;
    }
  };

  const getNextStep = (): ConverterStep | null => {
    switch (currentStep) {
      case 'upload': return importedFile ? 'preview' : null;
      case 'preview': return 'select-source';
      case 'select-source': return null; // Handled by ReconciliationSelector
      case 'differences': return null; // Handled by DifferencesView
      case 'import': return null;
      default: return null;
    }
  };

  const getPrevStep = (): ConverterStep | null => {
    switch (currentStep) {
      case 'preview': return 'upload';
      case 'select-source': return 'preview';
      case 'differences': return 'select-source';
      case 'import': return 'differences';
      case 'export': return 'preview';
      default: return null;
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
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-8 pt-6 border-t gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const prevStep = getPrevStep();
              if (prevStep) setCurrentStep(prevStep);
            }}
            disabled={!getPrevStep()}
            className="w-full sm:w-auto"
          >
            {t('nav.previous')}
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {importedFile && currentStep === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('export')}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button
                  onClick={() => setCurrentStep('select-source')}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Reconciliar</span>
                  <span className="sm:hidden">Reconciliar</span>
                </Button>
              </>
            )}
          </div>
          
          <Button
            onClick={() => {
              const nextStep = getNextStep();
              if (nextStep) setCurrentStep(nextStep);
            }}
            disabled={!getNextStep()}
            className="w-full sm:w-auto"
          >
            {t('nav.next')}
          </Button>
        </div>
      </div>
    </PremiumFeatureGuard>
  );
};
