import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Plane, Target, Coins } from "lucide-react";

const SmartMileageSection = () => {
  const { t } = useLanguage();

  return (
    <section 
      className="py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--blue-soft) / 0.15), hsl(var(--blue-soft) / 0.08), hsl(var(--background) / 0.95))"
      }}
    >
      {/* Decorative elements */}
      <div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(var(--cherry-light) / 0.1), transparent)"
        }}
      />
      <div 
        className="absolute bottom-20 right-10 w-24 h-24 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(var(--blue-soft) / 0.15), transparent)"
        }}
      />
      
      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-6xl bg-card rounded-3xl shadow-elegant p-6 md:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge 
                  variant="secondary" 
                  className="border"
                  style={{
                    backgroundColor: "hsl(var(--cherry-light) / 0.1)",
                    borderColor: "hsl(var(--cherry-light) / 0.3)",
                    color: "hsl(var(--cherry-light))"
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {t('smartMileage.badge')}
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                  {t('smartMileage.title')}{" "}
                  <span className="bg-hero-gradient bg-clip-text text-transparent font-extrabold">
                    {t('smartMileage.title.highlight')}
                  </span>
                  <span className="text-primary font-extrabold"> com IA</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t('smartMileage.subtitle')}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--cherry-light) / 0.1)",
                      borderColor: "hsl(var(--cherry-light) / 0.2)"
                    }}
                  >
                    <Bell 
                      className="w-6 h-6"
                      style={{ color: "hsl(var(--cherry-light))" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit1.title')}</h3>
                    <p className="text-muted-foreground">{t('smartMileage.benefit1.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--blue-soft) / 0.1)",
                      borderColor: "hsl(var(--blue-soft) / 0.3)"
                    }}
                  >
                    <Plane 
                      className="w-6 h-6"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit2.title')}</h3>
                    <p className="text-muted-foreground">{t('smartMileage.benefit2.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      borderColor: "hsl(var(--primary) / 0.2)"
                    }}
                  >
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit3.title')}</h3>
                    <p className="text-muted-foreground">{t('smartMileage.benefit3.description')}</p>
                  </div>
                </div>
              </div>

              <Button 
                className="px-8 py-3 text-lg text-white border-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--cherry-light)), hsl(var(--blue-soft) / 0.9), hsl(var(--primary)))",
                  boxShadow: "0 8px 24px hsl(var(--cherry-light) / 0.25)"
                }}
              >
                {t('smartMileage.cta')}
              </Button>
            </div>

            {/* Right Column - Visual Mockup */}
            <div className="relative">
              <div className="relative mx-auto max-w-sm">
                {/* Notification Card */}
                <Card 
                  className="p-6 relative overflow-hidden border"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--cherry-light) / 0.08), hsl(var(--blue-soft) / 0.12), hsl(var(--background)))",
                    borderColor: "hsl(var(--cherry-light) / 0.3)"
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--blue-soft) / 0.15), transparent)"
                    }}
                  />
                  <div className="relative space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-full"
                        style={{
                          backgroundColor: "hsl(var(--cherry-light) / 0.15)"
                        }}
                      >
                        <Bell 
                          className="w-5 h-5"
                          style={{ color: "hsl(var(--cherry-light))" }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{t('smartMileage.notification.title')}</h4>
                        <p className="text-xs text-muted-foreground">{t('smartMileage.notification.subtitle')}</p>
                      </div>
                    </div>
                    
                    <div 
                      className="rounded-lg p-4 space-y-3 border"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--blue-soft) / 0.05))",
                        borderColor: "hsl(var(--blue-soft) / 0.2)"
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t('smartMileage.notification.promotion')}</span>
                        <Plane 
                          className="w-4 h-4"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('smartMileage.notification.miles')}</span>
                        <span 
                          className="font-semibold"
                          style={{ color: "hsl(var(--success))" }}
                        >
                          {t('smartMileage.notification.savings')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating indicator */}
                <div 
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--cherry-light)), hsl(var(--primary)))"
                  }}
                >
                  NEW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartMileageSection;