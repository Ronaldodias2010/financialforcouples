import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink,
  FileText,
  Image,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/use-toast';

interface PDFViewerProps {
  file?: File;
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
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // For now, assume 1 page
  const [isLoading, setIsLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Generate object URL for file
  React.useEffect(() => {
    if (file) {
      setIsLoading(true);
      setViewerError(null);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      // For PDFs, set a timeout to clear loading state if iframe doesn't fire onLoad
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => {
        URL.revokeObjectURL(url);
        clearTimeout(timeout);
      };
    } else {
      setFileUrl(null);
      setIsLoading(false);
    }
  }, [file]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleDownload = useCallback(() => {
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download iniciado',
      description: `Baixando ${fileName}`,
    });
  }, [file, fileName, toast]);

  const handleOpenExternal = useCallback(() => {
    if (!fileUrl) return;
    
    window.open(fileUrl, '_blank');
  }, [fileUrl]);

  const renderPDFViewer = () => {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Nenhum arquivo selecionado</p>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando documento...</p>
          </div>
        </div>
      );
    }

    if (viewerError) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Não foi possível visualizar o documento</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir externamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render different viewers based on file type
    switch (fileType) {
      case 'pdf':
        return (
          <div className="relative h-96 bg-muted/20 rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&zoom=${zoom}`}
              className="w-full h-full border-0"
              title={fileName}
              onLoad={() => {
                setIsLoading(false);
                setViewerError(null);
              }}
              onError={() => {
                setViewerError('Erro ao carregar PDF. Tente fazer download do arquivo.');
                setIsLoading(false);
              }}
            />
          </div>
        );
        
      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-80 object-contain rounded-lg shadow-sm"
              style={{ transform: `scale(${zoom / 100})` }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setViewerError('Erro ao carregar imagem');
                setIsLoading(false);
              }}
            />
          </div>
        );
        
      case 'csv':
      case 'ofx':
        return (
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-primary mx-auto" />
              <div>
                <p className="font-medium mb-2">Arquivo de Dados</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {fileType.toUpperCase()} - {fileName}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Tipo de arquivo não suportado</p>
            </div>
          </div>
        );
    }
  };

  const renderControls = () => (
    <div className="flex items-center justify-between gap-2 p-3 border-t">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 50 || fileType === 'csv' || fileType === 'ofx'}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        
        <Badge variant="secondary" className="min-w-[60px] text-xs">
          {zoom}%
        </Badge>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 200 || fileType === 'csv' || fileType === 'ofx'}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
      </div>

      {fileType === 'pdf' && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <Badge variant="outline" className="text-xs">
            {currentPage}/{totalPages}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!file}
        >
          <Download className="h-3 w-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenExternal}
          disabled={!fileUrl || fileType === 'csv' || fileType === 'ofx'}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`${isCompactMode ? 'h-full' : ''} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {fileType === 'image' ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          <CardTitle className={isCompactMode ? 'text-sm' : 'text-base'}>
            PDF Original
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {fileType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1">
          {renderPDFViewer()}
        </div>
        {renderControls()}
      </CardContent>
    </Card>
  );
};