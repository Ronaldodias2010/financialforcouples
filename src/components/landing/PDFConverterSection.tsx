import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, CheckCircle, Zap, BarChart3 } from "lucide-react";

const PDFConverterSection = () => {
  const { t } = useLanguage();

  return (
    <section 
      className="py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--success) / 0.08), hsl(var(--background) / 0.95))"
      }}
    >
      {/* Decorative elements */}
      <div 
        className="absolute top-16 right-16 w-40 h-40 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)"
        }}
      />
      <div 
        className="absolute bottom-16 left-16 w-28 h-28 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(var(--success) / 0.12), transparent)"
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
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    borderColor: "hsl(var(--primary) / 0.3)",
                    color: "hsl(var(--primary))"
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {t('pdfConverter.badge')}
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                  {t('pdfConverter.title')}{" "}
                  <span className="bg-hero-gradient bg-clip-text text-transparent font-extrabold">
                    {t('pdfConverter.title.highlight')}
                  </span>
                  <span className="text-primary font-extrabold"> e Extratos com{" "}</span>
                  <span className="text-cherry-red font-black text-5xl md:text-6xl uppercase tracking-wider drop-shadow-lg">
                    OCR
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t('pdfConverter.subtitle')}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      borderColor: "hsl(var(--primary) / 0.2)"
                    }}
                  >
                    <Upload 
                      className="w-6 h-6"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('pdfConverter.benefit1.title')}</h3>
                    <p className="text-muted-foreground">{t('pdfConverter.benefit1.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--success) / 0.1)",
                      borderColor: "hsl(var(--success) / 0.3)"
                    }}
                  >
                    <CheckCircle 
                      className="w-6 h-6"
                      style={{ color: "hsl(var(--success))" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('pdfConverter.benefit2.title')}</h3>
                    <p className="text-muted-foreground">{t('pdfConverter.benefit2.description')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: "hsl(var(--accent) / 0.1)",
                      borderColor: "hsl(var(--accent) / 0.2)"
                    }}
                  >
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('pdfConverter.benefit3.title')}</h3>
                    <p className="text-muted-foreground">{t('pdfConverter.benefit3.description')}</p>
                  </div>
                </div>
              </div>

              <Button 
                className="px-8 py-3 text-lg text-white border-0"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success) / 0.9), hsl(var(--accent)))",
                  boxShadow: "0 8px 24px hsl(var(--primary) / 0.25)"
                }}
              >
                {t('pdfConverter.cta')}
              </Button>
            </div>

            {/* Right Column - Visual Mockup */}
            <div className="relative">
              <div className="relative mx-auto max-w-sm">
                {/* Processing Card */}
                <Card 
                  className="p-6 relative overflow-hidden border"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--success) / 0.12), hsl(var(--background)))",
                    borderColor: "hsl(var(--primary) / 0.3)"
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--success) / 0.15), transparent)"
                    }}
                  />
                  <div className="relative space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-full"
                        style={{
                          backgroundColor: "hsl(var(--primary) / 0.15)"
                        }}
                      >
                        <Zap 
                          className="w-5 h-5"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{t('pdfConverter.process.title')}</h4>
                        <p className="text-xs text-muted-foreground">{t('pdfConverter.process.subtitle')}</p>
                      </div>
                    </div>
                    
                    <div 
                      className="rounded-lg p-4 space-y-3 border"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--success) / 0.05))",
                        borderColor: "hsl(var(--success) / 0.2)"
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText 
                          className="w-4 h-4"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                        <span className="font-medium text-sm">{t('pdfConverter.process.step')}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('pdfConverter.process.transactions')}</span>
                          <CheckCircle 
                            className="w-4 h-4"
                            style={{ color: "hsl(var(--success))" }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('pdfConverter.process.accuracy')}</span>
                          <span 
                            className="font-semibold"
                            style={{ color: "hsl(var(--success))" }}
                          >
                            ✓
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div 
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                      >
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)))",
                            width: "85%"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating indicator */}
                <div 
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full animate-pulse"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)))"
                  }}
                >
                  AI
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PDFConverterSection;