import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Loader2, ArrowLeft, Download, Share2, Calendar, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface EducationalContent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  image_url: string | null;
  created_at: string;
  is_active: boolean;
}

const categoryLabels: Record<string, Record<string, string>> = {
  planning: { pt: 'Planejamento', en: 'Planning', es: 'Planificación' },
  investments: { pt: 'Investimentos', en: 'Investments', es: 'Inversiones' },
  emergency: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
  analysis: { pt: 'Análise', en: 'Analysis', es: 'Análisis' },
};

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [article, setArticle] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.2);
  const [pdfError, setPdfError] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const languages = [
    { code: 'pt' as Language, label: 'Português', flag: '🇧🇷' },
    { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
    { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  ];

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | Blog Couples Financials`;
    }
  }, [article?.title]);

  // Reset PDF state when article changes
  useEffect(() => {
    if (article?.id) {
      setPageNumber(1);
      setNumPages(0);
      setPdfError(false);
      setPdfBlobUrl(null);
    }
  }, [article?.id]);

  // Load PDF as blob to avoid CORS issues and hide Supabase URLs
  useEffect(() => {
    const isPdfContent = article?.content_type === 'pdf' || 
      article?.file_type?.toLowerCase().includes('pdf') ||
      article?.file_name?.toLowerCase().endsWith('.pdf');

    if (article?.file_url && isPdfContent) {
      setLoadingPdf(true);
      setPdfError(false);
      
      fetch(article.file_url)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch PDF');
          return response.arrayBuffer();
        })
        .then(buffer => {
          const blob = new Blob([buffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        })
        .catch(err => {
          console.error('Failed to fetch PDF:', err);
          setPdfError(true);
        })
        .finally(() => setLoadingPdf(false));
    }

    // Cleanup blob URL on unmount or article change
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [article?.file_url, article?.content_type, article?.file_type, article?.file_name]);

  // Secure download handler that uses blob
  const handleSecureDownload = async () => {
    if (!article?.file_url) return;
    
    try {
      const response = await fetch(article.file_url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = article.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(t('blog.downloadError') || 'Download failed');
    }
  };

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.title || 'Couples Financials Blog';
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('blog.linkCopied'));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category]?.[language] || category;
  };

  const isPDF = article?.content_type === 'pdf' || 
    article?.file_type?.toLowerCase().includes('pdf') ||
    article?.file_name?.toLowerCase().endsWith('.pdf');

  const isVideo = article?.content_type === 'video' || 
    article?.file_type?.toLowerCase().includes('video') ||
    /\.(mp4|webm|ogg|avi|mov)$/i.test(article?.file_name || '');

  const isImage = article?.content_type === 'image' || 
    article?.file_type?.toLowerCase().includes('image') ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(article?.file_name || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return null;
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/couples-financials-logo-pwa.png" 
              alt="Couples Financials" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/lovable-uploads/couples-financials-icon-512.png";
              }}
            />
            <span className="font-semibold text-lg hidden sm:inline text-foreground">Couples Financials</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Link to="/blog" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('blog.backToList')}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">{t('header.login')}</Button>
            </Link>
          </div>
        </div>
      </nav>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-muted-foreground">
            <ol className="flex items-center gap-2">
              <li><Link to="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
              <li>/</li>
              <li className="text-foreground truncate max-w-[200px]">{article.title}</li>
            </ol>
          </nav>
        </div>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary">{getCategoryLabel(article.category)}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.created_at)}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
              
              {article.description && (
                <p className="text-lg text-muted-foreground">{article.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                {article.file_url && (
                  <Button onClick={handleSecureDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('blog.download')}
                  </Button>
                )}
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('blog.share')}
                </Button>
              </div>
            </header>

            {/* Content Viewer */}
            <div className="border rounded-lg p-4 bg-card">
              {/* PDF Loading State */}
              {isPDF && loadingPdf && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t('blog.loadingPdf') || 'Carregando PDF...'}</p>
                </div>
              )}

              {/* PDF Viewer */}
              {isPDF && pdfBlobUrl && !pdfError && !loadingPdf && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-sm text-muted-foreground">
                      {numPages ? (
                        <span>{t('blog.page')} {pageNumber} / {numPages}</span>
                      ) : (
                        <span>{t('blog.loading')}...</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>-</Button>
                      <Button size="sm" variant="outline" onClick={() => setScale(s => Math.min(2, s + 0.1))}>+</Button>
                      <Button size="sm" variant="outline" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                        {t('nav.previous')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} disabled={!numPages || pageNumber >= numPages}>
                        {t('nav.next')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="w-full max-h-[80vh] overflow-auto rounded-lg border p-2 bg-muted/30">
                    <Document
                      file={pdfBlobUrl}
                      onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages);
                      }}
                      onLoadError={(err) => {
                        console.error('PDF render error', err);
                        setPdfError(true);
                      }}
                      loading={
                        <div className="flex items-center justify-center py-20">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      }
                    >
                      <Page
                        key={`page-${pageNumber}-${scale}`}
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                </div>
              )}

              {/* PDF Error State */}
              {isPDF && pdfError && !loadingPdf && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">{t('blog.pdfError')}</p>
                  <Button onClick={handleSecureDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('blog.download')}
                  </Button>
                </div>
              )}

              {isVideo && article.file_url && (
                <video
                  controls
                  className="w-full max-h-[70vh] rounded-lg"
                >
                  <source src={article.file_url} />
                  {t('blog.videoNotSupported')}
                </video>
              )}

              {isImage && article.file_url && (
                <div className="flex justify-center">
                  <img
                    src={article.file_url}
                    alt={article.title}
                    className="max-w-full max-h-[80vh] rounded-lg"
                  />
                </div>
              )}

              {/* Cover Image */}
              {article.image_url && !article.file_url && (
                <div className="flex justify-center">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </article>

        {/* CTA Section */}
        <section className="bg-primary/5 py-16 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('blog.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{t('blog.ctaDescription')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg">{t('blog.ctaButton')}</Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg">{t('blog.moreArticles')}</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Couples Financials. {t('footer.rights')}</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
            </div>
          </div>
        </footer>
      </div>
  );
}
