import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

// Componente básico de teste
const TestLanding = () => (
  <div style={{ 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Couples Financials</h1>
    <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Sistema funcionando!</p>
    <button 
      onClick={() => window.location.href = '/auth'}
      style={{
        padding: '12px 24px',
        fontSize: '1rem',
        background: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Fazer Login
    </button>
  </div>
);

const TestAuth = () => (
  <div style={{ 
    minHeight: '100vh', 
    background: '#1f2937', 
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Página de Login</h1>
      <p>Sistema funcionando sem erros!</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          padding: '12px 24px',
          fontSize: '1rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Voltar
      </button>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<TestAuth />} />
      <Route path="/login" element={<TestAuth />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
};

export default App;