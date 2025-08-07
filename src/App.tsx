import React from "react";
import { Routes, Route } from "react-router-dom";

// Importar apenas o Landing original para testar
import Landing from "./pages/Landing";

// Manter componentes básicos de teste para as outras rotas
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
      <p>Sistema funcionando - em desenvolvimento</p>
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

const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<TestAuth />} />
    <Route path="/login" element={<TestAuth />} />
    <Route path="*" element={<Landing />} />
  </Routes>
);

export default App;