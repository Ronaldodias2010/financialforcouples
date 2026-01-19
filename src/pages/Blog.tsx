import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogHero } from '@/components/blog/BlogHero';
import { Loader2, BookOpen, ArrowLeft, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EducationalContent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: string;
  file_url: string | null;
  image_url: string | null;
  created_at: string;
  is_active: boolean;
}

const categoryColors: Record<string, string> = {
  planning: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  investments: 'bg-green-500/10 text-green-600 dark:text-green-400',
  emergency: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  analysis: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export default function Blog() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [articles, setArticles] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const languages = [
    { code: 'pt' as Language, label: 'Português', flag: '🇧🇷' },
    { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
    { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  ];

  useEffect(() => {
    fetchArticles();
    // Update document title
    document.title = `${t('blog.pageTitle')} | Couples Financials`;
  }, [t]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: t('blog.allCategories') },
    { key: 'planning', label: t('blog.category.planning') },
    { key: 'investments', label: t('blog.category.investments') },
    { key: 'emergency', label: t('blog.category.emergency') },
    { key: 'analysis', label: t('blog.category.analysis') },
  ];

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  const getMetaDescription = () => {
    if (language === 'en') {
      return 'Articles and tips on financial planning, investments and financial management for couples. Learn to organize your money together.';
    }
    if (language === 'es') {
      return 'Artículos y consejos sobre planificación financiera, inversiones y gestión financiera para parejas. Aprende a organizar tu dinero juntos.';
    }
    return 'Artigos e dicas sobre planejamento financeiro, investimentos e gestão de finanças para casais. Aprenda a organizar seu dinheiro a dois.';
  };

  const getCanonicalUrl = () => {
    return 'https://couplesfinancials.com/blog';
  };

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

            <Link to="/" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('blog.backToHome')}
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">{t('header.login')}</Button>
            </Link>
          </div>
        </div>
      </nav>

        {/* Hero */}
        <BlogHero />

        {/* Category Filter */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('blog.noArticles')}</h3>
              <p className="text-muted-foreground">{t('blog.noArticlesDesc')}</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredArticles.map((article, index) => (
                <BlogCard 
                  key={article.id} 
                  article={article} 
                  index={index}
                  categoryColor={categoryColors[article.category] || categoryColors.planning}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* CTA Section */}
        <section className="bg-primary/5 py-16 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('blog.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{t('blog.ctaDescription')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg">{t('blog.ctaButton')}</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg">{t('blog.learnMore')}</Button>
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
