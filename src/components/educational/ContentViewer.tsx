import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { Download, X, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker (avoids Chrome iframe blocking by rendering inline)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.7.76/build/pdf.worker.min.js';
interface ContentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description: string;
    file_url: string;
    file_name: string;
    file_type: string;
    content_type: string;
  } | null;
}

export const ContentViewer = ({ isOpen, onClose, content }: ContentViewerProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.1);

  if (!content) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = content.file_url;
    link.download = content.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideo = content.content_type === 'video' || 
                  content.file_type?.toLowerCase().includes('video') ||
                  /\.(mp4|webm|ogg|avi|mov)$/i.test(content.file_name);

  const isPDF = content.content_type === 'pdf' || 
                content.file_type?.toLowerCase().includes('pdf') ||
                content.file_name?.toLowerCase().endsWith('.pdf');

  const isImage = content.content_type === 'image' || 
                  content.file_type?.toLowerCase().includes('image') ||
                  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(content.file_name);

  const openInNewTab = () => {
    window.open(content.file_url, '_blank', 'noopener,noreferrer');
  };

  const getPDFViewerUrl = () => {
    // Usar o visualizador PDF.js do navegador quando disponível
    return `https://docs.google.com/gview?url=${encodeURIComponent(content.file_url)}&embedded=true`;
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('educational.viewer.error')}</h3>
          <p className="text-muted-foreground mb-4">{t('educational.viewer.errorDesc')}</p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('educational.download')}
          </Button>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="relative w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <video
            controls
            className="w-full max-h-[70vh] rounded-lg"
            onLoadStart={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          >
            <source src={content.file_url} />
            {t('educational.viewer.videoNotSupported')}
          </video>
        </div>
      );
    }

    if (isPDF) {
      if (pdfError) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('educational.viewer.blocked')}</h3>
              <p className="text-muted-foreground mb-4">{t('educational.viewer.blockedDesc')}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openInNewTab} className="bg-gradient-to-r from-blue-500 to-blue-600">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('educational.viewer.openInNewTab')}
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('educational.download')}
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="relative w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {numPages ? (
                <span>
                  Página {pageNumber} / {numPages}
                </span>
              ) : (
                <span>Carregando...</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>-</Button>
              <Button size="sm" variant="outline" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>+</Button>
              <Button size="sm" variant="outline" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Anterior</Button>
              <Button size="sm" variant="outline" onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))} disabled={!numPages || pageNumber >= numPages}>Próximo</Button>
              <Button size="sm" variant="outline" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('educational.viewer.openInNewTab')}
              </Button>
            </div>
          </div>

          <div className="w-full max-h-[80vh] overflow-auto rounded-lg border p-2">
            <Document
              file={content.file_url}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setLoading(false);
                setPdfError(false);
              }}
              onLoadError={(err) => {
                console.error('PDF render error', err);
                setLoading(false);
                setPdfError(true);
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <img
            src={content.file_url}
            alt={content.title}
            className="max-w-full max-h-[80vh] rounded-lg"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </div>
      );
    }

    // Tipo não suportado para visualização
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('educational.viewer.unsupported')}</h3>
        <p className="text-muted-foreground mb-4">{t('educational.viewer.unsupportedDesc')}</p>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('educational.download')}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{content.title}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('educational.viewer.modalDesc')}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{content.content_type}</Badge>
                <span className="text-sm text-muted-foreground">{content.file_name}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {content.description && (
            <p className="text-sm text-muted-foreground mt-2">{content.description}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('educational.download')}
          </Button>
          <Button onClick={onClose} variant="secondary">
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};