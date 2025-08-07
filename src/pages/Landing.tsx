import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Globe, 
  Brain, 
  Plane, 
  Mic, 
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  Sparkles,
  Check,
  MessageCircle,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
// Accordion removido temporariamente devido a erro de hook

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [language, setLanguage] = useState('pt');

  const features = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Gestão financeira compartilhada ou individual",
      description: "Controle suas finanças sozinho ou compartilhe com seu parceiro"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Controle em múltiplas moedas",
      description: "Gerencie gastos em diferentes moedas com conversão automática"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Planejamento inteligente com IA",
      description: "Saiba quanto poupar e onde investir com recomendações personalizadas"
    },
    {
      icon: <Plane className="h-6 w-6" />,
      title: "Ferramenta de milhas inteligente",
      description: "Veja promoções e use suas milhas com inteligência"
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "Input por voz via WhatsApp",
      description: "Fale com o robô e registre seus gastos sem digitar"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Segurança e privacidade garantidas",
      description: "Seus dados financeiros protegidos com criptografia avançada"
    }
  ];

  const faqItems = [
    {
      question: "O que é o Couples Financials?",
      answer: "O Couples Financials é uma plataforma completa de gestão financeira especialmente desenvolvida para casais, mas que também funciona perfeitamente para uso individual."
    },
    {
      question: "Como funciona o login com senha temporária?",
      answer: "Para facilitar o acesso, oferecemos login via WhatsApp com código temporário. Basta inserir seu número, receber o código por mensagem e acessar sua conta de forma segura e rápida."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim! Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são protegidos com a mesma tecnologia usada por bancos digitais."
    },
    {
      question: "Posso usar o sistema offline?",
      answer: "O aplicativo funciona offline para consultas básicas, mas para sincronização de dados entre parceiros e recursos de IA é necessária conexão com internet."
    },
    {
      question: "Posso integrar com outros sistemas?",
      answer: "Estamos trabalhando em integrações com os principais bancos e cartões de crédito do Brasil. Por enquanto, oferecemos importação via planilhas e conexão com WhatsApp."
    },
    {
      question: "O sistema é gratuito?",
      answer: "Sim! Oferecemos um plano gratuito completo com todas as funcionalidades básicas. O plano Premium adiciona recursos avançados de IA por apenas R$ 19,90/mês."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <img 
              src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
              alt="Couples Financials" 
              className="h-8 w-8 mr-2"
            />
            <span className="hidden font-bold sm:inline-block">Couples Financials</span>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              >
                🇧🇷 Português
              </Button>
              {user ? (
                <Button onClick={() => navigate("/app")}>
                  Acessar App
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-400 via-green-400 to-green-600">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_700px] items-center">
            <div className="flex flex-col justify-center space-y-4 text-left">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
                  alt="Couples Financials" 
                  className="h-16 w-16"
                />
                <div className="text-white text-sm">
                  <div className="flex items-center space-x-1">
                    <span>⭐</span>
                    <span>Lançamento</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-5xl font-bold tracking-tighter text-white sm:text-6xl xl:text-7xl/none">
                  Couples
                </h1>
                <h1 className="text-5xl font-bold tracking-tighter text-white sm:text-6xl xl:text-7xl/none">
                  Financials
                </h1>
              </div>
              
              <h2 className="text-xl font-semibold text-white/90 sm:text-2xl">
                Controle suas finanças de forma inteligente
              </h2>
              
              <p className="max-w-[600px] text-white/80 md:text-lg">
                Idealizado para casais, mas recomendamos para todos. Planeje, 
                economize e invista com ajuda da IA.
              </p>
              
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  onClick={() => navigate("/auth")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixe Gratuitamente
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-green-600 hover:bg-green-700 text-white border-white/20 font-semibold"
                  onClick={() => navigate("/auth")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Experimente a versão com IA por R$ 19,90
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src="/lovable-uploads/8af57670-ca22-4bb4-8875-dffc196f430c.png"
                  alt="Casal feliz usando o app"
                  className="rounded-lg shadow-2xl max-w-full h-auto"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Por que escolher o <span className="text-yellow-500">Couples</span> <span className="text-green-500">Financials</span>?
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Recursos inovadores para controle financeiro completo
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                        <div className="text-green-600 dark:text-green-400">
                          {feature.icon}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Escolha o plano <span className="text-yellow-500">ideal</span> <span className="text-green-500">para você</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Comece gratuitamente e evolua conforme suas necessidades
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Gratuito</h3>
                  <p className="text-muted-foreground mb-4">Perfeito para começar</p>
                  <div className="text-4xl font-bold mb-2">R$ 0,00</div>
                  <p className="text-sm text-muted-foreground">para sempre</p>
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate("/auth")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-green-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Premium com IA</h3>
                  <p className="text-muted-foreground mb-4">Para quem quer mais inteligência</p>
                  <div className="text-4xl font-bold mb-2">R$ 19,90</div>
                  <p className="text-sm text-muted-foreground">/mês</p>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-black font-semibold" 
                  onClick={() => navigate("/auth")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Assinar Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section - Versão simplificada */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              FAQ – Couples Financials
            </h2>
            <p className="mx-auto max-w-[700px] text-slate-300 md:text-xl">
              Encontre respostas para as perguntas mais frequentes sobre nossa plataforma.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((item, index) => (
              <details 
                key={index} 
                className="border border-slate-700 rounded-lg px-6 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
              >
                <summary className="py-6 cursor-pointer font-semibold text-left hover:text-green-400 transition-colors">
                  {item.question}
                </summary>
                <div className="pb-6 text-slate-300 pl-0">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">Couples Financials</span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs">
                Controle suas finanças de forma inteligente com o Couples Financials.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>contato@couplesfinancials.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>(11) 9999-9999</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>São Paulo, Brasil</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">
              © 2024 Couples Financials. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;