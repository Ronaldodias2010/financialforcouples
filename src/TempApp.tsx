import React from 'react';

const TempApp: React.FC = () => {
  return (
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
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰 Couples Financials</h1>
        <p style={{ marginBottom: '2rem' }}>Sistema Online - Funcionando!</p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '10px', 
          marginBottom: '1rem' 
        }}>
          <p><strong>Status:</strong> ✅ Temporário OK</p>
          <p><strong>Teste:</strong> App básico funcionando</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/auth'}
          style={{ 
            padding: '10px 20px', 
            background: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          🔐 Ir para Login
        </button>
      </div>
    </div>
  );
};

export default TempApp;