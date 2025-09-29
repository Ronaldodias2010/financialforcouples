import React, { useCallback, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CreditCard, Zap, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface FileUploadZoneProps {
  onFileUpload: (file: File, statementType: string) => Promise<void>;
  isProcessing: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  isProcessing
}) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statementType, setStatementType] = useState<string>('auto');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'text/csv', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'application/x-ofx'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.ofx')) {
      alert('Tipo de arquivo não suportado. Use PDF, CSV, Excel, PNG, JPG ou OFX.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      alert('Arquivo muito grande. Máximo 20MB.');
      return;
    }
    
    setSelectedFile(file);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    await onFileUpload(selectedFile, statementType);
    setSelectedFile(null);
  }, [selectedFile, statementType, onFileUpload]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Statement Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('converter.upload.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={statementType === 'bank' ? 'default' : 'outline'}
              onClick={() => setStatementType('bank')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">{t('converter.type.bank')}</span>
            </Button>
            
            <Button
              variant={statementType === 'credit_card' ? 'default' : 'outline'}
              onClick={() => setStatementType('credit_card')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">{t('converter.type.card')}</span>
            </Button>
            
            <Button
              variant={statementType === 'auto' ? 'default' : 'outline'}
              onClick={() => setStatementType('auto')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Zap className="h-6 w-6" />
              <span className="text-sm">{t('converter.type.auto')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {t('converter.upload.dragDrop')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('converter.upload.supportedFormats')}
                </p>
              </div>
              
              <input
                type="file"
                accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.ofx"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              
              <label htmlFor="file-upload">
                <Button variant="outline" disabled={isProcessing} asChild>
                  <span className="cursor-pointer">
                    Selecionar Arquivo
                  </span>
                </Button>
              </label>
              
              {/* Supported formats badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['PDF', 'CSV', 'Excel', 'PNG/JPG', 'OFX'].map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Selected file preview */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('converter.upload.processing')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Processar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-medium">{t('converter.alerts.processing')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Extraindo dados, detectando idioma e moeda, categorizando transações...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};