import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface ChangeWhatsAppNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  currentPhone: string;
}

type CountryCode = 'BR' | 'US' | 'ES' | 'PT' | 'MX' | 'AR' | 'CO' | 'CL' | 'PE';

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

// Function to format stored phone for display
const formatPhoneForDisplay = (phone: string): { dialCode: string; localNumber: string; countryCode: CountryCode } => {
  if (!phone) return { dialCode: '+55', localNumber: '', countryCode: 'BR' };
  
  // Try to detect country from phone
  for (const country of countries) {
    const cleanDialCode = country.dialCode.replace(/\D/g, '');
    if (phone.startsWith(cleanDialCode)) {
      const localNumber = phone.slice(cleanDialCode.length);
      return { dialCode: country.dialCode, localNumber, countryCode: country.code };
    }
  }
  
  // Default to Brazil
  return { dialCode: '+55', localNumber: phone, countryCode: 'BR' };
};

export const ChangeWhatsAppNumberModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userId, 
  currentPhone 
}: ChangeWhatsAppNumberModalProps) => {
  const { language, inBrazil } = useLanguage();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('BR');

  // Initialize with current phone data when modal opens
  useEffect(() => {
    if (isOpen && currentPhone) {
      const { localNumber, countryCode } = formatPhoneForDisplay(currentPhone);
      setSelectedCountry(countryCode);
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        setPhone(applyMask(localNumber, country.mask));
      }
    } else if (isOpen) {
      // Auto-detect country based on language
      if (language === 'pt' && inBrazil) {
        setSelectedCountry('BR');
      } else if (language === 'en') {
        setSelectedCountry('US');
      } else if (language === 'es') {
        setSelectedCountry('ES');
      }
      setPhone('');
    }
  }, [isOpen, currentPhone, language, inBrazil]);

  const text = {
    pt: {
      title: '📱 Alterar Número WhatsApp',
      description: 'Insira seu novo número de WhatsApp. Este número será usado para o assistente financeiro.',
      currentNumber: 'Número Atual',
      countryLabel: 'País',
      phoneLabel: 'Novo Número',
      phoneHint: 'Este número será usado para receber e enviar transações via WhatsApp',
      warning: 'Após alterar, seu novo número ficará ativo imediatamente.',
      cancel: 'Cancelar',
      save: 'Salvar Novo Número',
      saving: 'Salvando...',
      success: 'Número WhatsApp alterado com sucesso!',
      error: 'Erro ao alterar número',
      invalidPhone: 'Por favor, insira um telefone válido',
      phoneAlreadyExists: 'Este número já está cadastrado em outra conta',
      sameNumber: 'O novo número é igual ao atual'
    },
    en: {
      title: '📱 Change WhatsApp Number',
      description: 'Enter your new WhatsApp number. This number will be used for the financial assistant.',
      currentNumber: 'Current Number',
      countryLabel: 'Country',
      phoneLabel: 'New Number',
      phoneHint: 'This number will be used to receive and send transactions via WhatsApp',
      warning: 'After changing, your new number will be active immediately.',
      cancel: 'Cancel',
      save: 'Save New Number',
      saving: 'Saving...',
      success: 'WhatsApp number changed successfully!',
      error: 'Error changing number',
      invalidPhone: 'Please enter a valid phone number',
      phoneAlreadyExists: 'This number is already registered to another account',
      sameNumber: 'The new number is the same as the current one'
    },
    es: {
      title: '📱 Cambiar Número WhatsApp',
      description: 'Ingresa tu nuevo número de WhatsApp. Este número se usará para el asistente financiero.',
      currentNumber: 'Número Actual',
      countryLabel: 'País',
      phoneLabel: 'Nuevo Número',
      phoneHint: 'Este número se utilizará para recibir y enviar transacciones por WhatsApp',
      warning: 'Después de cambiar, tu nuevo número estará activo inmediatamente.',
      cancel: 'Cancelar',
      save: 'Guardar Nuevo Número',
      saving: 'Guardando...',
      success: '¡Número WhatsApp cambiado con éxito!',
      error: 'Error al cambiar número',
      invalidPhone: 'Por favor, ingresa un teléfono válido',
      phoneAlreadyExists: 'Este número ya está registrado en otra cuenta',
      sameNumber: 'El nuevo número es igual al actual'
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

  // Format current phone for display
  const formatCurrentPhoneDisplay = () => {
    if (!currentPhone) return '-';
    const { dialCode, localNumber, countryCode } = formatPhoneForDisplay(currentPhone);
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      return `${dialCode} ${applyMask(localNumber, country.mask)}`;
    }
    return currentPhone;
  };

  const handleSave = async () => {
    if (!isValidPhone()) {
      toast.error(t.invalidPhone);
      return;
    }

    const normalizedPhone = normalizePhone(phone, currentCountry.dialCode);

    // Check if new phone is the same as current
    if (normalizedPhone === currentPhone) {
      toast.error(t.sameNumber);
      return;
    }

    setLoading(true);
    try {
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
        toast.error(t.phoneAlreadyExists);
        setLoading(false);
        return;
      }
      
      // Update profile with new phone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone_number: normalizedPhone,
          whatsapp_verified_at: new Date().toISOString() // Auto-verify on change
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Also update 2FA settings if exists
      const { error: twoFaError } = await supabase
        .from('user_2fa_settings')
        .update({ phone_number: normalizedPhone })
        .eq('user_id', userId);

      // Ignore 2FA update error - it's ok if user doesn't have 2FA enabled
      if (twoFaError) {
        console.log('2FA settings not updated (may not exist):', twoFaError);
      }

      toast.success(t.success);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing phone:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
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
          {/* Current number display */}
          {currentPhone && (
            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">{t.currentNumber}</Label>
              <p className="font-medium">{formatCurrentPhoneDisplay()}</p>
            </div>
          )}

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
            <Label htmlFor="new-phone">{t.phoneLabel}</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted border rounded-md text-sm font-medium">
                {currentCountry.dialCode}
              </div>
              <Input
                id="new-phone"
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

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t.warning}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !isValidPhone()}
            className="flex-1"
          >
            {loading ? t.saving : t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
