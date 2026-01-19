import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { Helmet } from 'react-helmet';
import { Loader2, ArrowLeft, Download, Share2, Calendar, Tag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';

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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [article, setArticle] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.2);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

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

  const handleDownload = () => {
    if (!article?.file_url) return;
    const link = document.createElement('a');
    link.href = article.file_url;
    link.download = article.file_name || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const openInNewTab = () => {
    if (article?.file_url) {
      window.open(article.file_url, '_blank', 'noopener,noreferrer');
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
    <>
      <Helmet>
        <title>{article.title} | Blog Couples Financials</title>
        <meta name="description" content={article.description || ''} />
        <link rel="canonical" href={`https://couplesfinancials.com/blog/${article.id}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description || ''} />
        <meta property="og:url" content={`https://couplesfinancials.com/blog/${article.id}`} />
        <meta property="og:type" content="article" />
        {article.image_url && <meta property="og:image" content={article.image_url} />}
        
        {/* Twitter */}
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description || ''} />
        {article.image_url && <meta name="twitter:image" content={article.image_url} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description,
            "datePublished": article.created_at,
            "url": `https://couplesfinancials.com/blog/${article.id}`,
            "publisher": {
              "@type": "Organization",
              "name": "Couples Financials",
              "logo": {
                "@type": "ImageObject",
                "url": "https://couplesfinancials.com/lovable-uploads/9eec3d41-a87a-4b2e-8e69-7c67c7b0f4cf.png"
              }
            },
            "author": {
              "@type": "Organization",
              "name": "Couples Financials"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/9eec3d41-a87a-4b2e-8e69-7c67c7b0f4cf.png" 
                alt="Couples Financials" 
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg hidden sm:inline">Couples Financials</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/blog">
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
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t('blog.download')}
                  </Button>
                )}
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('blog.share')}
                </Button>
                {article.file_url && (
                  <Button onClick={openInNewTab} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('blog.openNewTab')}
                  </Button>
                )}
              </div>
            </header>

            {/* Content Viewer */}
            <div className="border rounded-lg p-4 bg-card">
              {isPDF && article.file_url && !pdfError && (
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
                      file={article.file_url}
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
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                </div>
              )}

              {isPDF && pdfError && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">{t('blog.pdfError')}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={openInNewTab}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('blog.openNewTab')}
                    </Button>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      {t('blog.download')}
                    </Button>
                  </div>
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
    </>
  );
}
