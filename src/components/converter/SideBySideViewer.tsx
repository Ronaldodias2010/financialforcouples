import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useLanguage } from '@/hooks/useLanguage';
import { PDFViewer } from './PDFViewer';
import { ExcelPreview } from './ExcelPreview';
import { ImportedTransaction } from './ConverterDashboard';

interface SideBySideViewerProps {
  pdfFile?: File;
  fileName: string;
  fileType: 'pdf' | 'image' | 'csv' | 'ofx';
  transactions: ImportedTransaction[];
  detectedCurrency: string;
  onTransactionsUpdate?: (transactions: ImportedTransaction[]) => void;
}

export const SideBySideViewer: React.FC<SideBySideViewerProps> = ({
  pdfFile,
  fileName,
  fileType,
  transactions,
  detectedCurrency,
  onTransactionsUpdate
}) => {
  const { t } = useLanguage();
  
  const [showPDF, setShowPDF] = useState(true);
  const [showExcel, setShowExcel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate layout based on what's visible
  const getLayoutConfig = () => {
    if (showPDF && showExcel) {
      return { pdfSize: 50, excelSize: 50 };
    } else if (showPDF && !showExcel) {
      return { pdfSize: 100, excelSize: 0 };
    } else if (!showPDF && showExcel) {
      return { pdfSize: 0, excelSize: 100 };
    }
    return { pdfSize: 50, excelSize: 50 }; // fallback
  };

  const { pdfSize, excelSize } = getLayoutConfig();

  const renderControls = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          Visualização Detalhada
        </Badge>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center gap-1">
          <Button
            variant={showPDF ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPDF(!showPDF)}
            className="gap-1"
          >
            {showPDF ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            PDF
          </Button>
          
          <Button
            variant={showExcel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowExcel(!showExcel)}
            className="gap-1"
          >
            {showExcel ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            Excel
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="gap-1"
        >
          {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          {isFullscreen ? 'Reduzir' : 'Expandir'}
        </Button>
      </div>
    </div>
  );

  // If neither panel is visible, show a placeholder
  if (!showPDF && !showExcel) {
    return (
      <div className="space-y-4">
        {renderControls()}
        <Card className="h-96">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Nenhum painel visível</p>
              <p className="text-sm text-muted-foreground">
                Use os controles acima para mostrar o PDF ou Excel
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single panel view (when only one is visible)
  if (!showPDF || !showExcel) {
    return (
      <div className="space-y-4">
        {renderControls()}
        
        {showPDF && (
          <PDFViewer
            file={pdfFile}
            fileName={fileName}
            fileType={fileType}
            isCompactMode={false}
          />
        )}
        
        {showExcel && (
          <ExcelPreview
            transactions={transactions}
            detectedCurrency={detectedCurrency}
            fileName={fileName}
            onTransactionsUpdate={onTransactionsUpdate}
            isCompactMode={false}
          />
        )}
      </div>
    );
  }

  // Side-by-side view (desktop)
  const renderDesktopLayout = () => (
    <div className="hidden lg:block space-y-4">
      {renderControls()}
      
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={pdfSize} minSize={30}>
            <div className="h-full">
              <PDFViewer
                file={pdfFile}
                fileName={fileName}
                fileType={fileType}
                isCompactMode={true}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={excelSize} minSize={30}>
            <div className="h-full">
              <ExcelPreview
                transactions={transactions}
                detectedCurrency={detectedCurrency}
                fileName={fileName}
                onTransactionsUpdate={onTransactionsUpdate}
                isCompactMode={true}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );

  // Stacked view (mobile/tablet)
  const renderMobileLayout = () => (
    <div className="lg:hidden space-y-4">
      {renderControls()}
      
      <div className="space-y-4">
        {showPDF && (
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <PanelLeft className="h-4 w-4" />
              PDF Original
            </h3>
            <PDFViewer
              file={pdfFile}
              fileName={fileName}
              fileType={fileType}
              isCompactMode={true}
            />
          </div>
        )}
        
        {showExcel && (
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <PanelRight className="h-4 w-4" />
              Excel Gerado
            </h3>
            <ExcelPreview
              transactions={transactions}
              detectedCurrency={detectedCurrency}
              fileName={fileName}
              onTransactionsUpdate={onTransactionsUpdate}
              isCompactMode={true}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderDesktopLayout()}
      {renderMobileLayout()}
    </div>
  );
};