import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Send, FileText } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImportedFile } from '../ConverterDashboard';

interface ExportPanelProps {
  importedFile: ImportedFile | null;
  onExport: (format: 'excel' | 'csv', includeFiltered: boolean) => Promise<void>;
  onSendToTransactions: () => Promise<void>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  importedFile,
  onExport,
  onSendToTransactions
}) => {
  const { t } = useLanguage();

  if (!importedFile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum arquivo processado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('converter.export.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => onExport('excel', false)}
              className="gap-2 h-16"
              variant="outline"
            >
              <Download className="h-5 w-5" />
              <div>
                <div>{t('converter.export.excel')}</div>
                <div className="text-xs text-muted-foreground">
                  Planilha com formatação
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => onExport('csv', false)}
              className="gap-2 h-16"
              variant="outline"
            >
              <FileText className="h-5 w-5" />
              <div>
                <div>{t('converter.export.csv')}</div>
                <div className="text-xs text-muted-foreground">
                  Arquivo de texto simples
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('converter.actions.sendToTransactions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Enviar transações aprovadas diretamente para seus lançamentos financeiros.
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge>{importedFile.totalTransactions} transações</Badge>
                <Badge variant="secondary">
                  {importedFile.detectedCurrency}
                </Badge>
              </div>
              
              <Button onClick={onSendToTransactions} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar para Lançamentos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};