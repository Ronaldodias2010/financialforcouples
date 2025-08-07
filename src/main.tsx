import React from "react";
import { createRoot } from "react-dom/client";

console.log("🚀 TESTE BÁSICO - INICIALIZANDO");

// Componente mais simples possível
function SimpleApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          💰 Couples Financials
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          React funcionando!
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '15px',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#10b981',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <strong style={{ fontSize: '1.1rem' }}>✅ REACT CARREGADO COM SUCESSO</strong>
          </div>
          <p><strong>Status:</strong> Teste básico funcionando</p>
        </div>
        <button 
          onClick={() => window.location.href = '/auth'}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          🔐 Continuar para Login
        </button>
      </div>
    </div>
  );
}

const root = document.getElementById("root");

if (!root) {
  console.error("❌ Root element não encontrado");
} else {
  console.log("✅ Root element encontrado");
  
  try {
    console.log("🔄 Criando React root...");
    const reactRoot = createRoot(root);
    console.log("✅ React root criado");
    
    console.log("🔄 Renderizando componente simples...");
    reactRoot.render(<SimpleApp />);
    console.log("✅ SUCESSO! Componente renderizado!");
    
  } catch (error) {
    console.error("❌ ERRO:", error);
    console.error("Stack:", error.stack);
  }
}