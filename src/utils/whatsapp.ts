const phoneNumber = "5511988066403";

const detectDevice = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  return { isMobile, isIOS, isAndroid };
};

const tryOpenWhatsApp = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const newWindow = window.open(url, '_blank');
      
      // Check if window was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        resolve(false);
      } else {
        resolve(true);
      }
    } catch (error) {
      console.warn('Failed to open WhatsApp URL:', url, error);
      resolve(false);
    }
  });
};

export const openWhatsApp = async (message?: string) => {
  const { isMobile, isIOS, isAndroid } = detectDevice();
  const encodedMessage = message ? encodeURIComponent(message) : "";
  
  // Define fallback URLs in order of preference
  const fallbackUrls: string[] = [];
  
  if (isMobile) {
    // Mobile: Try native app first, then wa.me
    fallbackUrls.push(
      `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`,
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`
    );
  } else {
    // Desktop: Prioritize web.whatsapp.com over wa.me
    fallbackUrls.push(
      `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`,
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    );
  }
  
  // Try each URL until one works
  for (const url of fallbackUrls) {
    const success = await tryOpenWhatsApp(url);
    if (success) {
      return;
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // If all URLs fail, show manual fallback
  const manualMessage = `Não foi possível abrir o WhatsApp automaticamente. 
    
Entre em contato manualmente:
📱 Número: ${phoneNumber}
💬 Mensagem: ${message || 'Olá! Gostaria de saber mais sobre o Couples Financials.'}
    
Ou copie este link e cole no seu navegador:
https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  if (confirm(manualMessage + '\n\nDeseja copiar o link para a área de transferência?')) {
    try {
      await navigator.clipboard.writeText(`https://wa.me/${phoneNumber}?text=${encodedMessage}`);
      alert('Link copiado para a área de transferência!');
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
    }
  }
};