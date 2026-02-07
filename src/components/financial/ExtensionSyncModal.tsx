import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Chrome,
  Download,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ExtensionSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programCode: string;
  programName: string;
  programUrl: string;
  onSyncComplete?: (balance: number) => void;
}

type SyncStep = 'install' | 'navigate' | 'sync' | 'complete';

const CHROME_EXTENSION_URL = 'https://chrome.google.com/webstore/detail/couples-miles/your-extension-id';

// URLs das páginas de milhas por programa
const PROGRAM_MILES_URLS: Record<string, string> = {
  latam_pass: 'https://www.latam.com/pt_br/latam-pass/minha-conta/',
  azul: 'https://www.tudoazul.com.br/minha-conta/',
  smiles: 'https://www.smiles.com.br/minha-conta',
  livelo: 'https://www.livelo.com.br/minha-conta',
};

export function ExtensionSyncModal({
  open,
  onOpenChange,
  programCode,
  programName,
  programUrl,
  onSyncComplete,
}: ExtensionSyncModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<SyncStep>('install');
  const [isPolling, setIsPolling] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | null>(null);
  const [syncDetected, setSyncDetected] = useState(false);

  const milesUrl = PROGRAM_MILES_URLS[programCode] || programUrl;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep('install');
      setSyncDetected(false);
      setLastBalance(null);
    }
  }, [open]);

  // Poll for sync updates when user is on sync step
  useEffect(() => {
    if (!open || !user || currentStep !== 'sync') return;

    setIsPolling(true);
    let pollInterval: NodeJS.Timeout;

    const checkForSync = async () => {
      try {
        const { data, error } = await supabase
          .from('extension_sync_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('program_code', programCode)
          .eq('sync_status', 'success')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const latestSync = data[0];
          const syncTime = new Date(latestSync.created_at);
          const now = new Date();
          const diffMinutes = (now.getTime() - syncTime.getTime()) / (1000 * 60);

          // If sync happened in the last 2 minutes, consider it new
          if (diffMinutes < 2) {
            setSyncDetected(true);
            setLastBalance(latestSync.balance);
            setCurrentStep('complete');
            setIsPolling(false);
            onSyncComplete?.(latestSync.balance);
          }
        }
      } catch (err) {
        console.error('Error polling for sync:', err);
      }
    };

    // Poll every 3 seconds
    pollInterval = setInterval(checkForSync, 3000);
    checkForSync(); // Initial check

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [open, user, currentStep, programCode, onSyncComplete]);

  const steps = [
    {
      id: 'install' as SyncStep,
      title: 'Instalar Extensão',
      description: 'Instale a extensão Couples Miles no Chrome',
      icon: Download,
    },
    {
      id: 'navigate' as SyncStep,
      title: 'Acessar Programa',
      description: `Faça login no ${programName}`,
      icon: ExternalLink,
    },
    {
      id: 'sync' as SyncStep,
      title: 'Sincronizar',
      description: 'Clique em sincronizar na extensão',
      icon: RefreshCw,
    },
    {
      id: 'complete' as SyncStep,
      title: 'Concluído',
      description: 'Saldo atualizado com sucesso',
      icon: CheckCircle2,
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleOpenExtensionStore = () => {
    window.open(CHROME_EXTENSION_URL, '_blank');
    setCurrentStep('navigate');
  };

  const handleOpenProgram = () => {
    window.open(milesUrl, '_blank');
    setCurrentStep('sync');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5 text-primary" />
            Sincronizar {programName} via Extensão
          </DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para sincronizar automaticamente seu saldo de
            milhas.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={cn(
                  'transition-colors',
                  index <= currentStepIndex
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {index + 1}. {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4 py-4">
          {currentStep === 'install' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">1. Instale a Extensão</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    A extensão Couples Miles permite capturar seu saldo de milhas
                    de forma segura, sem armazenar senhas.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      🔒 Sem senhas
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      ✅ Extração segura
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      ⚡ Automático
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleOpenExtensionStore} className="flex-1 gap-2">
                  <Chrome className="h-4 w-4" />
                  Instalar no Chrome
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('navigate')}
                >
                  Já tenho
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'navigate' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ExternalLink className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">2. Acesse sua conta {programName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Faça login no site oficial do {programName} e navegue até a
                    página onde seu saldo de milhas está visível.
                  </p>
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Importante:</strong> Certifique-se de estar na
                        página onde o saldo de milhas aparece (geralmente "Minha
                        Conta" ou "Resumo").
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleOpenProgram} className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir {programName}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('install')}
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'sync' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <RefreshCw className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">3. Sincronize na Extensão</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Com a página de milhas aberta, clique no ícone da extensão
                    Couples Miles e depois em "Sincronizar Milhas".
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        1
                      </span>
                      Clique no ícone da extensão (puzzle) no Chrome
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        2
                      </span>
                      Clique em "Couples Miles"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        3
                      </span>
                      Clique em "Sincronizar Milhas"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        4
                      </span>
                      Confirme se o valor está correto
                    </li>
                  </ol>
                </div>
              </div>

              {isPolling && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Aguardando sincronização...
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('navigate')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-700 dark:text-green-400">
                    Sincronização Concluída!
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Seu saldo de {programName} foi atualizado com sucesso.
                  </p>
                  {lastBalance !== null && (
                    <div className="mt-3 p-3 bg-background rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        Saldo capturado
                      </span>
                      <p className="text-2xl font-bold text-foreground">
                        {lastBalance.toLocaleString('pt-BR')} milhas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleClose} className="w-full gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluído
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
