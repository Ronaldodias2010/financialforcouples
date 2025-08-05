import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAPrompt = () => {
  const { isInstallable, updateAvailable, installApp, updateApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(true);

  // Only show on /app routes (not on landing page)
  const currentPath = window.location.pathname;
  const shouldShowOnCurrentPath = currentPath.startsWith('/app') || currentPath === '/auth' || currentPath === '/admin';

  if (!isInstallable && !updateAvailable) return null;
  if (!shouldShowOnCurrentPath) return null;

  return (
    <>
      {/* Install Prompt */}
      {isInstallable && showInstallPrompt && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/a3413c4f-0329-4c0f-8e9d-4a6a7447c4dd.png" 
                  alt="Couples Financials" 
                  className="w-8 h-8 rounded"
                />
                <CardTitle className="text-sm">Instalar App</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallPrompt(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Instale o Couples Financials para acesso rápido e experiência aprimorada
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={installApp} className="w-full" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Prompt */}
      {updateAvailable && showUpdatePrompt && (
        <Card className="fixed bottom-4 right-4 z-50 w-80 bg-card border-border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-primary" />
                <CardTitle className="text-sm">Atualização Disponível</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpdatePrompt(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Uma nova versão do Couples Financials está disponível
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={updateApp} className="w-full" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Agora
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};