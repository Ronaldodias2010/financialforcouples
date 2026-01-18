import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Número E.164 padrão (sem +)
const WHATSAPP_E164 = '5511988066403';

// Formatos de exibição
const FORMAT_LOCAL_BR = '(11) 98806-6403';
const FORMAT_INTERNATIONAL = '+55 11 98806 6403';

export interface WhatsAppFormatResult {
  displayNumber: string;
  whatsappLink: string;
  message: {
    title: string;
    subtitle: string;
  };
}

/**
 * Hook para formatar número do WhatsApp Smart de acordo com idioma/região
 * 
 * Regras:
 * - Português (pt): formato local (11) 98806-6403
 * - English (en) ou Español (es): formato internacional +55 11 98806 6403
 * - Link sempre usa E.164: https://wa.me/5511988066403
 */
export const useWhatsAppFormat = (): WhatsAppFormatResult => {
  const { language } = useLanguage();

  return useMemo(() => {
    // Determina se deve usar formato internacional
    const useInternationalFormat = language !== 'pt';
    
    // Número formatado para exibição
    const displayNumber = useInternationalFormat ? FORMAT_INTERNATIONAL : FORMAT_LOCAL_BR;
    
    // Link sempre usa E.164 (funciona globalmente)
    const whatsappLink = `https://wa.me/${WHATSAPP_E164}`;
    
    // Mensagens localizadas
    const message = {
      title: 'WhatsApp Smart',
      subtitle: language === 'pt' 
        ? 'Envie suas despesas para nossa IA'
        : language === 'es'
        ? 'Envía tus gastos a nuestra IA'
        : 'Send your expenses to our AI'
    };

    return {
      displayNumber,
      whatsappLink,
      message
    };
  }, [language]);
};

/**
 * Função utilitária para abrir WhatsApp com mensagem pré-definida
 */
export const getWhatsAppLink = (message?: string): string => {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${WHATSAPP_E164}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
};

export default useWhatsAppFormat;
