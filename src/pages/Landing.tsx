import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  DollarSign, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  CreditCard,
  Target,
  PieChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Gestão Financeira para Casais",
      description: "Compartilhe despesas, metas e sonhos financeiros de forma transparente e organizada."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Controle de Investimentos",
      description: "Acompanhe seus investimentos e veja o crescimento do patrimônio do casal em tempo real."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Gestão de Cartões",
      description: "Controle todos os cartões do casal, limites, faturas e programa de milhas."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Metas Financeiras",
      description: "Definam e acompanhem metas financeiras juntos, desde a viagem dos sonhos até a casa própria."
    },
    {
      icon: <PieChart className="h-6 w-6" />,
      title: "Relatórios Detalhados",
      description: "Visualize gastos por categoria, evolução patrimonial e análises personalizadas."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Segurança Total",
      description: "Seus dados financeiros protegidos com criptografia de nível bancário."
    }
  ];

  const testimonials = [
    {
      name: "Carlos & Marina",
      role: "Casal há 5 anos",
      content: "Finalmente conseguimos organizar nossas finanças de forma transparente. Agora sabemos exatamente onde estamos gastando e conseguimos economizar para nossos sonhos!",
      rating: 5
    },
    {
      name: "Roberto & Ana",
      role: "Recém-casados",
      content: "O app revolucionou a forma como lidamos com dinheiro. Antes brigávamos por causa das finanças, agora temos tudo organizado e planejado.",
      rating: 5
    },
    {
      name: "Pedro & Lucia",
      role: "Juntos há 8 anos",
      content: "A funcionalidade de metas nos ajudou a comprar nosso primeiro apartamento. Recomendamos para todos os casais!",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para começar",
      features: [
        "Gestão básica de despesas",
        "Até 2 cartões por pessoa",
        "Relatórios mensais",
        "Suporte por email"
      ],
      popular: false
    },
    {
      name: "Premium",
      price: "R$ 19,90",
      period: "/mês",
      description: "Para casais que querem mais",
      features: [
        "Gestão ilimitada de cartões",
        "Controle de investimentos",
        "Relatórios avançados",
        "Metas financeiras personalizadas",
        "Suporte prioritário",
        "Exportação de dados"
      ],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
              alt="Couples Financials" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Couples Financials
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button 
                onClick={() => navigate('/app')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Voltar ao App
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/app')}
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate('/app')}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Começar Gratuitamente
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
              alt="Couples Financials" 
              className="h-32 w-32 object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Finanças a Dois
            </span>
            <br />
            <span className="text-foreground">Sem Complicações</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A primeira plataforma brasileira criada especialmente para casais 
            organizarem suas finanças, compartilharem gastos e realizarem sonhos juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/app')}
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-4"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 border-primary/20 hover:bg-primary/5"
            >
              Ver Como Funciona
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>100% Gratuito para começar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Setup em 2 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Tudo que vocês precisam para
              <span className="bg-gradient-secondary bg-clip-text text-transparent"> prosperar juntos</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas completas para casais que querem ter controle total sobre suas finanças
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-card-border hover:shadow-gold transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Mais de <span className="bg-gradient-primary bg-clip-text text-transparent">1.000 casais</span> já organizaram suas finanças
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja o que nossos usuários estão dizendo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-card-border">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-primary fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-card/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Planos que cabem no seu
              <span className="bg-gradient-primary bg-clip-text text-transparent"> orçamento</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece grátis e evolua conforme suas necessidades
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`border-card-border relative ${plan.popular ? 'border-primary shadow-gold' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/app')}
                  >
                    {plan.name === 'Gratuito' ? 'Começar Grátis' : 'Assinar Premium'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para transformar a
              <span className="bg-gradient-primary bg-clip-text text-transparent"> vida financeira</span> de vocês?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a milhares de casais que já organizaram suas finanças e estão realizando seus sonhos juntos.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/app')}
              className="bg-gradient-primary hover:opacity-90 text-lg px-12 py-4"
            >
              <Users className="mr-2 h-5 w-5" />
              Começar Agora - É Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Sem compromisso • Cancele quando quiser • Suporte em português
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
                  alt="Couples Financials" 
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Couples Financials
                </span>
              </div>
              <p className="text-muted-foreground">
                A plataforma que une casais em direção à prosperidade financeira.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Comunidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-card-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Couples Financials. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;