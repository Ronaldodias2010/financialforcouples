import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Smartphone, CheckCircle, XCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const translations = {
  pt: {
    title: 'Login por Biometria',
    description: 'Use sua digital ou Face ID para entrar mais rápido e com mais segurança.',
    notSupported: 'Seu dispositivo não suporta autenticação biométrica.',
    notSupportedHint: 'A biometria está disponível em dispositivos móveis modernos com Face ID ou leitor de digital.',
    enabled: 'Biometria ativada',
    enabledDescription: 'Você pode usar sua digital ou Face ID para fazer login neste dispositivo.',
    notEnabled: 'Biometria não configurada',
    notEnabledDescription: 'Ative a biometria para fazer login de forma mais rápida e segura.',
    enable: 'Ativar biometria',
    enabling: 'Ativando...',
    disable: 'Remover biometria',
    disabling: 'Removendo...',
    successEnabled: 'Biometria ativada com sucesso!',
    successDisabled: 'Biometria removida com sucesso.',
    errorEnable: 'Erro ao ativar biometria',
    errorDisable: 'Erro ao remover biometria',
    confirmDisableTitle: 'Remover biometria?',
    confirmDisableDescription: 'Você precisará usar email e senha para fazer login novamente. Deseja continuar?',
    cancel: 'Cancelar',
    confirm: 'Sim, remover',
    deviceName: 'Dispositivo registrado',
    registeredAt: 'Registrado em',
  },
  en: {
    title: 'Biometric Login',
    description: 'Use your fingerprint or Face ID to sign in faster and more securely.',
    notSupported: 'Your device does not support biometric authentication.',
    notSupportedHint: 'Biometrics are available on modern mobile devices with Face ID or fingerprint reader.',
    enabled: 'Biometrics enabled',
    enabledDescription: 'You can use your fingerprint or Face ID to sign in on this device.',
    notEnabled: 'Biometrics not configured',
    notEnabledDescription: 'Enable biometrics to sign in faster and more securely.',
    enable: 'Enable biometrics',
    enabling: 'Enabling...',
    disable: 'Remove biometrics',
    disabling: 'Removing...',
    successEnabled: 'Biometrics enabled successfully!',
    successDisabled: 'Biometrics removed successfully.',
    errorEnable: 'Error enabling biometrics',
    errorDisable: 'Error removing biometrics',
    confirmDisableTitle: 'Remove biometrics?',
    confirmDisableDescription: 'You will need to use email and password to sign in again. Do you want to continue?',
    cancel: 'Cancel',
    confirm: 'Yes, remove',
    deviceName: 'Registered device',
    registeredAt: 'Registered on',
  },
  es: {
    title: 'Inicio de Sesión Biométrico',
    description: 'Usa tu huella digital o Face ID para iniciar sesión más rápido y de forma más segura.',
    notSupported: 'Tu dispositivo no admite autenticación biométrica.',
    notSupportedHint: 'La biometría está disponible en dispositivos móviles modernos con Face ID o lector de huellas.',
    enabled: 'Biometría activada',
    enabledDescription: 'Puedes usar tu huella digital o Face ID para iniciar sesión en este dispositivo.',
    notEnabled: 'Biometría no configurada',
    notEnabledDescription: 'Activa la biometría para iniciar sesión de forma más rápida y segura.',
    enable: 'Activar biometría',
    enabling: 'Activando...',
    disable: 'Eliminar biometría',
    disabling: 'Eliminando...',
    successEnabled: '¡Biometría activada con éxito!',
    successDisabled: 'Biometría eliminada con éxito.',
    errorEnable: 'Error al activar biometría',
    errorDisable: 'Error al eliminar biometría',
    confirmDisableTitle: '¿Eliminar biometría?',
    confirmDisableDescription: 'Necesitarás usar email y contraseña para iniciar sesión nuevamente. ¿Deseas continuar?',
    cancel: 'Cancelar',
    confirm: 'Sí, eliminar',
    deviceName: 'Dispositivo registrado',
    registeredAt: 'Registrado el',
  },
};

interface Credential {
  id: string;
  device_name: string;
  created_at: string;
}

export function BiometricSettingsCard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isSupported, registerCredential, isLoading } = useWebAuthn();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = translations[language as keyof typeof translations] || translations.pt;

  useEffect(() => {
    if (user) {
      fetchCredentials();
    }
  }, [user]);

  const fetchCredentials = async () => {
    if (!user) return;
    
    setLoadingCredentials(true);
    try {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('id, device_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (err) {
      console.error('Error fetching credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleEnable = async () => {
    const deviceName = getDeviceName();
    const success = await registerCredential(deviceName);
    
    if (success) {
      toast({
        title: t.successEnabled,
      });
      fetchCredentials();
    } else {
      toast({
        variant: 'destructive',
        title: t.errorEnable,
      });
    }
  };

  const handleDisable = async (credentialId: string) => {
    setDeletingId(credentialId);
    try {
      const { error } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: t.successDisabled,
      });
      fetchCredentials();
    } catch (err) {
      console.error('Error deleting credential:', err);
      toast({
        variant: 'destructive',
        title: t.errorDisable,
      });
    } finally {
      setDeletingId(null);
      setShowConfirmDialog(false);
    }
  };

  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows';
    return 'Dispositivo';
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasCredentials = credentials.length > 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t.title}</h3>
        </div>

        <p className="text-sm text-muted-foreground">{t.description}</p>

        {!isSupported ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{t.notSupported}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.notSupportedHint}</p>
            </div>
          </div>
        ) : loadingCredentials ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasCredentials ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t.enabled}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.enabledDescription}</p>

            <div className="space-y-2 mt-4">
              {credentials.map((cred) => (
                <div 
                  key={cred.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{cred.device_name || t.deviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.registeredAt}: {formatDate(cred.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingId(cred.id);
                      setShowConfirmDialog(true);
                    }}
                    disabled={deletingId === cred.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === cred.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.enabling}
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Adicionar outro dispositivo
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t.notEnabled}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.notEnabledDescription}</p>

            <Button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.enabling}
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {t.enable}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDisableTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDisableDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDisable(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
