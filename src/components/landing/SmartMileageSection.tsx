import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/landing/ui/badge";
import { Button } from "@/components/landing/ui/button";
import { Card } from "@/components/landing/ui/card";
import { Bell, Plane, Target, Coins } from "lucide-react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

const SmartMileageSection = () => {
  const { t } = useLanguage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <section 
      className="py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--cherry-light) / 0.08), hsl(var(--blue-soft) / 0.15), hsl(var(--primary) / 0.1), hsl(var(--background) / 0.95))"
      }}
    >
      {/* Decorative elements - mais vibrantes */}
      <div 
        className="absolute top-10 left-10 w-40 h-40 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, hsl(var(--cherry-light) / 0.25), transparent)"
        }}
      />
      <div 
        className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent)"
        }}
      />
      <div 
        className="absolute bottom-10 left-1/4 w-32 h-32 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(var(--blue-soft) / 0.3), transparent)"
        }}
      />
      <div 
        className="absolute bottom-20 right-20 w-24 h-24 rounded-full opacity-35"
        style={{
          background: "radial-gradient(circle, hsl(142 76% 36% / 0.25), transparent)"
        }}
      />
      
      <div className="container mx-auto px-4 relative">
        <div 
          className="mx-auto max-w-6xl rounded-3xl shadow-elegant p-6 md:p-12 border"
          style={{
            background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--cherry-light) / 0.03), hsl(var(--blue-soft) / 0.05))",
            borderColor: "hsl(var(--cherry-light) / 0.15)"
          }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge 
                  variant="secondary" 
                  className="border animate-pulse"
                  style={{
                    backgroundColor: "hsl(var(--cherry-light) / 0.15)",
                    borderColor: "hsl(var(--cherry-light) / 0.4)",
                    color: "hsl(var(--cherry-light))"
                  }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {t('smartMileage.badge')}
                </Badge>
                
                {/* Nova Headline impactante */}
                <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  Você sonha com a{" "}
                  <span 
                    className="bg-clip-text text-transparent font-extrabold"
                    style={{
                      backgroundImage: "linear-gradient(135deg, hsl(var(--cherry-light)), hsl(var(--primary)), hsl(var(--blue-soft)))"
                    }}
                  >
                    viagem
                  </span>
                  .<br />
                  <span className="text-foreground">A </span>
                  <span 
                    className="bg-clip-text text-transparent font-extrabold"
                    style={{
                      backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(142 76% 36%), hsl(var(--blue-soft)))"
                    }}
                  >
                    IA
                  </span>
                  <span className="text-foreground"> cuida das </span>
                  <span 
                    className="bg-clip-text text-transparent font-extrabold"
                    style={{
                      backgroundImage: "linear-gradient(135deg, hsl(45 93% 47%), hsl(var(--cherry-light)), hsl(var(--primary)))"
                    }}
                  >
                    milhas
                  </span>
                  .
                </h2>
                
                {/* Nova Subheadline */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Chega de perder promoções. <span className="font-medium text-foreground">Acompanhe, otimize e use suas milhas</span> no melhor momento — <span style={{ color: "hsl(var(--primary))" }} className="font-semibold">automaticamente</span>.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-xl border shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--cherry-light) / 0.15), hsl(var(--cherry-light) / 0.05))",
                      borderColor: "hsl(var(--cherry-light) / 0.3)"
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
                    className="p-3 rounded-xl border shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--blue-soft) / 0.1))",
                      borderColor: "hsl(var(--primary) / 0.3)"
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
                    className="p-3 rounded-xl border shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, hsl(142 76% 36% / 0.15), hsl(142 76% 36% / 0.05))",
                      borderColor: "hsl(142 76% 36% / 0.3)"
                    }}
                  >
                    <Coins 
                      className="w-6 h-6"
                      style={{ color: "hsl(142 76% 36%)" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('smartMileage.benefit3.title')}</h3>
                    <p className="text-muted-foreground">{t('smartMileage.benefit3.description')}</p>
                  </div>
                </div>
              </div>

              <Button 
                className="px-8 py-4 text-lg text-white border-0 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--cherry-light)), hsl(var(--primary)), hsl(142 76% 36%))",
                  boxShadow: "0 10px 30px hsl(var(--cherry-light) / 0.3)"
                }}
                onClick={() => setShowUpgradeModal(true)}
              >
                {t('smartMileage.cta')}
              </Button>

              <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)}
                feature="smartMileage"
              />
            </div>

            {/* Right Column - Visual Mockup */}
            <div className="relative">
              {/* Decorative glow behind card */}
              <div 
                className="absolute inset-0 blur-3xl opacity-30"
                style={{
                  background: "radial-gradient(ellipse at center, hsl(var(--cherry-light) / 0.4), hsl(var(--primary) / 0.2), transparent)"
                }}
              />
              
              <div className="relative mx-auto max-w-sm">
                {/* Notification Card */}
                <Card 
                  className="p-6 relative overflow-hidden border-2 shadow-xl"
                  style={{
                    background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--cherry-light) / 0.08), hsl(var(--blue-soft) / 0.1))",
                    borderColor: "hsl(var(--cherry-light) / 0.4)"
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent)"
                    }}
                  />
                  <div 
                    className="absolute bottom-0 left-0 w-16 h-16 rounded-full translate-y-8 -translate-x-8"
                    style={{
                      background: "radial-gradient(circle, hsl(142 76% 36% / 0.15), transparent)"
                    }}
                  />
                  
                  <div className="relative space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2.5 rounded-full shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--cherry-light) / 0.2), hsl(var(--cherry-light) / 0.1))"
                        }}
                      >
                        <Bell 
                          className="w-5 h-5"
                          style={{ color: "hsl(var(--cherry-light))" }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{t('smartMileage.notification.title')}</h4>
                        <p className="text-xs" style={{ color: "hsl(142 76% 36%)" }}>{t('smartMileage.notification.subtitle')}</p>
                      </div>
                    </div>
                    
                    <div 
                      className="rounded-xl p-4 space-y-3 border shadow-sm"
                      style={{
                        background: "linear-gradient(145deg, hsl(var(--background)), hsl(var(--blue-soft) / 0.08))",
                        borderColor: "hsl(var(--primary) / 0.2)"
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t('smartMileage.notification.promotion')}</span>
                        <Plane 
                          className="w-5 h-5"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{t('smartMileage.notification.miles')}</span>
                        <span 
                          className="font-bold text-base"
                          style={{ color: "hsl(142 76% 36%)" }}
                        >
                          {t('smartMileage.notification.savings')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating indicator - mais vibrante */}
                <div 
                  className="absolute -top-3 -right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--cherry-light)), hsl(var(--primary)))",
                    boxShadow: "0 4px 15px hsl(var(--cherry-light) / 0.5)"
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