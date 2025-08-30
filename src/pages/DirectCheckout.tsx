import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, CreditCard, Check, ArrowLeft, Eye, EyeOff, Tag, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const DirectCheckout = () => {
  const { t, language, inBrazil } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  
  const sessionToken = searchParams.get('token');

  const isUSD = language !== 'pt' || !inBrazil;
  const monthlyPrice = isUSD ? '$9.90' : 'R$25,90';
  const baseYearlyPrice = isUSD ? '$67.10' : 'R$217,10';
  
  // Calculate displayed price (with promo if applied)
  const getDisplayPrice = () => {
    if (selectedPlan === 'monthly') return monthlyPrice;
    
    if (promoApplied && promoValidation?.valid && promoValidation.discount_type === 'fixed_price') {
      return `R$ ${promoValidation.discount_value?.toFixed(2).replace('.', ',')}`;
    }
    
    return baseYearlyPrice;
  };
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean;
    message?: string;
    discount_value?: number;
    discount_type?: string;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

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

  // Verificar se o usuário está retornando da verificação de email
  useEffect(() => {
    if (sessionToken) {
      // Usuário verificou email e voltou para completar checkout
      const completeCheckoutFlow = async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !sessionData.session) {
            toast({
              title: t('directCheckout.error'),
              description: t('directCheckout.sessionExpired'),
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }

          // Chamar edge function para completar checkout
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            'complete-checkout',
            {
              body: { sessionToken, language, inBrazil }
            }
          );

          if (checkoutError) throw checkoutError;

          if (checkoutData?.url) {
            // Redirecionar para o Stripe Checkout
            window.open(checkoutData.url, '_blank');
            
            toast({
              title: t('directCheckout.paymentProcessing'),
              description: t('directCheckout.paymentRedirect'),
            });
          }
        } catch (error) {
          console.error('Error completing checkout:', error);
          toast({
            title: t('directCheckout.error'),
            description: t('directCheckout.unexpectedError'),
            variant: "destructive",
          });
        }
      };

      completeCheckoutFlow();
    }
  }, [sessionToken, toast, t, navigate]);

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

    let createdToken: string | undefined;

    try {
      // 1. Primeiro criar o checkout session para rastrear carrinho abandonado
      try {
        const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
          'create-checkout-session',
          {
            body: {
              email: formData.email,
              fullName: formData.fullName,
              phone: formData.phone,
              selectedPlan: selectedPlan,
              promoCode: promoApplied ? promoCode : null,
            }
          }
        );
        if (sessionError) {
          console.error('create-checkout-session error:', sessionError);
        } else {
          createdToken = sessionData?.sessionToken;
        }
      } catch (err) {
        console.error('create-checkout-session exception:', err);
        // Não bloquear o fluxo de signup caso falhe o registro do carrinho
      }

      // 2. Criar conta do usuário com redirect personalizado para página de confirmação
      const emailParam = encodeURIComponent(formData.email);
      const checkoutRedirectUrl = `${window.location.origin}/checkout-email-confirmation?email=${emailParam}${createdToken ? `&token=${createdToken}` : ''}`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: checkoutRedirectUrl,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      // O email de confirmação é enviado automaticamente via webhook

      // Tratar casos de erro ou sucesso no signup
      if (signUpError) {
        const lower = signUpError.message?.toLowerCase() || '';
        if (lower.includes('hook') && (lower.includes('timeout') || lower.includes('maximum time'))) {
          toast({
            title: t('directCheckout.accountCreated'),
            description: t('directCheckout.checkEmailToContinue'),
            variant: "default",
          });
          // Redirecionar para a página específica de confirmação de email do checkout
          const redirectUrl = `/checkout-email-confirmation?email=${emailParam}${createdToken ? `&token=${createdToken}` : ''}`;
          navigate(redirectUrl);
          return;
        } else {
          throw signUpError;
        }
      }

      // Se a conta foi criada com sucesso, mostrar mensagem para verificar email
      toast({
        title: t('directCheckout.accountCreated'),
        description: t('directCheckout.checkEmailToContinue'),
        variant: "default",
      });
      
      // Redirecionar para a página específica de confirmação de email do checkout
      const redirectUrl = `/checkout-email-confirmation?email=${emailParam}${createdToken ? `&token=${createdToken}` : ''}`;
      navigate(redirectUrl);
      
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();

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
                src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png"
                alt="Couples Financials"
                className="w-10 h-10"
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
                         {inBrazil ? "Formato: (11) 98765-4321" : t('directCheckout.phoneHelp')}
                       </p>
                     </div>
                     
                     <div>
                       <Label htmlFor="password">{t('directCheckout.password')}</Label>
                       <div className="relative">
                         <Input
                           id="password"
                           type={showPassword ? "text" : "password"}
                           placeholder={t('directCheckout.passwordPlaceholder')}
                           value={formData.password}
                           onChange={handleInputChange}
                           required
                           minLength={6}
                           className="pr-10"
                         />
                         <button
                           type="button"
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                           onClick={() => setShowPassword(!showPassword)}
                         >
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </button>
                       </div>
                     </div>
                     
                     <div>
                       <Label htmlFor="confirmPassword">{t('directCheckout.confirmPassword')}</Label>
                       <div className="relative">
                         <Input
                           id="confirmPassword"
                           type={showConfirmPassword ? "text" : "password"}
                           placeholder={t('directCheckout.confirmPasswordPlaceholder')}
                           value={formData.confirmPassword}
                           onChange={handleInputChange}
                           required
                           className="pr-10"
                         />
                         <button
                           type="button"
                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         >
                           {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </button>
                       </div>
                     </div>
                     </div>

                     <Separator />

                     {/* Promo Code Section - Only for BR users */}
                     {inBrazil && language === 'pt' && (
                       <div className="space-y-4">
                          <Label className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Cupom Promocional (Opcional)
                          </Label>
                         
                         {!promoApplied ? (
                           <div className="flex gap-2">
                              <Input
                                placeholder="Digite seu código promocional"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                disabled={validatingPromo}
                                className="flex-1"
                              />
                             <Button
                               type="button"
                               variant="outline"
                               disabled={!promoCode.trim() || validatingPromo}
                               onClick={async () => {
                                 setValidatingPromo(true);
                                 try {
                                   const { data } = await supabase.functions.invoke('validate-promo-code', {
                                     body: { code: promoCode.trim(), country: 'BR' }
                                   });
                                   setPromoValidation(data);
                                   if (data.valid) {
                                     setPromoApplied(true);
                                     toast({
                                       title: "Código aplicado!",
                                       description: data.message,
                                     });
                                   } else {
                                     toast({
                                       title: "Código inválido",
                                       description: data.message,
                                       variant: "destructive",
                                     });
                                   }
                                 } catch (error) {
                                   toast({
                                     title: "Erro",
                                     description: "Erro ao validar código. Tente novamente.",
                                     variant: "destructive",
                                   });
                                 } finally {
                                   setValidatingPromo(false);
                                 }
                               }}
                             >
                               {validatingPromo ? 'Validando...' : 'Aplicar Cupom'}
                             </Button>
                           </div>
                         ) : (
                           <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                             <div className="flex items-center gap-2">
                               <Check className="w-4 h-4 text-green-600" />
                               <span className="text-green-800 font-medium">{promoCode}</span>
                               <span className="text-green-700 text-sm">{promoValidation?.message}</span>
                             </div>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 setPromoApplied(false);
                                 setPromoCode('');
                                 setPromoValidation(null);
                               }}
                             >
                               <X className="w-4 h-4" />
                               {t('subscription.removePromo')}
                             </Button>
                           </div>
                         )}
                       </div>
                     )}

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
                                   30% OFF
                                 </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{t('directCheckout.bestValue')}</div>
                            </div>
                             <div className="text-right">
                                {promoApplied && promoValidation?.valid && promoValidation.discount_type === 'fixed_price' ? (
                                  <div>
                                    <div className="text-sm text-muted-foreground line-through">{baseYearlyPrice}</div>
                                    <div className="font-bold text-xl text-green-600">{getDisplayPrice()}</div>
                                    <div className="text-xs text-green-600">Economia: R$ {(217.10 - (promoValidation.discount_value || 0)).toFixed(2).replace('.', ',')}</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-bold text-xl">{getDisplayPrice()}</div>
                                    <div className="text-sm text-muted-foreground">{t('directCheckout.perYear')}</div>
                                  </div>
                                )}
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
                          {t('directCheckout.createAccountButton')} {getDisplayPrice()}
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