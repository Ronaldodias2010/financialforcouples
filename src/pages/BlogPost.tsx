import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Loader2, Download, Share2, Calendar, Sun, Moon, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { pdfjs } from 'react-pdf';
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
  web_content: string | null;
  created_at: string;
  is_active: boolean;
  // Multilingual fields
  title_pt: string | null;
  title_en: string | null;
  title_es: string | null;
  description_pt: string | null;
  description_en: string | null;
  description_es: string | null;
  web_content_pt: string | null;
  web_content_en: string | null;
  web_content_es: string | null;
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
  
  const [pdfError, setPdfError] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfTextContent, setPdfTextContent] = useState<string[]>([]);
  const [extractingText, setExtractingText] = useState(false);

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

  // Get localized title
  const getLocalizedTitle = (): string => {
    if (!article) return '';
    if (language === 'en' && article.title_en) {
      return article.title_en;
    }
    if (language === 'es' && article.title_es) {
      return article.title_es;
    }
    return article.title_pt || article.title;
  };

  // Get localized description
  const getLocalizedDescription = (): string | null => {
    if (!article) return null;
    if (language === 'en' && article.description_en) {
      return article.description_en;
    }
    if (language === 'es' && article.description_es) {
      return article.description_es;
    }
    return article.description_pt || article.description;
  };

  // Get localized web content
  const getLocalizedWebContent = (): string | null => {
    if (!article) return null;
    if (language === 'en' && article.web_content_en) {
      return article.web_content_en;
    }
    if (language === 'es' && article.web_content_es) {
      return article.web_content_es;
    }
    return article.web_content_pt || article.web_content;
  };

  useEffect(() => {
    if (article) {
      document.title = `${getLocalizedTitle()} | Blog Couples Financials`;
    }
  }, [article, language]);

  // Reset PDF state when article changes
  useEffect(() => {
    if (article?.id) {
      setPageNumber(1);
      setNumPages(0);
      setPdfError(false);
      setPdfBlobUrl(null);
      setPdfTextContent([]);
    }
  }, [article?.id]);

  // Extract text content from PDF using pdfjs
  const extractTextFromPdf = async (pdfUrl: string) => {
    try {
      setExtractingText(true);
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const textPages: string[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (pageText) {
          textPages.push(pageText);
        }
      }
      
      setPdfTextContent(textPages);
      setNumPages(pdf.numPages);
    } catch (err) {
      console.error('Failed to extract PDF text:', err);
    } finally {
      setExtractingText(false);
    }
  };

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
          // Also extract text content for web view
          extractTextFromPdf(url);
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
    const title = getLocalizedTitle() || 'Couples Financials Blog';
    
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

  const localizedWebContent = getLocalizedWebContent();
  const isWebArticle = article?.content_type === 'article' && localizedWebContent;

  const isPDF = !isWebArticle && (article?.content_type === 'pdf' || 
    article?.file_type?.toLowerCase().includes('pdf') ||
    article?.file_name?.toLowerCase().endsWith('.pdf'));

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

  const localizedTitle = getLocalizedTitle();
  const localizedDescription = getLocalizedDescription();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/couples-financials-logo-new.png" 
              alt="Couples Financials" 
              className="h-10 w-10 object-contain"
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
              <li className="text-foreground truncate max-w-[200px]">{localizedTitle}</li>
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
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{localizedTitle}</h1>
              
              {localizedDescription && (
                <p className="text-lg text-muted-foreground">{localizedDescription}</p>
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
              {/* Web Article Content - Native HTML */}
              {isWebArticle && localizedWebContent && (
                <div className="prose prose-lg dark:prose-invert max-w-none p-6">
                  {localizedWebContent.split('\n\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-4 leading-relaxed text-foreground">
                        {paragraph.split('\n').map((line, lineIndex) => (
                          <span key={lineIndex}>
                            {line}
                            {lineIndex < paragraph.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    )
                  ))}
                </div>
              )}

              {/* PDF Loading State */}
              {isPDF && (loadingPdf || extractingText) && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    {extractingText 
                      ? t('blog.extractingText')
                      : t('blog.loadingPdf')}
                  </p>
                </div>
              )}

              {/* PDF Text Content - Web View */}
              {isPDF && !loadingPdf && !extractingText && pdfTextContent.length > 0 && (
                <div className="space-y-6">
                  {/* Page Navigation */}
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-4">
                    <div className="text-sm text-muted-foreground">
                      <span>{t('blog.page')} {pageNumber} / {numPages || pdfTextContent.length}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
                        disabled={pageNumber <= 1}
                      >
                        {t('nav.previous')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setPageNumber(p => Math.min(pdfTextContent.length, p + 1))} 
                        disabled={pageNumber >= pdfTextContent.length}
                      >
                        {t('nav.next')}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Text Content Display */}
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="p-6 bg-muted/20 rounded-lg min-h-[400px]">
                      {pdfTextContent[pageNumber - 1] ? (
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {pdfTextContent[pageNumber - 1]}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic text-center">
                          {t('blog.noTextContent') || 'Esta página não contém texto extraível.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Page Dots/Indicators */}
                  {pdfTextContent.length > 1 && pdfTextContent.length <= 10 && (
                    <div className="flex justify-center gap-2 pt-4">
                      {pdfTextContent.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setPageNumber(index + 1)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            pageNumber === index + 1 
                              ? 'bg-primary' 
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                          aria-label={`Página ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PDF Error State - No text could be extracted */}
              {isPDF && !loadingPdf && !extractingText && pdfTextContent.length === 0 && pdfError && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">{t('blog.pdfError')}</p>
                  <Button onClick={handleSecureDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('blog.download')}
                  </Button>
                </div>
              )}

              {/* Fallback: Still loading but no content yet */}
              {isPDF && !loadingPdf && !extractingText && pdfTextContent.length === 0 && !pdfError && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {t('blog.pdfNoContent') || 'Este PDF não possui texto extraível.'}
                  </p>
                  <Button onClick={handleSecureDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('blog.download')}
                  </Button>
                </div>
              )}

              {/* Video Content */}
              {isVideo && article.file_url && (
                <div className="aspect-video">
                  <video
                    controls
                    className="w-full h-full rounded-lg"
                    src={article.file_url}
                    preload="metadata"
                  >
                    {t('blog.videoNotSupported')}
                  </video>
                </div>
              )}

              {/* Image Content */}
              {isImage && article.file_url && (
                <div className="flex justify-center">
                  <img
                    src={article.file_url}
                    alt={localizedTitle}
                    className="max-w-full h-auto rounded-lg"
                    loading="lazy"
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
                <Button variant="outline" size="lg">{t('blog.backToList')}</Button>
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
