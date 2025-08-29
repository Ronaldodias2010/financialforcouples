import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { Download, Loader2 } from 'lucide-react';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

interface ExportSelectorProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

export const ExportSelector: React.FC<ExportSelectorProps> = ({ 
  onExport, 
  disabled = false,
  className = ""
}) => {
  const { t } = useLanguage();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    try {
      await onExport(selectedFormat);
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto ${className}`}>
      <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder={t('export.selectFormat')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">
            <div className="flex items-center gap-2">
              <span className="text-green-600">📄</span>
              <span>CSV</span>
            </div>
          </SelectItem>
          <SelectItem value="pdf">
            <div className="flex items-center gap-2">
              <span className="text-red-600">📋</span>
              <span>PDF</span>
            </div>
          </SelectItem>
          <SelectItem value="excel">
            <div className="flex items-center gap-2">
              <span className="text-green-700">📊</span>
              <span>Excel</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleExport}
        disabled={disabled || isExporting}
        size="sm"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? t('export.exporting') : t('export.export')}
      </Button>
    </div>
  );
};