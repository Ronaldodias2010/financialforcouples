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
    // Log and keep the app usable
    console.error('[GlobalErrorBoundary] Caught error:', error, info);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "Erro inesperado"}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 border"
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
                  } finally {
                    window.location.reload();
                  }
                }}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 border"
              >
                Limpar cache e reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
