import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const SimpleLanding = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰 Couples Financials</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
        Gerencie suas finanças em casal
      </p>
      <button 
        onClick={() => window.location.href = '/auth'}
        style={{
          padding: '16px 32px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        🔐 Entrar / Cadastrar
      </button>
    </div>
  </div>
);

const SimpleAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
        setMessage('✅ Cadastro realizado! Verifique seu email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        setMessage('✅ Login realizado com sucesso!');
        setTimeout(() => {
          window.location.href = '/app';
        }, 1000);
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '3rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          {isSignUp ? '📝 Cadastrar' : '🔐 Login'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
            <input 
              type="password" 
              placeholder="Senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {message && (
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              background: message.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
          >
            {loading ? '⏳ Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
          >
            {isSignUp ? '← Já tenho conta' : '→ Criar conta'}
          </button>
          
          <button 
            type="button"
            onClick={() => window.location.href = '/'}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            ← Voltar
          </button>
        </form>
      </div>
    </div>
  );
};

const SimpleApp = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ Bem-vindo!</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
        Você está logado
      </p>
      <button 
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        style={{
          padding: '16px 32px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        🚪 Sair
      </button>
    </div>
  </div>
);

const App = () => {
  console.log("✅ App.tsx - restaurando funcionalidades");
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div style={{ padding: 16 }}>Carregando...</div>}>
          <Routes>
            <Route path="/" element={<SimpleLanding />} />
            <Route path="/auth" element={<SimpleAuth />} />
            <Route path="/login" element={<SimpleAuth />} />
            <Route path="/app" element={<SimpleApp />} />
            <Route path="*" element={<SimpleLanding />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;