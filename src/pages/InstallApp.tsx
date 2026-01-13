import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share, MoreVertical, Plus, Check, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWA } from '@/hooks/usePWA';
import { Link } from 'react-router-dom';

type DeviceType = 'android' | 'ios' | 'desktop' | 'unknown';

const InstallApp = () => {
  const { language } = useLanguage();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/i.test(ua)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const handleInstall = async () => {
    if (isInstallable) {
      await installApp();
    }
  };

  const texts = {
    pt: {
      title: 'Instalar Couples Financials',
      subtitle: 'Tenha o app sempre à mão na sua tela inicial',
      alreadyInstalled: '✅ App já instalado!',
      alreadyInstalledDesc: 'Você já tem o Couples Financials instalado. Procure o ícone na sua tela inicial.',
      goToApp: 'Ir para o App',
      installNow: 'Instalar Agora',
      benefits: {
        title: 'Por que instalar?',
        items: [
          'Acesso instantâneo sem abrir o navegador',
          'Funciona offline',
          'Receba notificações importantes',
          'Experiência como app nativo',
        ],
      },
      android: {
        title: 'Como instalar no Android',
        steps: [
          { icon: MoreVertical, text: 'Toque no menu (⋮) do navegador' },
          { icon: Download, text: 'Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"' },
          { icon: Check, text: 'Confirme a instalação' },
        ],
      },
      ios: {
        title: 'Como instalar no iPhone/iPad',
        steps: [
          { icon: Share, text: 'Toque no botão compartilhar (📤)' },
          { icon: Plus, text: 'Role e toque em "Adicionar à Tela de Início"' },
          { icon: Check, text: 'Toque em "Adicionar" para confirmar' },
        ],
      },
      desktop: {
        title: 'Como instalar no Computador',
        steps: [
          { icon: Monitor, text: 'Clique no ícone de instalação (⊕) na barra de endereço' },
          { icon: Download, text: 'Ou use o menu do navegador > "Instalar Couples Financials"' },
          { icon: Check, text: 'Confirme a instalação' },
        ],
      },
      back: 'Voltar',
    },
    en: {
      title: 'Install Couples Financials',
      subtitle: 'Have the app always at hand on your home screen',
      alreadyInstalled: '✅ App already installed!',
      alreadyInstalledDesc: 'You already have Couples Financials installed. Look for the icon on your home screen.',
      goToApp: 'Go to App',
      installNow: 'Install Now',
      benefits: {
        title: 'Why install?',
        items: [
          'Instant access without opening the browser',
          'Works offline',
          'Receive important notifications',
          'Native app experience',
        ],
      },
      android: {
        title: 'How to install on Android',
        steps: [
          { icon: MoreVertical, text: 'Tap the browser menu (⋮)' },
          { icon: Download, text: 'Select "Install app" or "Add to home screen"' },
          { icon: Check, text: 'Confirm installation' },
        ],
      },
      ios: {
        title: 'How to install on iPhone/iPad',
        steps: [
          { icon: Share, text: 'Tap the share button (📤)' },
          { icon: Plus, text: 'Scroll and tap "Add to Home Screen"' },
          { icon: Check, text: 'Tap "Add" to confirm' },
        ],
      },
      desktop: {
        title: 'How to install on Computer',
        steps: [
          { icon: Monitor, text: 'Click the install icon (⊕) in the address bar' },
          { icon: Download, text: 'Or use browser menu > "Install Couples Financials"' },
          { icon: Check, text: 'Confirm installation' },
        ],
      },
      back: 'Back',
    },
    es: {
      title: 'Instalar Couples Financials',
      subtitle: 'Ten la app siempre a mano en tu pantalla de inicio',
      alreadyInstalled: '✅ ¡App ya instalada!',
      alreadyInstalledDesc: 'Ya tienes Couples Financials instalado. Busca el ícono en tu pantalla de inicio.',
      goToApp: 'Ir a la App',
      installNow: 'Instalar Ahora',
      benefits: {
        title: '¿Por qué instalar?',
        items: [
          'Acceso instantáneo sin abrir el navegador',
          'Funciona sin conexión',
          'Recibe notificaciones importantes',
          'Experiencia como app nativa',
        ],
      },
      android: {
        title: 'Cómo instalar en Android',
        steps: [
          { icon: MoreVertical, text: 'Toca el menú (⋮) del navegador' },
          { icon: Download, text: 'Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"' },
          { icon: Check, text: 'Confirma la instalación' },
        ],
      },
      ios: {
        title: 'Cómo instalar en iPhone/iPad',
        steps: [
          { icon: Share, text: 'Toca el botón compartir (📤)' },
          { icon: Plus, text: 'Desplázate y toca "Agregar a pantalla de inicio"' },
          { icon: Check, text: 'Toca "Agregar" para confirmar' },
        ],
      },
      desktop: {
        title: 'Cómo instalar en Computadora',
        steps: [
          { icon: Monitor, text: 'Haz clic en el ícono de instalación (⊕) en la barra de direcciones' },
          { icon: Download, text: 'O usa el menú del navegador > "Instalar Couples Financials"' },
          { icon: Check, text: 'Confirma la instalación' },
        ],
      },
      back: 'Volver',
    },
  };

  const t = texts[language as keyof typeof texts] || texts.pt;
  const deviceInstructions = t[deviceType as keyof typeof t] as { title: string; steps: { icon: any; text: string }[] } | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-semibold">{t.title}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <img
              src="/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png"
              alt="Couples Financials Logo"
              className="w-full h-full object-contain"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-semibold text-lg mb-2">{t.alreadyInstalled}</h3>
              <p className="text-muted-foreground text-sm mb-4">{t.alreadyInstalledDesc}</p>
              <Button asChild className="w-full">
                <Link to="/app">{t.goToApp}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Native Install Button */}
        {isInstallable && !isInstalled && (
          <Button 
            onClick={handleInstall} 
            size="lg" 
            className="w-full mb-6 py-6 text-lg gap-2"
          >
            <Download className="w-5 h-5" />
            {t.installNow}
          </Button>
        )}

        {/* Benefits */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              {t.benefits.title}
            </h3>
            <ul className="space-y-3">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Step by Step Instructions */}
        {deviceInstructions && !isInstalled && !isInstallable && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">{deviceInstructions.title}</h3>
              <div className="space-y-4">
                {deviceInstructions.steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === index;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left ${
                        isActive 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Passo {index + 1}
                        </div>
                        <p className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {step.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Dots */}
        {deviceInstructions && !isInstalled && !isInstallable && (
          <div className="flex justify-center gap-2 mt-4">
            {deviceInstructions.steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === index ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InstallApp;
