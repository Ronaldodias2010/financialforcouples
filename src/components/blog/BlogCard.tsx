import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, FileText, Video, Image } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: string;
  image_url: string | null;
  created_at: string;
}

interface BlogCardProps {
  article: Article;
  index: number;
  categoryColor: string;
}

const categoryLabels: Record<string, Record<string, string>> = {
  planning: { pt: 'Planejamento', en: 'Planning', es: 'Planificación' },
  investments: { pt: 'Investimentos', en: 'Investments', es: 'Inversiones' },
  emergency: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
  analysis: { pt: 'Análise', en: 'Analysis', es: 'Análisis' },
};

const contentTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
};

export const BlogCard = ({ article, index, categoryColor }: BlogCardProps) => {
  const { t, language } = useLanguage();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category]?.[language] || category;
  };

  const truncateDescription = (text: string | null, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Placeholder images for each category
  const placeholderImages: Record<string, string> = {
    planning: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    investments: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    emergency: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop',
    analysis: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/blog/${article.id}`}>
        <article className="group bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img
              src={article.image_url || placeholderImages[article.category] || placeholderImages.planning}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-3 left-3">
              <Badge className={categoryColor}>
                {getCategoryLabel(article.category)}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                {contentTypeIcons[article.content_type] || <FileText className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            
            {article.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {truncateDescription(article.description)}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.created_at)}
              </span>
              <span className="text-primary font-medium group-hover:underline">
                {t('blog.readMore')} →
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};
