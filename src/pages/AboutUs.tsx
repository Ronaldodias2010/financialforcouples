import { useEffect } from "react";
import { ArrowLeft, Heart, Target, Users, Award, Home } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

interface AboutUsProps {
  onBack?: () => void;
}

const AboutUs = ({ onBack }: AboutUsProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

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

    setMeta("description", "Conheça a história da Couples Financials, a primeira plataforma especializada em gestão financeira para casais. Nossa missão é ajudar casais a organizarem suas finanças juntos.");
    setMeta("keywords", "sobre couples financials, história empresa, gestão financeira casais, missão valores, equipe");

    // Structured data for Organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Couples Financials",
      "url": "https://couplesfinancials.com",
      "logo": "https://couplesfinancials.com/icons/icon-512x512.png",
      "description": "Primeira plataforma especializada em gestão financeira para casais",
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
      subtitle: "A primeira plataforma criada especialmente para casais, porém solteiros podem e devem utilizar!",
      story: {
        title: "Nossa História",
        description: "Nascemos de uma necessidade real. Somos casados há 21 anos e, como casal, buscávamos uma solução completa para organizar nossas finanças. Todo início de mês era marcado por confusão, discussões e brigas. Não entendíamos como dois executivos, com salários elevados, não conseguiam terminar o mês com dinheiro sobrando.\n\nImagina: se era difícil para nós, como seria para quem ganha menos? Sempre discutíamos. Cada um analisava a planilha de gastos do outro, mas ninguém conseguia identificar onde estava o problema.\n\nAté que percebemos: se trabalhássemos juntos, de forma colaborativa, poderíamos resolver essa questão que afetava profundamente nosso relacionamento. No entanto, não encontramos nenhuma ferramenta prática que realmente nos ajudasse.\n\nObservamos que o mercado oferecia apenas soluções individuais. Algumas plataformas até permitiam o controle de gastos em família, mas eram frias, desconectadas da realidade dos casais.\n\nFoi então que decidimos criar nossa própria plataforma — feita sob medida para nossas finanças. Ela nos ajuda a identificar quando estamos no vermelho e, com o apoio de uma inteligência artificial, nos orienta a sair dessa situação e a evitar que ela se repita.\n\nAo implementar essa solução, percebemos que muitos outros casais enfrentavam o mesmo desafio. Assim nasceu a Couples Financials — a melhor plataforma para cuidar do seu dinheiro e construir planos para o futuro, seja em casal ou solteiro."
      },
      mission: {
        title: "Nossa Missão",
        description: "Capacitar casais do mundo todo a tomarem decisões financeiras inteligentes juntos, promovendo transparência, comunicação e crescimento financeiro mútuo através de tecnologia inovadora e educação financeira especializada."
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
        description: "Somos um time que nasceu pequeno, impulsionado por grandes ideias e um propósito claro. Ao longo do caminho, crescemos com dedicação, aprendizados e muita paixão — e hoje estamos prontos para atender com excelência, sensibilidade e inovação.\n\nO que nos move é o amor pela tecnologia e pelos relacionamentos humanos. Cada membro da nossa equipe compartilha o compromisso de criar experiências únicas e transformadoras para casais que desejam construir juntos um futuro financeiro sólido, equilibrado e cheio de significado.\n\nMais do que especialistas, somos apaixonados pelo que fazemos. E é essa paixão que nos conecta, nos fortalece e nos inspira a entregar sempre o melhor."
      },
      cta: "Comece sua jornada financeira conosco",
      ctaButton: "Cadastre-se Grátis",
      backToHome: "Voltar ao Início"
    },
    en: {
      title: "About Us",
      subtitle: "The first platform created especially for couples, but singles can and should use it too!",
      story: {
        title: "Our Story",
        description: "We were born from a real need. We have been married for 21 years and, as a couple, we were looking for a complete solution to organize our finances. Every beginning of the month was marked by confusion, arguments and fights. We didn't understand how two executives, with high salaries, couldn't finish the month with money left over.\n\nImagine: if it was difficult for us, how would it be for those who earn less? We always argued. Each one analyzed the other's expense spreadsheet, but no one could identify where the problem was.\n\nUntil we realized: if we worked together, collaboratively, we could solve this issue that deeply affected our relationship. However, we couldn't find any practical tool that really helped us.\n\nWe observed that the market only offered individual solutions. Some platforms even allowed family expense control, but they were cold, disconnected from the reality of couples.\n\nThat's when we decided to create our own platform — tailor-made for our finances. It helps us identify when we're in the red and, with the support of artificial intelligence, guides us out of this situation and prevents it from happening again.\n\nWhen implementing this solution, we realized that many other couples faced the same challenge. Thus Couples Financials was born — the best platform to take care of your money and build plans for the future, whether as a couple or single."
      },
      mission: {
        title: "Our Mission",
        description: "Empower couples worldwide to make intelligent financial decisions together, promoting transparency, communication and mutual financial growth through innovative technology and specialized financial education."
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
        description: "We are a team that started small, driven by big ideas and a clear purpose. Along the way, we grew with dedication, learning and great passion — and today we are ready to serve with excellence, sensitivity and innovation.\n\nWhat moves us is the love for technology and human relationships. Each member of our team shares the commitment to create unique and transformative experiences for couples who want to build together a solid, balanced and meaningful financial future.\n\nMore than specialists, we are passionate about what we do. And it's this passion that connects us, strengthens us and inspires us to always deliver the best."
      },
      cta: "Start your financial journey with us",
      ctaButton: "Sign Up Free",
      backToHome: "Back to Home"
    },
    es: {
      title: "Sobre Nosotros",
      subtitle: "La primera plataforma creada especialmente para parejas, ¡pero los solteros pueden y deben usarla también!",
      story: {
        title: "Nuestra Historia",
        description: "Nacimos de una necesidad real. Estamos casados desde hace 21 años y, como pareja, buscábamos una solución completa para organizar nuestras finanzas. Cada inicio de mes estaba marcado por confusión, discusiones y peleas. No entendíamos cómo dos ejecutivos, con salarios altos, no podían terminar el mes con dinero sobrante.\n\nImaginen: si era difícil para nosotros, ¿cómo sería para quienes ganan menos? Siempre discutíamos. Cada uno analizaba la hoja de gastos del otro, pero nadie podía identificar dónde estaba el problema.\n\nHasta que nos dimos cuenta: si trabajáramos juntos, de forma colaborativa, podríamos resolver esta cuestión que afectaba profundamente nuestra relación. Sin embargo, no encontramos ninguna herramienta práctica que realmente nos ayudara.\n\nObservamos que el mercado ofrecía solo soluciones individuales. Algunas plataformas incluso permitían el control de gastos familiares, pero eran frías, desconectadas de la realidad de las parejas.\n\nFue entonces cuando decidimos crear nuestra propia plataforma — hecha a medida para nuestras finanzas. Nos ayuda a identificar cuando estamos en números rojos y, con el apoyo de una inteligencia artificial, nos orienta para salir de esta situación y evitar que se repita.\n\nAl implementar esta solución, nos dimos cuenta de que muchas otras parejas enfrentaban el mismo desafío. Así nació Couples Financials — la mejor plataforma para cuidar tu dinero y construir planes para el futuro, ya sea en pareja o soltero."
      },
      mission: {
        title: "Nuestra Misión",
        description: "Capacitar a las parejas de todo el mundo para tomar decisiones financieras inteligentes juntas, promoviendo transparencia, comunicación y crecimiento financiero mutuo a través de tecnología innovadora y educación financiera especializada."
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
        description: "Somos un equipo que comenzó pequeño, impulsado por grandes ideas y un propósito claro. A lo largo del camino, crecimos con dedicación, aprendizaje y mucha pasión — y hoy estamos listos para atender con excelencia, sensibilidad e innovación.\n\n¿Qué nos mueve es el amor por la tecnología y las relaciones humanas. Cada miembro de nuestro equipo comparte el compromiso de crear experiencias únicas y transformadoras para parejas que desean construir juntos un futuro financiero sólido, equilibrado y lleno de significado.\n\nMás que especialistas, somos apasionados por lo que hacemos. Y es esta pasión la que nos conecta, nos fortalece y nos inspira a entregar siempre lo mejor."
      },
      cta: "Comienza tu jornada financiera con nosotros",
      ctaButton: "Regístrate Gratis",
      backToHome: "Volver al Inicio"
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header with navigation */}
      <header className="container mx-auto px-4 py-6">
        {/* Mobile Layout: Buttons first, then text */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Mobile: Buttons row */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile: Text content */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{currentContent.title}</h1>
            <p className="text-base text-muted-foreground mt-2">{currentContent.subtitle}</p>
          </div>
        </div>

        {/* Desktop Layout: Original side by side */}
        <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground truncate">{currentContent.title}</h1>
              <p className="text-lg text-muted-foreground mt-2">{currentContent.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeSwitcher />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Home className="h-4 w-4" />
              <span>{currentContent.backToHome}</span>
            </Button>
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
                <div className="space-y-4">
                  {currentContent.story.description.split('\n\n').map((paragraph, index) => {
                    const isLastParagraph = index === currentContent.story.description.split('\n\n').length - 1;
                    
                    if (isLastParagraph && paragraph.includes('Couples Financials')) {
                      const parts = paragraph.split('Couples Financials');
                      return (
                        <p key={index} className="text-muted-foreground leading-relaxed text-lg">
                          {parts[0]}
                          <strong>Couples Financials</strong>
                          {parts[1]}
                        </p>
                      );
                    }
                    
                    return (
                      <p key={index} className="text-muted-foreground leading-relaxed text-lg">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Couple Photos Section */}
          <section>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square">
                    <img 
                      src="/lovable-uploads/6df94207-a3c6-4ddc-a6db-38566a8247d3.png" 
                      alt="Casal Couples Financials - Momentos especiais juntos"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square">
                    <img 
                      src="/lovable-uploads/ba0734ec-c81a-4476-8d2b-cdc7f71ccefc.png" 
                      alt="Casal Couples Financials - Fundadores da plataforma"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
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
                <div className="space-y-4">
                  {currentContent.team.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground leading-relaxed text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Team Photo Section */}
          <section className="flex justify-center">
            <div className="max-w-xs mx-auto">
              <img 
                src="/lovable-uploads/43f4a76c-d2be-4d8a-873e-ae3335bc61d6.png" 
                alt="Equipe Couples Financials - Nossa equipe unida"
                className="w-full h-auto rounded-lg shadow-lg aspect-[3/4] object-cover"
              />
            </div>
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
                  {currentContent.ctaButton}
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