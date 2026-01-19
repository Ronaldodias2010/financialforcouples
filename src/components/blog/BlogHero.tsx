import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, TrendingUp, PiggyBank, Users } from 'lucide-react';

export const BlogHero = () => {
  const { t } = useLanguage();

  const features = [
    { icon: TrendingUp, label: t('blog.hero.feature1') },
    { icon: PiggyBank, label: t('blog.hero.feature2') },
    { icon: Users, label: t('blog.hero.feature3') },
  ];

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">{t('blog.hero.badge')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('blog.hero.title')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {t('blog.hero.description')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span>{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
