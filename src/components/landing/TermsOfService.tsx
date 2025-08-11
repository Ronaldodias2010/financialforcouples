import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowLeft, FileText, CheckCircle, Shield, RotateCcw, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSelector from "@/components/LanguageSelector";

const TermsOfService = () => {
  const { language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const termsContent = {
    pt: {
      title: "Termos de Uso – Couples Financials",
      lastUpdated: "Última atualização: 04 de agosto de 2025",
      intro: "Ao acessar ou utilizar o sistema Couples Financials, você concorda com os seguintes termos:",
      sections: [
        {
          id: "platform-usage",
          icon: <CheckCircle className="h-5 w-5" />,
          title: "1. Uso da Plataforma",
          content: `• Destinada à gestão financeira colaborativa entre casais
• Responsabilidade do usuário pela veracidade dos dados
• Proibido uso indevido ou ilegal`
        },
        {
          id: "access-auth",
          icon: <Shield className="h-5 w-5" />,
          title: "2. Acesso e Autenticação",
          content: `• Login via e-mail e senha
• Senhas temporárias devem ser trocadas no primeiro acesso
• Novo login exigido após redefinição de senha`
        },
        {
          id: "updates-availability",
          icon: <RotateCcw className="h-5 w-5" />,
          title: "3. Atualizações e Disponibilidade",
          content: `• Atualizações automáticas podem ocorrer
• Reservamo-nos o direito de modificar ou encerrar o serviço com aviso prévio`
        },
        {
          id: "responsibility",
          icon: <MessageCircle className="h-5 w-5" />,
          title: "4. Responsabilidade",
          content: `• Não nos responsabilizamos por decisões financeiras tomadas com base nos dados inseridos
• A plataforma é uma ferramenta de apoio, não consultoria`
        },
        {
          id: "support",
          icon: <Phone className="h-5 w-5" />,
          title: "5. Suporte",
          content: `• E-mail de suporte: suporte@couplesfinancials.com`
        }
      ]
    },
    en: {
      title: "Terms of Use – Couples Financials",
      lastUpdated: "Last updated: August 4, 2025",
      intro: "By accessing or using the Couples Financials platform, you agree to the following terms:",
      sections: [
        {
          id: "platform-usage",
          icon: <CheckCircle className="h-5 w-5" />,
          title: "1. Platform Usage",
          content: `• Designed for collaborative financial management between couples
• Users are responsible for the accuracy of the data they provide
• Any illegal, abusive, or fraudulent use is strictly prohibited`
        },
        {
          id: "access-auth",
          icon: <Shield className="h-5 w-5" />,
          title: "2. Access and Authentication",
          content: `• Login is performed via email and password
• Temporary passwords must be changed upon first access
• A new login is required after password reset`
        },
        {
          id: "updates-availability",
          icon: <RotateCcw className="h-5 w-5" />,
          title: "3. Updates and Availability",
          content: `• The platform may undergo automatic updates, especially when used as a PWA
• We reserve the right to modify, suspend, or terminate the service with prior notice`
        },
        {
          id: "responsibility",
          icon: <MessageCircle className="h-5 w-5" />,
          title: "4. Liability",
          content: `• Couples Financials is not responsible for financial decisions made based on user-entered data
• The platform is a support tool, not a financial advisory service`
        },
        {
          id: "support",
          icon: <Phone className="h-5 w-5" />,
          title: "5. Support",
          content: `• Technical support is available via email: support@couplesfinancials.com`
        }
      ]
    }
  };

  const content = termsContent[language as keyof typeof termsContent] || termsContent.pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {language === 'pt' ? 'Voltar' : 'Back'}
            </Button>
          </Link>
          <LanguageSelector />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              {content.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mb-8">{content.lastUpdated}</p>
          <p className="text-lg leading-relaxed max-w-3xl mx-auto">{content.intro}</p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {content.sections.map((section) => (
            <Card key={section.id} className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-accent/10 transition-colors duration-200 rounded-t-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {section.icon}
                    </div>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  {expandedSections.includes(section.id) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                {expandedSections.includes(section.id) && (
                  <div className="px-6 pb-6 animate-accordion-down">
                    <div className="ml-14 pt-4 border-t border-border/30">
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {section.content.split('\n').map((line, index) => (
                          <p key={index} className="mb-2 leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Phone className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">
                  {language === 'pt' ? 'Precisa de Suporte?' : 'Need Support?'}
                </h3>
              </div>
              <p className="text-muted-foreground mb-6">
                {language === 'pt' 
                  ? 'Entre em contato conosco para esclarecer dúvidas sobre os termos de uso.'
                  : 'Contact us to clarify any questions about the terms of use.'
                }
              </p>
              <Button asChild>
                <a href="mailto:suporte@couplesfinancials.com">
                  {language === 'pt' ? 'Contatar Suporte' : 'Contact Support'}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;