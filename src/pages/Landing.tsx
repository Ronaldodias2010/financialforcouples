import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Coins,
  Brain,
  Plane,
  Mic,
  Shield,
  Download,
  Sparkles,
  Check,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const copy = {
  pt: {
    // Header
    appName: "Couples Financials",
    accessApp: "Acessar App",
    signIn: "Entrar",

    // Hero
    launchTag: "Lançamento",
    h1: "Couples Financials",
    heroSubtitle: "Controle suas finanças de forma inteligente",
    heroParagraph:
      "Idealizado para casais, mas recomendamos para todos. Planeje, economize e invista com ajuda da IA.",
    ctaPrimary: "Baixe Gratuitamente",
    ctaSecondary: "Experimente a versão com IA por R$ 19,90",
    socialProof: "+10k casais já usam",

    // Benefits
    whyChooseTitle: "Por que escolher o Couples Financials?",
    whyChooseSubtitle: "Recursos inovadores para controle financeiro completo",
    feat1: "Gestão financeira compartilhada ou individual.",
    feat2: "Controle em múltiplas moedas.",
    feat3: "Planejamento inteligente com IA.",
    feat4: "Ferramenta de milhas inteligente.",
    feat5: "Input por voz via WhatsApp.",
    feat6: "Segurança e privacidade garantidas.",

    // Pricing
    pricingTitle: "Escolha o plano ideal para você",
    pricingSubtitle: "Comece gratuitamente e evolua conforme suas necessidades",
    freeTitle: "Gratuito",
    freePrice: "R$ 0,00",
    forever: "para sempre",
    startFree: "Começar Grátis",
    premiumTitle: "Premium com IA",
    premiumPrice: "R$ 19,90",
    perMonth: "/mês",
    mostPopular: "Mais Popular",
    subscribePremium: "Assinar Premium",

    // Assistant section
    assistantTitle: "Fale com seu assistente financeiro",
    assistantSubtitle: "Registre seus gastos usando apenas a voz pelo WhatsApp",
    step1: "Mande uma mensagem de voz",
    step2: "IA processa automaticamente",
    step3: "Confirma e registra",
    voiceBenefits: "Vantagens do input por voz",
    whatsappCTA: "Comece agora pelo WhatsApp",

    // Closing CTA
    closingTitle: "Pronto para transformar sua vida financeira?",
    closingSubtitle:
      "Baixe o Couples Financials e comece a planejar seu futuro hoje mesmo.",
    icon1: "Setup Instantâneo",
    icon2: "IA Financeira",
    icon3: "Resultados Reais",
    usersBadge: "+10.000 usuários",
    ratingBadge: "4.9/5 estrelas",
    secureBadge: "100% seguro",

    // FAQ & Footer
    faqTitle: "FAQ – Couples Financials",
    faqSubtitle:
      "Encontre respostas para as perguntas mais frequentes sobre nossa plataforma.",
    q1: "O que é o Couples Financials?",
    a1:
      "Uma plataforma completa de gestão financeira para casais e também para uso individual.",
    q2: "Como funciona o login com senha temporária?",
    a2:
      "Você recebe um código temporário via e-mail e/ou WhatsApp para acessar com segurança.",
    q3: "Meus dados estão seguros?",
    a3:
      "Sim. Utilizamos criptografia e boas práticas de segurança em toda a plataforma.",
    q4: "Posso usar o sistema offline?",
    a4:
      "Você pode consultar dados offline. Para sincronizar e usar IA, é preciso internet.",
    q5: "Posso integrar com outros sistemas?",
    a5:
      "Estamos trabalhando em integrações. Hoje você pode importar planilhas e usar WhatsApp.",
    stillQuestions: "Ainda tem dúvidas?",
    contactUs: "Entrar em contato",
    product: "Produto",
    support: "Suporte",
    contact: "Contato",
    features: "Recursos",
    prices: "Preços",
    download: "Download",
    help: "Ajuda",
    privacy: "Privacidade",
    terms: "Termos",
    copyright: "Todos os direitos reservados.",
  },
  en: {
    // Header
    appName: "Couples Financials",
    accessApp: "Go to App",
    signIn: "Sign in",

    // Hero
    launchTag: "Launch",
    h1: "Couples Financials",
    heroSubtitle: "Control your finances intelligently",
    heroParagraph:
      "Designed for couples, recommended for everyone. Plan, save and invest with AI.",
    ctaPrimary: "Download Free",
    ctaSecondary: "Try the AI version for R$ 19.90",
    socialProof: "+10k couples already use it",

    // Benefits
    whyChooseTitle: "Why choose Couples Financials?",
    whyChooseSubtitle: "Innovative features for complete financial control",
    feat1: "Shared or individual financial management.",
    feat2: "Multi-currency control.",
    feat3: "Smart planning with AI.",
    feat4: "Smart miles tool.",
    feat5: "Voice input via WhatsApp.",
    feat6: "Guaranteed security and privacy.",

    // Pricing
    pricingTitle: "Choose the ideal plan for you",
    pricingSubtitle: "Start free and scale as you need",
    freeTitle: "Free",
    freePrice: "R$ 0.00",
    forever: "forever",
    startFree: "Start for Free",
    premiumTitle: "Premium with AI",
    premiumPrice: "R$ 19.90",
    perMonth: "/month",
    mostPopular: "Most Popular",
    subscribePremium: "Subscribe to Premium",

    // Assistant section
    assistantTitle: "Talk to your financial assistant",
    assistantSubtitle: "Register your expenses using only your voice through WhatsApp",
    step1: "Send a voice message",
    step2: "AI processes automatically",
    step3: "Confirm and record",
    voiceBenefits: "Benefits of voice input",
    whatsappCTA: "Start now via WhatsApp",

    // Closing CTA
    closingTitle: "Ready to transform your financial life?",
    closingSubtitle:
      "Download Couples Financials and start planning your future today.",
    icon1: "Instant Setup",
    icon2: "Financial AI",
    icon3: "Real Results",
    usersBadge: "+10,000 users",
    ratingBadge: "4.9/5 stars",
    secureBadge: "100% secure",

    // FAQ & Footer
    faqTitle: "FAQ – Couples Financials",
    faqSubtitle:
      "Find answers to the most common questions about our platform.",
    q1: "What is Couples Financials?",
    a1:
      "A complete financial management platform for couples and also for individual use.",
    q2: "How does temporary password login work?",
    a2:
      "You receive a temporary code via email and/or WhatsApp to access securely.",
    q3: "Is my data safe?",
    a3:
      "Yes. We use encryption and security best practices across the platform.",
    q4: "Can I use the system offline?",
    a4:
      "You can view data offline. To sync and use AI, you need an internet connection.",
    q5: "Can I integrate with other systems?",
    a5:
      "We are working on integrations. Today you can import spreadsheets and use WhatsApp.",
    stillQuestions: "Still have questions?",
    contactUs: "Get in touch",
    product: "Product",
    support: "Support",
    contact: "Contact",
    features: "Features",
    prices: "Prices",
    download: "Download",
    help: "Help",
    privacy: "Privacy",
    terms: "Terms",
    copyright: "All rights reserved.",
  },
} as const;

const benefitItems = (t: (typeof copy)[keyof typeof copy]) => [
  { icon: Heart, text: t.feat1 },
  { icon: Coins, text: t.feat2 },
  { icon: Brain, text: t.feat3 },
  { icon: Plane, text: t.feat4 },
  { icon: Mic, text: t.feat5 },
  { icon: Shield, text: t.feat6 },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = copy[language as "pt" | "en"];

  const benefits = benefitItems(t);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex items-center">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[hsl(var(--secondary))]/90 shadow-[var(--shadow-gold)]">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="hidden font-bold sm:inline-block ml-2">{t.appName}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <LanguageSwitcher />
            {user ? (
              <Button onClick={() => navigate("/app")}>{t.accessApp}</Button>
            ) : (
              <Button onClick={() => navigate("/auth")}>{t.signIn}</Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="download" className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container px-4 md:px-6 py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            {/* Left - Copy */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 mb-4">
                <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                  {t.launchTag}
                </Badge>
                <span className="text-white/80 text-sm">{t.socialProof}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white">
                {t.h1}
              </h1>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-white/95">
                {t.heroSubtitle}
              </h2>
              <p className="mt-4 max-w-[620px] text-white/90 md:text-lg">
                {t.heroParagraph}
              </p>

              <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
                <Button
                  size="lg"
                  className="font-semibold text-black"
                  onClick={() => navigate("/auth")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t.ctaPrimary}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))/0.9] text-white"
                  onClick={() => navigate("/subscription")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t.ctaSecondary}
                </Button>
              </div>
            </div>

            {/* Right - Image */}
            <div className="flex justify-center">
              <img
                src="/lovable-uploads/8af57670-ca22-4bb4-8875-dffc196f430c.png"
                alt={language === "pt" ? "Casal usando o aplicativo no sofá" : "Couple using the app on the couch"}
                className="rounded-xl shadow-2xl max-w-full h-auto"
                style={{ maxHeight: 520 }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.whyChooseTitle}
            </h2>
            <p className="mx-auto max-w-[740px] text-muted-foreground md:text-lg">
              {t.whyChooseSubtitle}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, idx) => (
              <Card key={idx} className="border-card-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--secondary))/0.12]">
                      <b.icon className="h-6 w-6 text-[hsl(var(--secondary))]" />
                    </div>
                    <p className="text-base leading-relaxed">{b.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.pricingTitle}
            </h2>
            <p className="mx-auto max-w-[740px] text-muted-foreground md:text-lg">
              {t.pricingSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{t.freeTitle}</h3>
                  <div className="text-4xl font-extrabold mb-1">{t.freePrice}</div>
                  <p className="text-sm text-muted-foreground">{t.forever}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[t.feat1, t.feat2, t.feat6].map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-[hsl(var(--secondary))] mt-1" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                  <Download className="mr-2 h-4 w-4" />
                  {t.startFree}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-[hsl(var(--secondary))]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t.mostPopular}
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{t.premiumTitle}</h3>
                  <div className="text-4xl font-extrabold mb-1">{t.premiumPrice}</div>
                  <p className="text-sm text-muted-foreground">{t.perMonth}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[t.feat1, t.feat2, t.feat3, t.feat4, t.feat5, t.feat6].map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-[hsl(var(--secondary))] mt-1" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full font-semibold"
                  onClick={() => navigate("/subscription")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t.subscribePremium}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WhatsApp Assistant Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            {/* Left: Chat Mock */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
                {t.assistantTitle}
              </h2>
              <p className="text-muted-foreground mb-6">{t.assistantSubtitle}</p>

              <div className="rounded-2xl border border-card-border p-4 bg-card shadow-sm max-w-md">
                <div className="h-8 w-28 rounded bg-[hsl(var(--secondary))/0.15] mb-3" />
                <div className="space-y-3">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm p-3 bg-muted text-foreground">
                    {language === "pt"
                      ? "Oi! Quero registrar: supermercado 120 reais."
                      : "Hi! I want to log: supermarket 120 BRL."}
                  </div>
                  <div className="max-w-[80%] ml-auto rounded-2xl rounded-br-sm p-3 bg-[hsl(var(--secondary))/0.15]">
                    {language === "pt"
                      ? "Entendi. Categoria: Alimentação. Valor: R$ 120,00. Confirmar?"
                      : "Got it. Category: Food. Amount: R$ 120.00. Confirm?"}
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm p-3 bg-muted">
                    {language === "pt" ? "Sim, pode confirmar." : "Yes, confirm it."}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))/0.15] text-sm font-semibold">1</span>
                  <span>{t.step1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))/0.15] text-sm font-semibold">2</span>
                  <span>{t.step2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--secondary))/0.15] text-sm font-semibold">3</span>
                  <span>{t.step3}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="secondary"
                  className="bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))/0.9] text-white"
                  asChild
                >
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <Mic className="mr-2 h-4 w-4" /> {t.whatsappCTA}
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: Voice benefits */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">{t.voiceBenefits}</h3>
              <ul className="space-y-3">
                {[t.feat5, t.feat3, t.feat6].map((line, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-[hsl(var(--secondary))] mt-1" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA Section */}
      <section style={{ background: "var(--gradient-hero)" }}>
        <div className="container px-4 md:px-6 py-16 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t.closingTitle}
          </h2>
          <p className="mt-2 text-white/90 max-w-2xl mx-auto">{t.closingSubtitle}</p>

          <div className="mt-6 flex flex-col gap-3 items-center justify-center sm:flex-row">
            <Button size="lg" className="font-semibold text-black" onClick={() => navigate("/auth")}>
              <Download className="mr-2 h-4 w-4" /> {t.ctaPrimary}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))/0.9] text-white"
              onClick={() => navigate("/subscription")}
            >
              <Sparkles className="mr-2 h-4 w-4" /> {t.ctaSecondary}
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <Star className="h-4 w-4" /> {t.usersBadge}
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <Star className="h-4 w-4" /> {t.ratingBadge}
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <Shield className="h-4 w-4" /> {t.secureBadge}
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-foreground text-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.faqTitle}</h2>
            <p className="mx-auto max-w-[740px] opacity-80 md:text-lg">{t.faqSubtitle}</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[{ q: t.q1, a: t.a1 }, { q: t.q2, a: t.a2 }, { q: t.q3, a: t.a3 }, { q: t.q4, a: t.a4 }, { q: t.q5, a: t.a5 }].map((item, i) => (
                <AccordionItem value={`item-${i + 1}`} key={i}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 text-center">
              <p className="mb-3 font-medium">{t.stillQuestions}</p>
              <Button variant="secondary" className="bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))/0.9] text-white" asChild>
                <a href="mailto:contato@couplesfinancials.com">{t.contactUs}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-[hsl(var(--secondary))]">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">{t.appName}</span>
              </div>
              <p className="text-sm opacity-80 max-w-xs">{t.heroSubtitle}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.product}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#features" className="hover:opacity-100 transition-opacity">{t.features}</a></li>
                <li><a href="#pricing" className="hover:opacity-100 transition-opacity">{t.prices}</a></li>
                <li><a href="#download" className="hover:opacity-100 transition-opacity">{t.download}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.support}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#faq" className="hover:opacity-100 transition-opacity">{t.help}</a></li>
                <li><a href="#faq" className="hover:opacity-100 transition-opacity">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.contact}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="mailto:contato@couplesfinancials.com" className="hover:opacity-100 transition-opacity">contato@couplesfinancials.com</a></li>
                <li><a href="tel:+551199999999" className="hover:opacity-100 transition-opacity">+55 (11) 99999-9999</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 opacity-80">
            <p className="text-sm">© {new Date().getFullYear()} {t.appName}. {t.copyright}</p>
            <div className="flex gap-6 text-sm">
              <a href="#privacy" className="hover:opacity-100 transition-opacity">{t.privacy}</a>
              <a href="#terms" className="hover:opacity-100 transition-opacity">{t.terms}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
