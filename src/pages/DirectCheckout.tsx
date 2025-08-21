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
    phone: "",
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
    const { id, value } = e.target;
    let newValue = value;

    if (id === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (inBrazil) {
        // Format BR phone as (##) #####-####
        const d = digits.slice(0, 11);
        const part1 = d.slice(0, 2);
        const part2 = d.length > 2 ? d.slice(2, 7) : '';
        const part3 = d.length > 7 ? d.slice(7, 11) : '';
        newValue = part1 ? `(${part1}${part1.length === 2 ? ') ' : ''}` : '';
        newValue += part2;
        newValue += part3 ? `-${part3}` : '';
        // Ensure closing parenthesis when area code is complete
        if (newValue && !newValue.includes(')') && part1.length === 2) {
          newValue = `(${part1}) ${part2}${part3 ? `-${part3}` : ''}`;
        }
      } else {
        // Format US phone as (###) ###-####
        const d = digits.slice(0, 10);
        const a = d.slice(0, 3);
        const b = d.length > 3 ? d.slice(3, 6) : '';
        const c = d.length > 6 ? d.slice(6, 10) : '';
        newValue = a ? `(${a}${a.length === 3 ? ') ' : ''}` : '';
        newValue += b;
        newValue += c ? `-${c}` : '';
        if (newValue && !newValue.includes(')') && a.length === 3) {
          newValue = `(${a}) ${b}${c ? `-${c}` : ''}`;
        }
      }
    }

    setFormData({
      ...formData,
      [id]: newValue,
    });
  };

  const proceedWithCheckout = async (user: any) => {
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
        title: t('directCheckout.paymentProcessing'),
        description: t('directCheckout.paymentRedirect'),
      });
      
      // Redirecionar para login após um pequeno delay
      setTimeout(() => {
        navigate('/auth?message=checkout_initiated');
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('directCheckout.error'),
        description: t('directCheckout.passwordMismatch'),
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
            phone: formData.phone,
          }
        }
      });

      // Tratar especificamente o erro de timeout do webhook
      if (signUpError) {
        // Se for timeout do webhook, a conta pode ter sido criada mesmo assim
        const lower = signUpError.message?.toLowerCase() || '';
        if (lower.includes('hook') && lower.includes('timeout')) {
          toast({
            title: t('directCheckout.accountCreated'),
            description: t('directCheckout.webhookTimeoutMessage'),
            variant: "default",
          });
          
          // Tentar fazer login para verificar se a conta foi criada
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          
          if (signInData.user) {
            // Conta foi criada com sucesso, continuar com checkout
            await proceedWithCheckout(signInData.user);
            return;
          } else if (signInError?.message?.toLowerCase().includes('email not confirmed')) {
            // Se o email ainda não está confirmado, orientar o usuário
            navigate('/auth?message=verify_email');
            return;
          } else {
            // Se não conseguiu fazer login, redirecionar para confirmar email
            navigate('/auth?message=verify_email');
            return;
          }
        } else {
          throw signUpError;
        }
      }

      if (signUpData.user) {
        await proceedWithCheckout(signUpData.user);
      }
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();

      // Tratamento especial: timeout do webhook ou email não confirmado
      if ((lower.includes('hook') && lower.includes('timeout')) || lower.includes('email not confirmed')) {
        toast({
          title: t('directCheckout.accountCreated'),
          description: t('directCheckout.webhookTimeoutFallback'),
          variant: "default",
        });
        navigate('/auth?message=verify_email');
        return;
      }

      let errorMessage = t('directCheckout.unexpectedError');
      if (lower.includes('user already registered')) {
        errorMessage = t('directCheckout.emailAlreadyExists');
      } else if (message) {
        errorMessage = message;
      }

      toast({
        title: t('directCheckout.error'),
        description: errorMessage,
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
                {t('directCheckout.back')}
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
                  {t('directCheckout.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('directCheckout.subtitle')}
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('directCheckout.createAccountTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                       <div>
                        <Label htmlFor="fullName">{t('directCheckout.fullName')}</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder={t('directCheckout.fullNamePlaceholder')}
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">{t('directCheckout.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('directCheckout.emailPlaceholder')}
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">{t('directCheckout.phone')}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          placeholder={inBrazil ? "(11) 98765-4321" : t('directCheckout.phonePlaceholder')}
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          maxLength={inBrazil ? 15 : 14}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('directCheckout.phoneHelp')}
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="password">{t('directCheckout.password')}</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder={t('directCheckout.passwordPlaceholder')}
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">{t('directCheckout.confirmPassword')}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder={t('directCheckout.confirmPasswordPlaceholder')}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Plan Selection */}
                    <div className="space-y-4">
                      <Label>{t('directCheckout.selectPlan')}</Label>
                      
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
                              <div className="font-semibold">{t('directCheckout.monthlyPlan')}</div>
                              <div className="text-sm text-muted-foreground">{t('directCheckout.monthlyRenewal')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl">{monthlyPrice}</div>
                              <div className="text-sm text-muted-foreground">{t('directCheckout.perMonth')}</div>
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
                                {t('directCheckout.yearlyPlan')} 
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  25% OFF
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{t('directCheckout.bestValue')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-xl">{yearlyPrice}</div>
                              <div className="text-sm text-muted-foreground">{t('directCheckout.perYear')}</div>
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
                        t('directCheckout.processing')
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('directCheckout.createAccountButton')} {selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice}
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      {t('directCheckout.securePayment')}
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
                    {t('directCheckout.premiumFeatures')}
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
                  <h3 className="font-semibold mb-2">{t('directCheckout.guarantee')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('directCheckout.guaranteeText')}
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
                  <h3 className="font-semibold mb-1">{t('directCheckout.socialProof')}</h3>
                  <div className="flex justify-center mb-2">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('directCheckout.testimonial')}
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