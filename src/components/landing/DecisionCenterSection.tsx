import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scale, Users, Vote, FileCheck, Sparkles, History, ThumbsUp, ThumbsDown, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DecisionCenterSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: t('decisionSection.feature1'),
    },
    {
      icon: History,
      title: t('decisionSection.feature2'),
    },
    {
      icon: Vote,
      title: t('decisionSection.feature3'),
    },
    {
      icon: FileCheck,
      title: t('decisionSection.feature4'),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const mockupVariants = {
    hidden: { opacity: 0, scale: 0.95, rotateY: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.4,
      },
    },
  };

  return (
    <>
      {/* Divider between sections */}
      <div className="relative py-12 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <motion.div 
              className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/50"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('decisionSection.dividerText') || 'Decisões Inteligentes'}</span>
            </motion.div>
            <motion.div 
              className="h-px flex-1 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent"
              initial={{ scaleX: 0, originX: 1 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <section className="py-20 bg-gradient-to-b from-muted/20 via-background to-muted/10 relative overflow-hidden">
        {/* Animated decorative elements */}
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <Crown className="w-4 h-4" />
              {t('decisionSection.badge')}
            </motion.div>
            <motion.h2 
              className="text-3xl md:text-5xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {t('decisionSection.title')}
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t('decisionSection.subtitle')}
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.div className="space-y-6" variants={itemVariants}>
                <h3 className="text-2xl font-bold text-foreground">
                  {t('decisionSection.howItWorks')}
                </h3>
                
                {/* Steps */}
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Card className="p-4 border-l-4 border-l-primary bg-card/80 backdrop-blur-sm cursor-pointer transition-shadow hover:shadow-lg">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          1
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground">{t('decisionSection.step1.title')}</h4>
                          <p className="text-muted-foreground text-sm">
                            {t('decisionSection.step1.description')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Card className="p-4 border-l-4 border-l-secondary bg-card/80 backdrop-blur-sm cursor-pointer transition-shadow hover:shadow-lg">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          2
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground">{t('decisionSection.step2.title')}</h4>
                          <p className="text-muted-foreground text-sm">
                            {t('decisionSection.step2.description')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Card className="p-4 border-l-4 border-l-accent bg-card/80 backdrop-blur-sm cursor-pointer transition-shadow hover:shadow-lg">
                      <div className="flex items-start gap-4">
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          3
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-foreground">{t('decisionSection.step3.title')}</h4>
                          <p className="text-muted-foreground text-sm">
                            {t('decisionSection.step3.description')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Benefits */}
              <motion.div className="space-y-4" variants={itemVariants}>
                <h4 className="text-lg font-semibold text-foreground">
                  {t('decisionSection.benefitsTitle')}
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  {features.map((feature, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center gap-2 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ x: 8 }}
                    >
                      <feature.icon className="w-4 h-4 text-primary" />
                      {feature.title}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
              
              {/* CTA */}
              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-shadow"
                    onClick={() => navigate('/auth')}
                  >
                    <Scale className="w-5 h-5" />
                    {t('decisionSection.cta')}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Decision Mockup */}
            <motion.div 
              className="relative"
              variants={mockupVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.div 
                className="relative rounded-2xl overflow-hidden shadow-elegant bg-gradient-to-br from-card to-card/80 border p-6 space-y-4"
                whileHover={{ 
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  y: -8,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Decision Header */}
                <motion.div 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Scale className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="font-semibold text-foreground">{t('decisionSection.mockup.title')}</span>
                  </div>
                  <motion.span 
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {t('decisionSection.mockup.pending')}
                  </motion.span>
                </motion.div>
                
                {/* Decision Value */}
                <motion.div 
                  className="text-center py-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p className="text-3xl font-bold text-foreground">R$ 45.000</p>
                  <p className="text-sm text-muted-foreground">{t('decisionSection.mockup.estimatedValue')}</p>
                </motion.div>
                
                {/* Pros and Cons */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <Card className="p-3 bg-emerald-50 border-emerald-200 h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{t('decisionSection.mockup.pros')}</span>
                      </div>
                      <ul className="text-xs text-emerald-600 space-y-1">
                        <li>• {t('decisionSection.mockup.pro1')}</li>
                        <li>• {t('decisionSection.mockup.pro2')}</li>
                      </ul>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <Card className="p-3 bg-rose-50 border-rose-200 h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsDown className="w-4 h-4 text-rose-600" />
                        <span className="text-sm font-medium text-rose-700">{t('decisionSection.mockup.cons')}</span>
                      </div>
                      <ul className="text-xs text-rose-600 space-y-1">
                        <li>• {t('decisionSection.mockup.con1')}</li>
                        <li>• {t('decisionSection.mockup.con2')}</li>
                      </ul>
                    </Card>
                  </motion.div>
                </div>
                
                {/* AI Suggestion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                    <div className="flex items-start gap-2">
                      <motion.div 
                        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0"
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-medium text-primary">{t('decisionSection.mockup.aiLabel')}</p>
                        <p className="text-sm text-muted-foreground">{t('decisionSection.mockup.aiSuggestion')}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
                {/* Voting */}
                <motion.div 
                  className="flex items-center justify-center gap-4 pt-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('decisionSection.mockup.waitingVote')}</span>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Floating Premium indicator */}
              <motion.div 
                className="absolute -top-4 -right-4"
                animate={{
                  y: [-8, 8, -8],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Card className="p-3 bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Crown className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-medium">{t('decisionSection.premium')}</span>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DecisionCenterSection;
