import { useEffect } from "react";
import { ArrowLeft, Heart, Target, Users, Award } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AboutUsProps {
  onBack?: () => void;
}

const AboutUs = ({ onBack }: AboutUsProps) => {
  const { language } = useLanguage();

  useEffect(() => {
    // SEO optimization for About Us page
    document.title = "Sobre Nós | Couples Financials - Nossa História e Missão";
    
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", "Conheça a história da Couples Financials, a primeira plataforma brasileira especializada em gestão financeira para casais. Nossa missão é ajudar casais a organizarem suas finanças juntos.");
    setMeta("keywords", "sobre couples financials, história empresa, gestão financeira casais, missão valores, equipe");

    // Structured data for Organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Couples Financials",
      "url": "https://couplesfinancials.com",
      "logo": "https://couplesfinancials.com/icons/icon-512x512.png",
      "description": "Primeira plataforma brasileira especializada em gestão financeira para casais",
      "foundingDate": "2024",
      "founder": {
        "@type": "Person",
        "name": "Equipe Couples Financials"
      },
      "sameAs": [
        "https://couplesfinancials.com"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "BR"
      }
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => {
      // Cleanup meta tags when leaving the page
      const metaTags = ['description', 'keywords'];
      metaTags.forEach(name => {
        const el = document.querySelector(`meta[name="${name}"]`);
        if (el) el.remove();
      });
      if (script) script.remove();
    };
  }, []);

  const content = {
    pt: {
      title: "Sobre Nós",
      subtitle: "A primeira plataforma brasileira criada especialmente para casais",
      story: {
        title: "Nossa História",
        description: "Nascemos da necessidade real de casais brasileiros que buscavam uma solução completa para organizar suas finanças de forma colaborativa. Percebemos que o mercado oferecia apenas soluções individuais, mas as finanças em relacionamentos são únicas e merecem ferramentas específicas."
      },
      mission: {
        title: "Nossa Missão",
        description: "Capacitar casais brasileiros a tomarem decisões financeiras inteligentes juntos, promovendo transparência, comunicação e crescimento financeiro mútuo através de tecnologia inovadora e educação financeira especializada."
      },
      values: {
        title: "Nossos Valores",
        items: [
          {
            icon: Heart,
            title: "Relacionamentos Primeiro",
            description: "Acreditamos que relacionamentos saudáveis são a base de uma vida financeira próspera"
          },
          {
            icon: Target,
            title: "Transparência Total",
            description: "Promovemos comunicação aberta e honesta sobre dinheiro entre casais"
          },
          {
            icon: Users,
            title: "Colaboração",
            description: "Desenvolvemos ferramentas que incentivam decisões financeiras em conjunto"
          },
          {
            icon: Award,
            title: "Excelência",
            description: "Buscamos constantemente inovar e melhorar nossa plataforma"
          }
        ]
      },
      team: {
        title: "Nossa Equipe",
        description: "Somos um time apaixonado por tecnologia e relacionamentos, dedicado a criar a melhor experiência possível para casais que querem construir um futuro financeiro sólido juntos."
      },
      cta: "Comece sua jornada financeira conosco"
    },
    en: {
      title: "About Us",
      subtitle: "The first Brazilian platform created especially for couples",
      story: {
        title: "Our Story",
        description: "We were born from the real need of Brazilian couples seeking a complete solution to organize their finances collaboratively. We realized that the market only offered individual solutions, but relationship finances are unique and deserve specific tools."
      },
      mission: {
        title: "Our Mission",
        description: "Empower Brazilian couples to make intelligent financial decisions together, promoting transparency, communication and mutual financial growth through innovative technology and specialized financial education."
      },
      values: {
        title: "Our Values",
        items: [
          {
            icon: Heart,
            title: "Relationships First",
            description: "We believe healthy relationships are the foundation of a prosperous financial life"
          },
          {
            icon: Target,
            title: "Total Transparency",
            description: "We promote open and honest communication about money between couples"
          },
          {
            icon: Users,
            title: "Collaboration",
            description: "We develop tools that encourage joint financial decisions"
          },
          {
            icon: Award,
            title: "Excellence",
            description: "We constantly seek to innovate and improve our platform"
          }
        ]
      },
      team: {
        title: "Our Team",
        description: "We are a team passionate about technology and relationships, dedicated to creating the best possible experience for couples who want to build a solid financial future together."
      },
      cta: "Start your financial journey with us"
    },
    es: {
      title: "Sobre Nosotros",
      subtitle: "La primera plataforma brasileña creada especialmente para parejas",
      story: {
        title: "Nuestra Historia",
        description: "Nacimos de la necesidad real de parejas brasileñas que buscaban una solución completa para organizar sus finanzas de forma colaborativa. Nos dimos cuenta de que el mercado solo ofrecía soluciones individuales, pero las finanzas en relaciones son únicas y merecen herramientas específicas."
      },
      mission: {
        title: "Nuestra Misión",
        description: "Capacitar a las parejas brasileñas para tomar decisiones financieras inteligentes juntas, promoviendo transparencia, comunicación y crecimiento financiero mutuo a través de tecnología innovadora y educación financiera especializada."
      },
      values: {
        title: "Nuestros Valores",
        items: [
          {
            icon: Heart,
            title: "Relaciones Primero",
            description: "Creemos que las relaciones saludables son la base de una vida financiera próspera"
          },
          {
            icon: Target,
            title: "Transparencia Total",
            description: "Promovemos comunicación abierta y honesta sobre dinero entre parejas"
          },
          {
            icon: Users,
            title: "Colaboración",
            description: "Desarrollamos herramientas que incentivan decisiones financieras conjuntas"
          },
          {
            icon: Award,
            title: "Excelencia",
            description: "Buscamos constantemente innovar y mejorar nuestra plataforma"
          }
        ]
      },
      team: {
        title: "Nuestro Equipo",
        description: "Somos un equipo apasionado por la tecnología y las relaciones, dedicado a crear la mejor experiencia posible para parejas que quieren construir un futuro financiero sólido juntos."
      },
      cta: "Comienza tu jornada financiera con nosotros"
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with navigation */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{currentContent.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">{currentContent.subtitle}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Story Section */}
          <section>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {currentContent.story.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {currentContent.story.description}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Mission Section */}
          <section>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {currentContent.mission.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {currentContent.mission.description}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Values Section */}
          <section>
            <h2 className="text-2xl font-semibold text-primary mb-8 text-center">
              {currentContent.values.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {currentContent.values.items.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                          <p className="text-muted-foreground">{value.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Team Section */}
          <section>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {currentContent.team.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {currentContent.team.description}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">
                  {currentContent.cta}
                </h2>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => window.location.href = '/auth'}
                >
                  Cadastre-se Grátis
                </Button>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
};

export default AboutUs;