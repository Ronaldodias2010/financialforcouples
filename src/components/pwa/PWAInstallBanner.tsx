import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Sparkles } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { t, language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Verificar se já foi dispensado
    const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
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
      title: 'Instale nosso App!',
      description: 'Acesse mais rápido direto da sua tela inicial',
      install: 'Instalar Agora',
      howTo: 'Como instalar?',
    },
    en: {
      title: 'Install our App!',
      description: 'Access faster from your home screen',
      install: 'Install Now',
      howTo: 'How to install?',
    },
    es: {
      title: '¡Instala nuestra App!',
      description: 'Accede más rápido desde tu pantalla de inicio',
      install: 'Instalar Ahora',
      howTo: '¿Cómo instalar?',
    },
  };

  const currentTexts = texts[language as keyof typeof texts] || texts.pt;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-primary via-primary to-emerald-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Icon and Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {currentTexts.title}
                </p>
                <p className="text-xs text-white/80 truncate">
                  {currentTexts.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isInstallable ? (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary font-semibold rounded-full text-sm hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentTexts.install}</span>
                  <span className="sm:hidden">Instalar</span>
                </button>
              ) : (
                <Link
                  to="/install"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary font-semibold rounded-full text-sm hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentTexts.howTo}</span>
                  <span className="sm:hidden">Instalar</span>
                </Link>
              )}
              
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
