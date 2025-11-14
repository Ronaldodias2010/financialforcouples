import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: any;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Log and persist error for debugging
    console.error('[GlobalErrorBoundary] Caught error:', error, info);
    
    // Store error in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error?.toString(),
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack,
        userAgent: navigator.userAgent,
      };
      localStorage.setItem('last_error', JSON.stringify(errorLog));
      console.log('[GlobalErrorBoundary] Error logged to localStorage');
    } catch (e) {
      console.error('[GlobalErrorBoundary] Failed to log error:', e);
    }
    
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md text-center space-y-4 border rounded-lg p-8 shadow-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "Erro inesperado"}
            </p>
            <details className="text-left text-xs text-muted-foreground bg-muted p-3 rounded">
              <summary className="cursor-pointer font-medium mb-2">Detalhes técnicos</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                {this.state.error?.stack || 'Sem stack trace disponível'}
              </pre>
            </details>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Recarregar página
              </button>
              <button
                onClick={async () => {
                  try {
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map(r => r.unregister()));
                    }
                    if ('caches' in window) {
                      const names = await caches.keys();
                      await Promise.all(names.map(n => caches.delete(n)));
                    }
                    localStorage.clear();
                  } finally {
                    window.location.reload();
                  }
                }}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 border border-border hover:bg-accent transition-colors"
              >
                Limpar tudo e reiniciar
              </button>
              <button
                onClick={() => {
                  const lastError = localStorage.getItem('last_error');
                  const lastGlobalError = localStorage.getItem('last_global_error');
                  const lastRejection = localStorage.getItem('last_rejection_error');
                  console.log('=== ERROR LOGS ===');
                  console.log('Last Error:', lastError ? JSON.parse(lastError) : 'None');
                  console.log('Last Global Error:', lastGlobalError ? JSON.parse(lastGlobalError) : 'None');
                  console.log('Last Rejection:', lastRejection ? JSON.parse(lastRejection) : 'None');
                  alert('Logs salvos no console (F12 para ver)');
                }}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-xs border border-border hover:bg-accent transition-colors"
              >
                Ver logs completos (F12)
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Timestamp: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
