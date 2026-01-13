import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface WhatsAppPhoneRequiredModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userId: string;
}

type CountryCode = 'BR' | 'US' | 'ES' | 'PT' | 'MX' | 'AR' | 'CO' | 'CL' | 'PE' | 'OTHER';

interface CountryConfig {
  code: CountryCode;
  dialCode: string;
  name: { pt: string; en: string; es: string };
  mask: string;
  placeholder: string;
  maxLength: number;
}

const countries: CountryConfig[] = [
  { code: 'BR', dialCode: '+55', name: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' }, mask: '(##) #####-####', placeholder: '(11) 99999-9999', maxLength: 15 },
  { code: 'US', dialCode: '+1', name: { pt: 'Estados Unidos', en: 'United States', es: 'Estados Unidos' }, mask: '(###) ###-####', placeholder: '(555) 123-4567', maxLength: 14 },
  { code: 'ES', dialCode: '+34', name: { pt: 'Espanha', en: 'Spain', es: 'España' }, mask: '### ### ###', placeholder: '612 345 678', maxLength: 11 },
  { code: 'PT', dialCode: '+351', name: { pt: 'Portugal', en: 'Portugal', es: 'Portugal' }, mask: '### ### ###', placeholder: '912 345 678', maxLength: 11 },
  { code: 'MX', dialCode: '+52', name: { pt: 'México', en: 'Mexico', es: 'México' }, mask: '(##) ####-####', placeholder: '(55) 1234-5678', maxLength: 14 },
  { code: 'AR', dialCode: '+54', name: { pt: 'Argentina', en: 'Argentina', es: 'Argentina' }, mask: '(##) ####-####', placeholder: '(11) 1234-5678', maxLength: 14 },
  { code: 'CO', dialCode: '+57', name: { pt: 'Colômbia', en: 'Colombia', es: 'Colombia' }, mask: '### ### ####', placeholder: '300 123 4567', maxLength: 12 },
  { code: 'CL', dialCode: '+56', name: { pt: 'Chile', en: 'Chile', es: 'Chile' }, mask: '# #### ####', placeholder: '9 1234 5678', maxLength: 11 },
  { code: 'PE', dialCode: '+51', name: { pt: 'Peru', en: 'Peru', es: 'Perú' }, mask: '### ### ###', placeholder: '912 345 678', maxLength: 11 },
];

// Function to apply mask to phone input
const applyMask = (value: string, mask: string): string => {
  const numbers = value.replace(/\D/g, '');
  let result = '';
  let numberIndex = 0;
  
  for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
    if (mask[i] === '#') {
      result += numbers[numberIndex];
      numberIndex++;
    } else {
      result += mask[i];
    }
  }
  
  return result;
};

// Function to normalize phone for storage
const normalizePhone = (phone: string, dialCode: string): string => {
  const numbers = phone.replace(/\D/g, '');
  const cleanDialCode = dialCode.replace(/\D/g, '');
  return cleanDialCode + numbers;
};

export const WhatsAppPhoneRequiredModal = ({ isOpen, onComplete, onSkip, userId }: WhatsAppPhoneRequiredModalProps) => {
  const { language, inBrazil } = useLanguage();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(inBrazil ? 'BR' : 'US');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Auto-detect country based on language
  useEffect(() => {
    if (language === 'pt' && inBrazil) {
      setSelectedCountry('BR');
    } else if (language === 'en') {
      setSelectedCountry('US');
    } else if (language === 'es') {
      setSelectedCountry('ES');
    }
  }, [language, inBrazil]);

  const text = {
    pt: {
      title: '📱 Configure seu WhatsApp',
      description: 'Para usar o assistente financeiro via WhatsApp, você precisa cadastrar seu número. Sem ele, você não poderá registrar transações pelo WhatsApp.',
      countryLabel: 'País',
      phoneLabel: 'Número de telefone',
      phoneHint: 'Este número será usado para receber e enviar transações via WhatsApp',
      whatsappBenefit1: '✅ Registre despesas: "Gastei R$50 no mercado"',
      whatsappBenefit2: '✅ Consulte seu saldo a qualquer momento',
      whatsappBenefit3: '✅ Receba lembretes de contas a pagar',
      warningTitle: '⚠️ Atenção',
      warningText: 'Sem o número de WhatsApp cadastrado, você não poderá usar o assistente financeiro via mensagens.',
      saveButton: 'Salvar e Continuar',
      success: 'WhatsApp configurado com sucesso!',
      error: 'Erro ao salvar telefone',
      invalidPhone: 'Por favor, insira um telefone válido',
      phoneAlreadyExists: 'Este número de telefone já está cadastrado em outra conta',
      skipConfirmTitle: '⚠️ Deseja pular o cadastro do WhatsApp?',
      skipConfirmDescription: 'Sem o número cadastrado, você não poderá usar o assistente financeiro via WhatsApp. Você pode cadastrar depois em Configurações > Perfil.',
      skipConfirmNote: '💡 Lembre-se: mesmo com o WhatsApp cadastrado, apenas usuários com assinatura ativa podem utilizar o serviço.',
      skipConfirmCancel: 'Voltar e cadastrar',
      skipConfirmContinue: 'Pular por agora'
    },
    en: {
      title: '📱 Set up your WhatsApp',
      description: 'To use the financial assistant via WhatsApp, you need to register your number. Without it, you cannot record transactions via WhatsApp.',
      countryLabel: 'Country',
      phoneLabel: 'Phone number',
      phoneHint: 'This number will be used to receive and send transactions via WhatsApp',
      whatsappBenefit1: '✅ Record expenses: "Spent $50 at grocery"',
      whatsappBenefit2: '✅ Check your balance anytime',
      whatsappBenefit3: '✅ Receive payment reminders',
      warningTitle: '⚠️ Attention',
      warningText: 'Without a registered WhatsApp number, you will not be able to use the financial assistant via messages.',
      saveButton: 'Save and Continue',
      success: 'WhatsApp configured successfully!',
      error: 'Error saving phone',
      invalidPhone: 'Please enter a valid phone number',
      phoneAlreadyExists: 'This phone number is already registered to another account',
      skipConfirmTitle: '⚠️ Skip WhatsApp registration?',
      skipConfirmDescription: 'Without a registered number, you cannot use the financial assistant via WhatsApp. You can register later in Settings > Profile.',
      skipConfirmNote: '💡 Remember: even with WhatsApp registered, only users with an active subscription can use the service.',
      skipConfirmCancel: 'Go back and register',
      skipConfirmContinue: 'Skip for now'
    },
    es: {
      title: '📱 Configura tu WhatsApp',
      description: 'Para usar el asistente financiero vía WhatsApp, necesitas registrar tu número. Sin él, no podrás registrar transacciones por WhatsApp.',
      countryLabel: 'País',
      phoneLabel: 'Número de teléfono',
      phoneHint: 'Este número se utilizará para recibir y enviar transacciones por WhatsApp',
      whatsappBenefit1: '✅ Registra gastos: "Gasté €50 en el mercado"',
      whatsappBenefit2: '✅ Consulta tu saldo en cualquier momento',
      whatsappBenefit3: '✅ Recibe recordatorios de pagos',
      warningTitle: '⚠️ Atención',
      warningText: 'Sin un número de WhatsApp registrado, no podrás usar el asistente financiero por mensajes.',
      saveButton: 'Guardar y Continuar',
      success: '¡WhatsApp configurado con éxito!',
      error: 'Error al guardar teléfono',
      invalidPhone: 'Por favor, ingresa un teléfono válido',
      phoneAlreadyExists: 'Este número de teléfono ya está registrado en otra cuenta',
      skipConfirmTitle: '⚠️ ¿Omitir registro de WhatsApp?',
      skipConfirmDescription: 'Sin un número registrado, no podrás usar el asistente financiero por WhatsApp. Puedes registrarte después en Configuración > Perfil.',
      skipConfirmNote: '💡 Recuerda: incluso con WhatsApp registrado, solo los usuarios con suscripción activa pueden usar el servicio.',
      skipConfirmCancel: 'Volver y registrar',
      skipConfirmContinue: 'Omitir por ahora'
    }
  };

  const t = text[language as keyof typeof text] || text.pt;
  const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];

  const handlePhoneChange = (value: string) => {
    const masked = applyMask(value, currentCountry.mask);
    setPhone(masked);
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code as CountryCode);
    setPhone(''); // Reset phone when country changes
  };

  const isValidPhone = useCallback(() => {
    const numbers = phone.replace(/\D/g, '');
    // Brazil: 10-11 digits, US: 10 digits, others: 8-12 digits
    if (selectedCountry === 'BR') {
      return numbers.length >= 10 && numbers.length <= 11;
    } else if (selectedCountry === 'US') {
      return numbers.length === 10;
    } else {
      return numbers.length >= 8 && numbers.length <= 12;
    }
  }, [phone, selectedCountry]);

  const handleSave = async () => {
    if (!isValidPhone()) {
      toast({
        title: t.invalidPhone,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone, currentCountry.dialCode);
      
      // Check if phone already exists in another account
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone_number', normalizedPhone)
        .neq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking phone:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        toast({
          title: t.phoneAlreadyExists,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          phone_number: normalizedPhone,
          whatsapp_verified_at: new Date().toISOString() // Auto-verify on first setup
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Mark first access as completed
      localStorage.setItem(`first_access_completed_${userId}`, 'true');

      toast({
        title: t.success,
        description: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });

      onComplete();
    } catch (error) {
      console.error('Error saving phone:', error);
      toast({
        title: t.error,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleConfirmSkip = () => {
    // Mark first access as completed even when skipping
    localStorage.setItem(`first_access_completed_${userId}`, 'true');
    setShowSkipConfirm(false);
    onSkip();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md" 
          onPointerDownOutside={(e) => e.preventDefault()}
          // Hide default close button by targeting DialogPrimitive.Close
          hideCloseButton
        >
          {/* Custom Close button */}
          <button
            type="button"
            onClick={handleSkipClick}
            className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer bg-transparent border-none"
            disabled={loading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              {t.title}
            </DialogTitle>
            <DialogDescription>
              {t.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Country selector */}
            <div className="space-y-2">
              <Label>{t.countryLabel}</Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.dialCode} - {country.name[language as keyof typeof country.name] || country.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone input with mask */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phoneLabel}</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted border rounded-md text-sm font-medium">
                  {currentCountry.dialCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={currentCountry.placeholder}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={loading}
                  maxLength={currentCountry.maxLength}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t.phoneHint}</p>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 space-y-2">
              <p className="text-sm">{t.whatsappBenefit1}</p>
              <p className="text-sm">{t.whatsappBenefit2}</p>
              <p className="text-sm">{t.whatsappBenefit3}</p>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">{t.warningTitle}</p>
                <p className="text-sm text-muted-foreground">{t.warningText}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading || !isValidPhone()}
            className="w-full"
          >
            {loading ? '...' : t.saveButton}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Skip Confirmation Alert */}
      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.skipConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t.skipConfirmDescription}</p>
              <p className="font-medium text-amber-600 dark:text-amber-400">{t.skipConfirmNote}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.skipConfirmCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSkip}>{t.skipConfirmContinue}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
