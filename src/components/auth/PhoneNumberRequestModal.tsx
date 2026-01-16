import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type CountryCode = 'BR' | 'US' | 'PT' | 'ES' | 'MX' | 'AR';

interface CountryConfig {
  code: CountryCode;
  dialCode: string;
  name: string;
  mask: string;
  placeholder: string;
}

const countries: CountryConfig[] = [
  { code: 'BR', dialCode: '55', name: '🇧🇷 Brasil', mask: '(##) #####-####', placeholder: '(11) 98765-4321' },
  { code: 'US', dialCode: '1', name: '🇺🇸 USA', mask: '(###) ###-####', placeholder: '(555) 123-4567' },
  { code: 'PT', dialCode: '351', name: '🇵🇹 Portugal', mask: '### ### ###', placeholder: '912 345 678' },
  { code: 'ES', dialCode: '34', name: '🇪🇸 España', mask: '### ### ###', placeholder: '612 345 678' },
  { code: 'MX', dialCode: '52', name: '🇲🇽 México', mask: '(##) ####-####', placeholder: '(55) 1234-5678' },
  { code: 'AR', dialCode: '54', name: '🇦🇷 Argentina', mask: '(##) ####-####', placeholder: '(11) 1234-5678' }
];

// Apply mask to phone input
const applyMask = (value: string, mask: string): string => {
  const digits = value.replace(/\D/g, '');
  let result = '';
  let digitIndex = 0;
  
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += mask[i];
    }
  }
  
  return result;
};

// Normalize phone for storage: remove non-digits and add country code
const normalizePhone = (phone: string, dialCode: string): string => {
  const digits = phone.replace(/\D/g, '');
  return dialCode + digits;
};

interface PhoneNumberRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const PhoneNumberRequestModal = ({ isOpen, onClose, userId }: PhoneNumberRequestModalProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('BR');
  const [loading, setLoading] = useState(false);

  // Auto-detect country based on language
  useEffect(() => {
    if (language === 'en') {
      setSelectedCountry('US');
    } else if (language === 'es') {
      setSelectedCountry('ES');
    } else {
      setSelectedCountry('BR');
    }
  }, [language]);

  const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];

  const text = {
    pt: {
      title: '📱 Adicione seu telefone',
      description: 'Para aproveitar todos os recursos, adicione seu número de telefone. Isso ajuda a proteger sua conta e receber notificações importantes.',
      phoneLabel: 'Número de telefone',
      countryLabel: 'País',
      saveButton: 'Salvar telefone',
      skipButton: 'Pular por enquanto',
      success: 'Telefone adicionado com sucesso!',
      error: 'Erro ao salvar telefone',
      invalidPhone: 'Por favor, insira um telefone válido'
    },
    en: {
      title: '📱 Add your phone number',
      description: 'To enjoy all features, add your phone number. This helps protect your account and receive important notifications.',
      phoneLabel: 'Phone number',
      countryLabel: 'Country',
      saveButton: 'Save phone',
      skipButton: 'Skip for now',
      success: 'Phone added successfully!',
      error: 'Error saving phone',
      invalidPhone: 'Please enter a valid phone number'
    },
    es: {
      title: '📱 Agrega tu teléfono',
      description: 'Para disfrutar de todas las funciones, agrega tu número de teléfono. Esto ayuda a proteger tu cuenta y recibir notificaciones importantes.',
      phoneLabel: 'Número de teléfono',
      countryLabel: 'País',
      saveButton: 'Guardar teléfono',
      skipButton: 'Omitir por ahora',
      success: '¡Teléfono agregado con éxito!',
      error: 'Error al guardar teléfono',
      invalidPhone: 'Por favor, ingresa un teléfono válido'
    }
  };

  const t2 = text[language as keyof typeof text] || text.pt;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, currentCountry.mask);
    setPhone(masked);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value as CountryCode);
    setPhone('');
  };

  const isValidPhone = (): boolean => {
    const digits = phone.replace(/\D/g, '');
    // Check minimum length based on country
    if (selectedCountry === 'BR') return digits.length >= 10 && digits.length <= 11;
    if (selectedCountry === 'US') return digits.length === 10;
    return digits.length >= 9;
  };

  const handleSave = async () => {
    if (!isValidPhone()) {
      toast({
        title: t2.invalidPhone,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Normalize phone with country code before saving
      const normalizedPhone = normalizePhone(phone, currentCountry.dialCode);
      
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: normalizedPhone })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: t2.success
      });

      // Mark as completed in localStorage
      localStorage.setItem(`phone_request_completed_${userId}`, 'true');
      onClose();
    } catch (error) {
      console.error('Error saving phone:', error);
      toast({
        title: t2.error,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark as skipped in localStorage
    localStorage.setItem(`phone_request_skipped_${userId}`, 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {t2.title}
          </DialogTitle>
          <DialogDescription>
            {t2.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t2.countryLabel}</Label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} (+{country.dialCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t2.phoneLabel}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={currentCountry.placeholder}
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? t('loading') : t2.saveButton}
          </Button>
          <Button 
            onClick={handleSkip} 
            variant="outline"
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            {t2.skipButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
