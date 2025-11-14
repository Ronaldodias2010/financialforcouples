import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface PhoneNumberRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const PhoneNumberRequestModal = ({ isOpen, onClose, userId }: PhoneNumberRequestModalProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const text = {
    pt: {
      title: '📱 Adicione seu telefone',
      description: 'Para aproveitar todos os recursos, adicione seu número de telefone. Isso ajuda a proteger sua conta e receber notificações importantes.',
      phoneLabel: 'Número de telefone',
      phonePlaceholder: '(11) 98765-4321',
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
      phonePlaceholder: '(11) 98765-4321',
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
      phonePlaceholder: '(11) 98765-4321',
      saveButton: 'Guardar teléfono',
      skipButton: 'Omitir por ahora',
      success: '¡Teléfono agregado con éxito!',
      error: 'Error al guardar teléfono',
      invalidPhone: 'Por favor, ingresa un teléfono válido'
    }
  };

  const t2 = text[language as keyof typeof text] || text.pt;

  const handleSave = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: t2.invalidPhone,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phone })
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
            <Label htmlFor="phone">{t2.phoneLabel}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t2.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
