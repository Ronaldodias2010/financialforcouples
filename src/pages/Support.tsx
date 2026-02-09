import { Mail, Phone, MessageCircle, ArrowLeft, HelpCircle, FileText, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/utils/whatsapp";

const Support = () => {
  const { language } = useLanguage();

  const content = {
    pt: {
      title: "Central de Suporte",
      subtitle: "Estamos aqui para ajudar você e seu parceiro(a) a gerenciar suas finanças com tranquilidade.",
      channels: "Canais de Atendimento",
      email: "E-mail",
      emailDesc: "Resposta em até 24h úteis",
      emailAddr: "contato@couplesfinancials.com",
      whatsapp: "WhatsApp IA Smart",
      whatsappDesc: "Envie receitas e despesas para nossa IA",
      whatsappNum: "(11) 98806-6403",
      phone: "Telefone",
      phoneNum: "(11) 2724-7564",
      phoneDesc: "Seg-Sex, 9h-18h (BRT)",
      faq: "Perguntas Frequentes",
      faqItems: [
        { q: "Como adiciono meu parceiro(a)?", a: "Acesse Perfil > Relacionamento e envie um convite por e-mail." },
        { q: "Posso importar extratos bancários?", a: "Sim! Suportamos CSV, OFX e PDF de diversos bancos." },
        { q: "Como funciona o WhatsApp Smart?", a: "Envie mensagens como 'gastei 50 no mercado' e nossa IA registra automaticamente." },
        { q: "Como cancelo minha assinatura?", a: "Acesse Perfil > Assinatura > Gerenciar e cancele a qualquer momento." },
      ],
      back: "Voltar",
      privacy: "Política de Privacidade",
      terms: "Termos de Uso",
    },
    en: {
      title: "Support Center",
      subtitle: "We're here to help you and your partner manage your finances with peace of mind.",
      channels: "Contact Channels",
      email: "Email",
      emailDesc: "Response within 24 business hours",
      emailAddr: "contact@couplesfinancials.com",
      whatsapp: "WhatsApp AI Smart",
      whatsappDesc: "Send income and expenses to our AI",
      whatsappNum: "+55 11 98806 6403",
      phone: "Phone",
      phoneNum: "(201) 5902401",
      phoneDesc: "Mon-Fri, 9am-6pm (EST)",
      faq: "Frequently Asked Questions",
      faqItems: [
        { q: "How do I add my partner?", a: "Go to Profile > Relationship and send an invite by email." },
        { q: "Can I import bank statements?", a: "Yes! We support CSV, OFX, and PDF from many banks." },
        { q: "How does WhatsApp Smart work?", a: "Send messages like 'spent 50 at grocery' and our AI records it automatically." },
        { q: "How do I cancel my subscription?", a: "Go to Profile > Subscription > Manage and cancel anytime." },
      ],
      back: "Back",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
    },
    es: {
      title: "Centro de Soporte",
      subtitle: "Estamos aquí para ayudarte a ti y a tu pareja a gestionar sus finanzas con tranquilidad.",
      channels: "Canales de Atención",
      email: "Correo",
      emailDesc: "Respuesta en 24 horas hábiles",
      emailAddr: "contact@couplesfinancials.com",
      whatsapp: "WhatsApp IA Smart",
      whatsappDesc: "Envía ingresos y gastos a nuestra IA",
      whatsappNum: "+55 11 98806 6403",
      phone: "Teléfono",
      phoneNum: "(201) 5902401",
      phoneDesc: "Lun-Vie, 9am-6pm (EST)",
      faq: "Preguntas Frecuentes",
      faqItems: [
        { q: "¿Cómo agrego a mi pareja?", a: "Ve a Perfil > Relación y envía una invitación por correo." },
        { q: "¿Puedo importar extractos bancarios?", a: "¡Sí! Soportamos CSV, OFX y PDF de muchos bancos." },
        { q: "¿Cómo funciona WhatsApp Smart?", a: "Envía mensajes como 'gasté 50 en supermercado' y nuestra IA lo registra automáticamente." },
        { q: "¿Cómo cancelo mi suscripción?", a: "Ve a Perfil > Suscripción > Gestionar y cancela en cualquier momento." },
      ],
      back: "Volver",
      privacy: "Política de Privacidad",
      terms: "Términos de Uso",
    },
  };

  const t = content[language as keyof typeof content] || content.pt;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-10">
        {/* Contact Channels */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t.channels}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email */}
            <a
              href={`mailto:${t.emailAddr}`}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{t.email}</h3>
              <p className="text-sm text-muted-foreground">{t.emailDesc}</p>
              <span className="text-sm font-medium text-primary">{t.emailAddr}</span>
            </a>

            {/* WhatsApp */}
            <button
              onClick={() => openWhatsApp(language === 'pt' ? 'Olá! Preciso de suporte.' : 'Hello! I need support.')}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground">{t.whatsapp}</h3>
              <p className="text-sm text-muted-foreground">{t.whatsappDesc}</p>
              <span className="text-sm font-medium text-green-600">{t.whatsappNum}</span>
            </button>

            {/* Phone */}
            <a
              href={`tel:${language === 'pt' ? '+551127247564' : '+12015902401'}`}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">{t.phone}</h3>
              <p className="text-sm text-muted-foreground">{t.phoneDesc}</p>
              <span className="text-sm font-medium text-foreground">{t.phoneNum}</span>
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t.faq}
          </h2>
          <div className="space-y-3">
            {t.faqItems.map((item, i) => (
              <details key={i} className="rounded-xl border border-border bg-card group">
                <summary className="cursor-pointer px-6 py-4 font-medium text-foreground list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-muted-foreground">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer links */}
        <div className="border-t border-border pt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t.privacy}</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t.terms}</Link>
          <span>&copy; {new Date().getFullYear()} Couples Financials</span>
        </div>
      </main>
    </div>
  );
};

export default Support;
