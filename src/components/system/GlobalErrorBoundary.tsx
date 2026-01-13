import React from 'react';
import { isOldBrowser, getBrowserInfo } from '@/polyfills';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: any;
  isRemoveChildError: boolean;
  isOldBrowser: boolean;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isRemoveChildError: false,
      isOldBrowser: false 
    };
  }

  static getDerivedStateFromError(error: any) {
    const errorMessage = error?.message || error?.toString() || '';
    const isRemoveChildError = 
      errorMessage.includes('removeChild') || 
      errorMessage.includes('insertBefore') ||
      errorMessage.includes('appendChild') ||
      errorMessage.includes('NotFoundError');
    
    return { 
      hasError: true, 
      error,
      isRemoveChildError,
      isOldBrowser: isOldBrowser()
    };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[GlobalErrorBoundary] Caught error:', error, info);
    
    const browserInfo = getBrowserInfo();
    
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error?.toString(),
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack,
        userAgent: navigator.userAgent,
        browserInfo,
        isRemoveChildError: this.state.isRemoveChildError,
      };
      localStorage.setItem('last_error', JSON.stringify(errorLog));
    } catch (e) {
      console.error('[GlobalErrorBoundary] Failed to log error:', e);
    }
    
    this.setState({ error });
  }

  handleAutoCleanup = async () => {
    try {
      // Desregistrar service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      
      // Limpar caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      
      // Limpar localStorage (exceto dados essenciais)
      const keysToKeep = ['theme', 'language'];
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Recarregar sem cache
      window.location.href = window.location.origin + window.location.pathname + '?nocache=' + Date.now();
    } catch (e) {
      console.error('Erro ao limpar:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { isRemoveChildError, isOldBrowser } = this.state;
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: '#f5f5f5' }}>
          <div className="max-w-md w-full text-center space-y-4 bg-white border rounded-xl p-6 sm:p-8 shadow-lg">
            <div className="text-5xl sm:text-6xl mb-4">
              {isRemoveChildError ? '📱' : '⚠️'}
            </div>
            
            <h1 className="text-lg sm:text-xl font-semibold" style={{ color: '#1a1a1a' }}>
              {isRemoveChildError 
                ? 'Problema de Compatibilidade' 
                : 'Algo deu errado'}
            </h1>
            
            {isOldBrowser && (
              <div className="p-3 rounded-lg text-sm" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107' }}>
                <strong>Navegador Desatualizado:</strong> Você está usando uma versão antiga do navegador. 
                Atualize para a melhor experiência.
              </div>
            )}
            
            <p className="text-sm" style={{ color: '#666' }}>
              {isRemoveChildError 
                ? 'Detectamos um problema de compatibilidade com seu dispositivo. Vamos resolver isso automaticamente.'
                : this.state.error?.message || 'Ocorreu um erro inesperado'}
            </p>

            {isRemoveChildError ? (
              <div className="space-y-3">
                <button
                  onClick={this.handleAutoCleanup}
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-white font-medium transition-colors"
                  style={{ background: '#10b981' }}
                >
                  <span>🔄</span>
                  Corrigir Automaticamente
                </button>
                <p className="text-xs" style={{ color: '#999' }}>
                  Isso limpará o cache e recarregará o aplicativo
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-lg px-4 py-2 text-white font-medium"
                  style={{ background: '#10b981' }}
                >
                  Recarregar página
                </button>
                <button
                  onClick={this.handleAutoCleanup}
                  className="w-full rounded-lg px-4 py-2 font-medium"
                  style={{ background: '#f3f4f6', color: '#374151' }}
                >
                  Limpar cache e reiniciar
                </button>
              </div>
            )}

            <details className="text-left text-xs p-3 rounded-lg" style={{ background: '#f9fafb', color: '#6b7280' }}>
              <summary className="cursor-pointer font-medium mb-2">Detalhes técnicos</summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-32 text-xs">
                {this.state.error?.stack || 'Sem stack trace disponível'}
              </pre>
              <p className="mt-2">Navegador: {getBrowserInfo().name} {getBrowserInfo().version}</p>
            </details>
            
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
