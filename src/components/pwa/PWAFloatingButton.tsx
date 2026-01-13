import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const PWAFloatingButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const wasDismissed = localStorage.getItem('pwa_floating_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Mostrar tooltip após 3 segundos
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    // Esconder tooltip após 8 segundos
    const hideTooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(tooltipTimer);
      clearTimeout(hideTooltipTimer);
    };
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('pwa_floating_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await installApp();
    }
  };

  // Não mostrar se já instalou, não é mobile, ou foi dispensado
  if (isInstalled || !isMobile || dismissed) {
    return null;
  }

  const texts = {
    pt: {
      tooltip: 'Instale o app para acesso rápido!',
    },
    en: {
      tooltip: 'Install the app for quick access!',
    },
    es: {
      tooltip: '¡Instala la app para acceso rápido!',
    },
  };

  const currentTexts = texts[language as keyof typeof texts] || texts.pt;

  const ButtonContent = (
    <>
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {currentTexts.tooltip}
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-foreground rotate-45"></div>
          </div>
        </div>
      )}
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        aria-label="Fechar"
      >
        <X className="w-3 h-3" />
      </button>
      
      {/* Main button */}
      <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all active:scale-95 relative overflow-hidden">
        {/* Pulse animation */}
        <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
        <Download className="w-6 h-6 relative z-10" />
      </div>
    </>
  );

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {isInstallable ? (
        <button onClick={handleInstall} className="relative">
          {ButtonContent}
        </button>
      ) : (
        <Link to="/install" className="relative block">
          {ButtonContent}
        </Link>
      )}
    </div>
  );
};

export default PWAFloatingButton;
