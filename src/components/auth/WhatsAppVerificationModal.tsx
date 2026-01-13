import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, MessageCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface WhatsAppVerificationModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  userId: string;
}

// Função para normalizar telefone para formato canônico
const normalizePhone = (rawPhone: string): string => {
  if (!rawPhone) return '';
  let phone = rawPhone.replace(/\D/g, ''); // Remove tudo que não é número
  phone = phone.replace(/^0+/, ''); // Remove zeros à esquerda
  
  // Se não começa com 55 e tem 10-11 dígitos (DDD + número), adiciona 55
  if (!phone.startsWith('55') && phone.length >= 10 && phone.length <= 11) {
    phone = '55' + phone;
  }
  
  return phone;
};

// Schema de validação
const phoneSchema = z.string()
  .min(10, 'Número muito curto')
  .max(15, 'Número muito longo')
  .regex(/^\d+$/, 'Apenas números');

export const WhatsAppVerificationModal = ({ isOpen, onSuccess, userId }: WhatsAppVerificationModalProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'verify' | 'success'>('phone');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const text = {
    pt: {
      title: '📱 Verificar WhatsApp',
      subtitle: 'Para usar o assistente financeiro via WhatsApp, precisamos verificar seu número.',
      phoneLabel: 'Número de telefone (com DDD)',
      phonePlaceholder: '11 99999-9999',
      phoneHint: 'Usaremos este número para receber suas transações via WhatsApp',
      continueButton: 'Continuar',
      verifyTitle: '🔐 Código de Verificação',
      verifyDescription: 'Enviamos um código para seu WhatsApp. Digite-o abaixo:',
      verifyButton: 'Verificar',
      resendButton: 'Reenviar código',
      resendIn: 'Reenviar em',
      successTitle: '✅ Verificado!',
      successDescription: 'Seu WhatsApp foi verificado com sucesso. Agora você pode enviar transações diretamente pelo WhatsApp!',
      startButton: 'Começar a usar',
      invalidPhone: 'Por favor, insira um telefone válido',
      invalidCode: 'Código inválido. Tente novamente.',
      codeSent: 'Código enviado para seu WhatsApp!',
      error: 'Erro ao processar. Tente novamente.',
      whyNeeded: 'Por que precisamos disso?',
      whyExplanation: 'O WhatsApp é seu canal direto para registrar gastos. Basta enviar "Gastei 50 no mercado" e registramos automaticamente!'
    },
    en: {
      title: '📱 Verify WhatsApp',
      subtitle: 'To use the financial assistant via WhatsApp, we need to verify your number.',
      phoneLabel: 'Phone number (with area code)',
      phonePlaceholder: '11 99999-9999',
      phoneHint: 'We will use this number to receive your transactions via WhatsApp',
      continueButton: 'Continue',
      verifyTitle: '🔐 Verification Code',
      verifyDescription: 'We sent a code to your WhatsApp. Enter it below:',
      verifyButton: 'Verify',
      resendButton: 'Resend code',
      resendIn: 'Resend in',
      successTitle: '✅ Verified!',
      successDescription: 'Your WhatsApp has been verified successfully. Now you can send transactions directly via WhatsApp!',
      startButton: 'Start using',
      invalidPhone: 'Please enter a valid phone number',
      invalidCode: 'Invalid code. Please try again.',
      codeSent: 'Code sent to your WhatsApp!',
      error: 'Error processing. Please try again.',
      whyNeeded: 'Why do we need this?',
      whyExplanation: 'WhatsApp is your direct channel to record expenses. Just send "Spent 50 at the market" and we automatically register it!'
    },
    es: {
      title: '📱 Verificar WhatsApp',
      subtitle: 'Para usar el asistente financiero por WhatsApp, necesitamos verificar tu número.',
      phoneLabel: 'Número de teléfono (con código de área)',
      phonePlaceholder: '11 99999-9999',
      phoneHint: 'Usaremos este número para recibir tus transacciones por WhatsApp',
      continueButton: 'Continuar',
      verifyTitle: '🔐 Código de Verificación',
      verifyDescription: 'Enviamos un código a tu WhatsApp. Ingrésalo abajo:',
      verifyButton: 'Verificar',
      resendButton: 'Reenviar código',
      resendIn: 'Reenviar en',
      successTitle: '✅ ¡Verificado!',
      successDescription: '¡Tu WhatsApp ha sido verificado con éxito! Ahora puedes enviar transacciones directamente por WhatsApp.',
      startButton: 'Comenzar a usar',
      invalidPhone: 'Por favor, ingresa un teléfono válido',
      invalidCode: 'Código inválido. Intenta de nuevo.',
      codeSent: '¡Código enviado a tu WhatsApp!',
      error: 'Error al procesar. Intenta de nuevo.',
      whyNeeded: '¿Por qué necesitamos esto?',
      whyExplanation: '¡WhatsApp es tu canal directo para registrar gastos! Solo envía "Gasté 50 en el mercado" y lo registramos automáticamente.'
    }
  };

  const t = text[language as keyof typeof text] || text.pt;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePhoneSubmit = async () => {
    // Validar telefone
    const cleanPhone = phone.replace(/\D/g, '');
    try {
      phoneSchema.parse(cleanPhone);
    } catch {
      toast({
        title: t.invalidPhone,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      
      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Salvar verificação pendente no banco
      const { error: verifyError } = await supabase
        .from('phone_verifications')
        .insert({
          phone_number: normalizedPhone,
          verification_code: code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
        });

      if (verifyError) {
        console.error('Error creating verification:', verifyError);
        throw verifyError;
      }

      // TODO: Integrar com serviço de envio de WhatsApp
      // Por enquanto, mostrar o código no console para teste
      console.log('[DEV] Código de verificação:', code);

      toast({
        title: t.codeSent,
        description: `Código enviado para ${normalizedPhone}`
      });

      setCountdown(60); // 60 segundos para reenviar
      setStep('verify');
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: t.error,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: t.invalidCode,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);

      // Verificar código no banco
      const { data: verification, error: fetchError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', normalizedPhone)
        .eq('verification_code', verificationCode)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verification) {
        toast({
          title: t.invalidCode,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Marcar como verificado
      await supabase
        .from('phone_verifications')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', verification.id);

      // Atualizar profile com telefone normalizado e data de verificação
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone_number: normalizedPhone,
          whatsapp_verified_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      setStep('success');
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: t.error,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setVerificationCode('');
    await handlePhoneSubmit();
  };

  const handleComplete = () => {
    onSuccess();
  };

  // Formatar telefone enquanto digita
  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 'phone' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="h-6 w-6 text-green-500" />
                {t.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t.subtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t.phoneLabel}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    +55
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    disabled={loading}
                    className="pl-12"
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.phoneHint}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm font-medium mb-1">{t.whyNeeded}</p>
                <p className="text-xs text-muted-foreground">
                  {t.whyExplanation}
                </p>
              </div>
            </div>

            <Button 
              onClick={handlePhoneSubmit} 
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t.continueButton}
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Phone className="h-6 w-6 text-primary" />
                {t.verifyTitle}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t.verifyDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={verificationCode}
                  onChange={(value) => setVerificationCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t.resendIn} {countdown}s
                  </p>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    {t.resendButton}
                  </Button>
                )}
              </div>
            </div>

            <Button 
              onClick={handleVerifyCode} 
              disabled={loading || verificationCode.length !== 6}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {t.verifyButton}
            </Button>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                {t.successTitle}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t.successDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 flex justify-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <Button 
              onClick={handleComplete}
              className="w-full"
              size="lg"
            >
              {t.startButton}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
