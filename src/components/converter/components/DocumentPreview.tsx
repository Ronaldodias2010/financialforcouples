import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, DollarSign, MapPin, Hash } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImportedFile } from '../ConverterDashboard';

interface DocumentPreviewProps {
  importedFile: ImportedFile;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ importedFile }) => {
  const { t } = useLanguage();

  const getRegionFlag = (region: string | null) => {
    const flags: Record<string, string> = {
      BR: '🇧🇷',
      US: '🇺🇸',
      MX: '🇲🇽',
      AR: '🇦🇷',
      CL: '🇨🇱',
      CO: '🇨🇴',
      PE: '🇵🇪',
      UY: '🇺🇾',
      ES: '🇪🇸',
      PT: '🇵🇹',
    };
    return flags[region || ''] || '🌍';
  };

  const getLanguageFlag = (language: 'pt' | 'en' | 'es') => {
    const flags = {
      pt: '🇧🇷',
      en: '🇺🇸',
      es: '🇪🇸',
    };
    return flags[language] || '🌍';
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      BRL: 'R$',
      USD: '$',
      EUR: '€',
      MXN: '$',
      ARS: '$',
      CLP: '$',
      COP: '$',
      PEN: 'S/',
      UYU: '$',
    };
    return symbols[currency] || currency;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informações do Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* File Info */}
          <div className="space-y-1 sm:space-y-2 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">Arquivo</span>
            </div>
            <div>
              <p className="font-mono text-xs sm:text-sm truncate">{importedFile.fileName}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {importedFile.fileType.toUpperCase()} • {(importedFile.fileSize / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Language Detection */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{t('converter.detection.language')}</span>
            </div>
            <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs">
              <span>{getLanguageFlag(importedFile.detectedLanguage)}</span>
              <span>{importedFile.detectedLanguage.toUpperCase()}</span>
            </Badge>
          </div>

          {/* Currency Detection */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{t('converter.detection.currency')}</span>
            </div>
            <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs">
              <span>{getCurrencySymbol(importedFile.detectedCurrency)}</span>
              <span>{importedFile.detectedCurrency}</span>
            </Badge>
          </div>

          {/* Region Detection */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{t('converter.detection.region')}</span>
            </div>
            <Badge variant="secondary" className="gap-1 sm:gap-2 text-xs">
              <span>{getRegionFlag(importedFile.detectedRegion)}</span>
              <span>{importedFile.detectedRegion || 'Unknown'}</span>
            </Badge>
          </div>
        </div>

        <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{t('converter.detection.transactions')}</span>
            </div>
            <Badge variant="default" className="text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
              {importedFile.totalTransactions}
            </Badge>
          </div>
        </div>

        {/* Processing Status */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs sm:text-sm font-medium">Status do Processamento</span>
            <Badge 
              variant={
                importedFile.processingStatus === 'completed' ? 'default' :
                importedFile.processingStatus === 'error' ? 'destructive' :
                'secondary'
              }
              className="text-xs"
            >
              {importedFile.processingStatus === 'completed' ? 'Concluído' :
               importedFile.processingStatus === 'error' ? 'Erro' :
               importedFile.processingStatus === 'processing' ? 'Processando...' :
               'Pendente'
              }
            </Badge>
          </div>
          
          {importedFile.processingError && (
            <p className="text-xs sm:text-sm text-destructive mt-2">
              {importedFile.processingError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};