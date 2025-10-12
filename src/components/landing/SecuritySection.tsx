import { Shield, Lock, Eye, Server, Award, FileCheck } from 'lucide-react';
import { Button } from '@/components/landing/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import useInView from '@/hooks/use-in-view';

const SecuritySection = () => {
  const { t } = useLanguage();
  const { ref, inView } = useInView({ threshold: 0.1, once: true });

  const securityFeatures = [
    {
      icon: Lock,
      title: t('security.encryption.title'),
      description: t('security.encryption.description'),
      badge: t('security.encryption.badge')
    },
    {
      icon: Shield,
      title: t('security.compliance.title'),
      description: t('security.compliance.description'),
      badge: t('security.compliance.badge')
    },
    {
      icon: Eye,
      title: t('security.zeroAccess.title'),
      description: t('security.zeroAccess.description'),
      badge: t('security.zeroAccess.badge')
    },
    {
      icon: Server,
      title: t('security.backup.title'),
      description: t('security.backup.description'),
      badge: t('security.backup.badge')
    }
  ];

  const certifications = [
    {
      icon: Award,
      name: t('security.certifications.iso27001'),
      status: t('security.certifications.inProgress')
    },
    {
      icon: FileCheck,
      name: t('security.certifications.lgpd'),
      status: t('security.certifications.compliant')
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/5 to-accent/10">
      <div className="container mx-auto px-4" ref={ref as any}>
        <div className={`text-center mb-16 transition-all duration-1000 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Shield className="h-4 w-4" />
            {t('security.badge')}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 py-2 leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t('security.title')}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('security.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className={`group relative p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-card/60 via-secondary/5 to-accent/10 backdrop-blur-sm hover:from-card/90 hover:via-secondary/10 hover:to-accent/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/15 hover:-translate-y-1 hover:border-primary/30 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs bg-gradient-to-r from-primary/20 to-secondary/20 text-primary rounded-full font-medium border border-primary/30">
                  {feature.badge}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center group-hover:from-primary/25 group-hover:to-secondary/25 transition-all duration-300 border border-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className={`bg-gradient-to-br from-card/40 via-secondary/10 to-accent/20 backdrop-blur-sm rounded-2xl p-8 border border-primary/20 shadow-lg shadow-primary/5 transition-all duration-1000 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {t('security.certifications.title')}
              </h3>
              
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-background/60 to-secondary/10 border border-primary/15">
                    <cert.icon className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{cert.name}</div>
                      <div className="text-sm text-muted-foreground">{cert.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <div className="mb-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {t('security.stats.encryption')}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {t('security.stats.encryptionDesc')}
                </div>
                
                <div className="text-2xl font-bold text-foreground mb-1">
                  {t('security.stats.uptime')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('security.stats.uptimeDesc')}
                </div>
              </div>
              
              <Button
                variant="outline"
                className="bg-gradient-to-r from-background/60 to-secondary/20 hover:from-primary/10 hover:to-secondary/30 border-primary/30 hover:border-primary/50 text-primary hover:text-primary"
              >
                {t('security.cta')}
              </Button>
            </div>
          </div>
        </div>

        <div className={`text-center mt-12 transition-all duration-1000 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-sm text-muted-foreground">
            {t('security.disclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;