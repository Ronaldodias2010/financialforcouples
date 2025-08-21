import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, CreditCard, Check, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const DirectCheckout = () => {
  const { t, language, inBrazil } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isUSD = language !== 'pt' || !inBrazil;
  const monthlyPrice = isUSD ? '$9.90' : 'R$19,90';
  const yearlyPrice = isUSD ? '$67.10' : 'R$179,80';
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    t('pricing.premium.feature1'),
    t('pricing.premium.feature2'),
    t('pricing.premium.feature3'),
    t('pricing.premium.feature4'),
    t('pricing.premium.feature5'),
    t('pricing.premium.feature6'),
    t('pricing.premium.feature7'),
    t('pricing.premium.feature8'),
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Criar conta do usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // 2. Criar sessão de checkout do Stripe
        const priceId = selectedPlan === 'yearly' 
          ? (isUSD ? 'price_yearly_usd' : 'price_1RsLL5FOhUY5r0H1WIXv7yuP') // yearly price ID
          : (isUSD ? 'price_monthly_usd' : 'price_1RsLL5FOhUY5r0H1WIXv7yuP'); // monthly price ID

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: { priceId }
        });

        if (checkoutError) throw checkoutError;

        if (checkoutData?.url) {
          // Redirecionar para o Stripe Checkout
          window.open(checkoutData.url, '_blank');
          
          toast({
            title: "Conta criada com sucesso!",
            description: "Você será redirecionado para finalizar o pagamento.",
          });
          
          // Redirecionar para login após um pequeno delay
          setTimeout(() => {
            navigate('/auth?message=account_created');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/2f7e7907-5cf5-4262-adbd-04f4dbd3151b.png"
                alt="Couples Financials"
                className="w-8 h-8"
              />
              <span className="font-bold text-lg">Couples Financials</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Form Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Experimente a versão Premium
                </h1>
                <p className="text-muted-foreground">
                  Crie sua conta e tenha acesso imediato a todos os recursos premium
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Criar Conta & Assinar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Seu nome completo"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Digite a senha novamente"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Plan Selection */}
                    <div className="space-y-4">
                      <Label>Selecione seu plano:</Label>
                      
                      <div className="grid gap-3">
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPlan === 'monthly' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPlan('monthly')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">Plano Mensal</div>
                              <div className="text-sm text-muted-foreground">Renovação automática</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl">{monthlyPrice}</div>
                              <div className="text-sm text-muted-foreground">/mês</div>
                            </div>
                          </div>
                        </div>

                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPlan === 'yearly' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPlan('yearly')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                Plano Anual 
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  25% OFF
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">Melhor valor</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl">{yearlyPrice}</div>
                              <div className="text-sm text-muted-foreground">/ano</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={loading}
                    >
                      {loading ? (
                        "Processando..."
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Criar conta e assinar {selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice}
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Pagamento seguro processado pelo Stripe
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Benefits Section */}
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    Recursos Premium Inclusos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Guarantee */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Garantia de 30 dias</h3>
                  <p className="text-sm text-muted-foreground">
                    Se não ficar satisfeito, devolvemos 100% do seu dinheiro em até 30 dias.
                  </p>
                </CardContent>
              </Card>

              {/* Social Proof */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="flex -space-x-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background"></div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background"></div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background"></div>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">+500 casais satisfeitos</h3>
                  <div className="flex justify-center mb-2">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Melhor app para organizar finanças em casal"
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectCheckout;