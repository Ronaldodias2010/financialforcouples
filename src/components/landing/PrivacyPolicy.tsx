import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowLeft, Shield, Database, UserCheck, FileText, Scale, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import LanguageSelector from "@/components/landing/LanguageSelector";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const privacyContent = {
    pt: {
      title: "Política de Privacidade – Couples Financials",
      lastUpdated: "Última atualização: 10 de agosto de 2025",
      intro: "A plataforma Couples Financials valoriza a privacidade e a segurança dos dados dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações, em conformidade com a LGPD (Lei nº 13.709/2018) e o GDPR (Regulamento UE 2016/679).",
      sections: [
        {
          id: "data-collection",
          icon: <FileText className="h-5 w-5" />,
          title: "1. Informações Coletadas",
          content: `Coletamos dados pessoais e financeiros para oferecer uma experiência personalizada e segura:
• Nome, e-mail, data de nascimento
• Informações financeiras compartilhadas entre casais
• Dados de login e autenticação
• Dados como o número do seu WhatsApp, para conexão com a aplicação, e nosso processo de automação com a IA
• Logs de uso e preferências`
        },
        {
          id: "data-security",
          icon: <Shield className="h-5 w-5" />,
          title: "2. Segurança dos Dados",
          content: `• Criptografia de dados em repouso e em trânsito via Supabase
• Senhas temporárias válidas por 7 dias, eliminadas automaticamente
• Infraestrutura segura hospedada na AWS`
        },
        {
          id: "data-sharing",
          icon: <UserCheck className="h-5 w-5" />,
          title: "3. Compartilhamento de Dados",
          content: `• Não compartilhamos dados com terceiros sem consentimento explícito
• Integrações com n8n são autorizadas pelo usuário
• Dados anonimizados podem ser usados para análises internas`
        },
        {
          id: "data-storage",
          icon: <Database className="h-5 w-5" />,
          title: "4. Armazenamento e Retenção",
          content: `• Os dados são armazenados enquanto a conta estiver ativa
• O usuário pode solicitar a exclusão total dos dados a qualquer momento`
        },
        {
          id: "user-rights",
          icon: <Scale className="h-5 w-5" />,
          title: "5. Direitos do Titular (LGPD & GDPR)",
          content: `Você tem os seguintes direitos:
• Acesso aos seus dados pessoais
• Correção de dados incompletos ou desatualizados
• Portabilidade dos dados
• Revogação do consentimento
• Solicitação de exclusão definitiva

Para exercer seus direitos, envie um e-mail para: privacidade@couplesfinancials.com`
        },
        {
          id: "international-transfer",
          icon: <Globe className="h-5 w-5" />,
          title: "6. Transferência Internacional",
          content: `Seus dados podem ser armazenados em servidores fora do Brasil ou da UE, mas sempre com garantias adequadas de proteção conforme exigido pela LGPD e GDPR.`
        }
      ]
    },
    en: {
      title: "Privacy Policy – Couples Financials",
      lastUpdated: "Last updated: August 10, 2025",
      intro: "Couples Financials is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and safeguard your information, in compliance with the LGPD (Brazilian General Data Protection Law – Law No. 13.709/2018) and the GDPR (EU General Data Protection Regulation – Regulation EU 2016/679).",
      sections: [
        {
          id: "data-collection",
          icon: <FileText className="h-5 w-5" />,
          title: "1. Data We Collect",
          content: `We collect personal and financial data to provide a secure and personalized experience:
• Personal details: name, email, date of birth
• Shared financial data between couples: goals, expenses, income, investments
• Login credentials: email, password (including temporary passwords)
• Data such as your WhatsApp number, to connect to the application, and our automation process with AI
• Usage data: access logs, preferences, automation interactions`
        },
        {
          id: "data-security",
          icon: <Shield className="h-5 w-5" />,
          title: "2. Data Security",
          content: `• All data is encrypted at rest and in transit using Supabase
• Temporary passwords are valid for 7 days and automatically deleted
• Our infrastructure is hosted securely on AWS`
        },
        {
          id: "data-sharing",
          icon: <UserCheck className="h-5 w-5" />,
          title: "3. Data Sharing",
          content: `• We do not sell or share your data with third parties without explicit consent
• Integrated services (e.g., n8n automations) are only activated with user authorization
• Anonymized data may be used for internal analytics and platform improvement`
        },
        {
          id: "data-storage",
          icon: <Database className="h-5 w-5" />,
          title: "4. Data Storage and Retention",
          content: `• Your data is stored as long as your account remains active
• You may request full deletion of your data at any time`
        },
        {
          id: "user-rights",
          icon: <Scale className="h-5 w-5" />,
          title: "5. Your Rights (LGPD & GDPR)",
          content: `You have the right to:
• Access your personal data
• Correct incomplete or outdated information
• Request data portability
• Withdraw consent at any time
• Request permanent deletion of your data

To exercise your rights, contact us at: privacy@couplesfinancials.com`
        },
        {
          id: "international-transfer",
          icon: <Globe className="h-5 w-5" />,
          title: "6. International Data Transfers",
          content: `Your data may be stored on servers outside Brazil or the EU. We ensure appropriate safeguards are in place to protect your data in accordance with LGPD and GDPR requirements.`
        }
      ]
    }
  };

  const content = privacyContent[language === 'pt' ? 'pt' : 'en'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <LanguageSelector />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              {content.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mb-8">{content.lastUpdated}</p>
          <p className="text-lg leading-relaxed max-w-3xl mx-auto">{content.intro}</p>
        </div>

        {/* Privacy Sections */}
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
                <UserCheck className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">
                  {language === 'pt' ? 'Dúvidas sobre Privacidade?' : 'Privacy Questions?'}
                </h3>
              </div>
              <p className="text-muted-foreground mb-6">
                {language === 'pt' 
                  ? 'Entre em contato conosco para exercer seus direitos ou esclarecer dúvidas.'
                  : 'Contact us to exercise your rights or clarify any questions.'
                }
              </p>
              <Button asChild>
                <a href="mailto:privacidade@couplesfinancials.com">
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

export default PrivacyPolicy;