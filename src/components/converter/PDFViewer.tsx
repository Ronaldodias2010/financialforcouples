import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, ExternalLink, ChevronLeft, ChevronRight, FileText, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File | null;
  fileName: string;
  fileType: 'pdf' | 'image' | 'csv' | 'ofx';
  isCompactMode?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  fileName,
  fileType,
  isCompactMode = false
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Erro ao carregar PDF. Tente novamente.');
    setIsLoading(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));
  };

  const handleDownload = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenExternal = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const renderPDFViewer = () => {
    if (!file) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-muted/20 rounded-lg border-2 border-dashed">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum arquivo carregado</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] bg-muted/20 rounded-lg border-2 border-dashed">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-2">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Tente fazer upload do arquivo novamente
          </p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar Arquivo
          </Button>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="flex flex-col items-center bg-muted/20 rounded-lg p-4">
            {isLoading && (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="ml-4 text-muted-foreground">Carregando PDF...</p>
              </div>
            )}
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-[600px]">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={zoom}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
            {numPages && (
              <div className="mt-4 flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="relative bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '600px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            )}
            <img
              src={URL.createObjectURL(file)}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom})`,
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('Erro ao carregar imagem');
                setIsLoading(false);
              }}
            />
          </div>
        );

      case 'csv':
      case 'ofx':
        return (
          <div className="flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-lg border-2 border-dashed">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Arquivo {fileType.toUpperCase()} carregado
            </p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderControls = () => {
    if (!file || fileType === 'csv' || fileType === 'ofx') return null;

    return (
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-muted/50 rounded-lg">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="h-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 2.5}
            className="h-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Baixar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenExternal}
            className="h-8"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Abrir</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={`${isCompactMode ? 'h-full' : ''} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {fileType === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          <CardTitle className={isCompactMode ? 'text-sm' : 'text-base'}>
            {fileType === 'pdf' ? 'PDF Original' : 'Arquivo'}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-4">
        {renderPDFViewer()}
        {renderControls()}
      </CardContent>
    </Card>
  );
};
