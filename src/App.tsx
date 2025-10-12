import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const SimpleAuth = () => (
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
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>🔐 Login</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="email" 
          placeholder="Email"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
        />
        <input 
          type="password" 
          placeholder="Senha"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1rem'
          }}
        />
      </div>
      <button 
        style={{
          width: '100%',
          padding: '14px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          marginBottom: '1rem'
        }}
      >
        Entrar
      </button>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          width: '100%',
          padding: '14px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}
      >
        ← Voltar
      </button>
    </div>
  </div>
);

const App = () => {
  console.log("✅ App.tsx - versão simplificada inline");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleLanding />} />
        <Route path="/auth" element={<SimpleAuth />} />
        <Route path="/login" element={<SimpleAuth />} />
        <Route path="*" element={<SimpleLanding />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;