import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { Download, X, AlertCircle, Loader2 } from 'lucide-react';

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
      return (
        <div className="relative w-full h-[80vh]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <iframe
            src={content.file_url}
            className="w-full h-full rounded-lg border"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            title={content.title}
          />
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