import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/landing/ui/badge";
import { Button } from "@/components/landing/ui/button";
import { Card } from "@/components/landing/ui/card";
import { Bell, Plane, Target, Coins } from "lucide-react";

const SmartMileageSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Target className="w-4 h-4 mr-2" />
                {t('smartMileage.badge')}
              </Badge>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('smartMileage.title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('smartMileage.subtitle')}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit1.title')}</h3>
                  <p className="text-muted-foreground">{t('smartMileage.benefit1.description')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Plane className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit2.title')}</h3>
                  <p className="text-muted-foreground">{t('smartMileage.benefit2.description')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit3.title')}</h3>
                  <p className="text-muted-foreground">{t('smartMileage.benefit3.description')}</p>
                </div>
              </div>
            </div>

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              {t('smartMileage.cta')}
            </Button>
          </div>

          {/* Right Column - Visual Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Notification Card */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t('smartMileage.notification.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('smartMileage.notification.subtitle')}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-background/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{t('smartMileage.notification.promotion')}</span>
                      <Plane className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('smartMileage.notification.miles')}</span>
                      <span className="font-semibold text-green-600">{t('smartMileage.notification.savings')}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Floating indicator */}
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse">
                NEW
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartMileageSection;