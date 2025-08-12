import React from 'react';

const TempAuth: React.FC = () => {
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
        maxWidth: '400px', 
        width: '100%',
        background: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'center' }}>
          🔐 Login - Couples Financials
        </h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input 
            type="email" 
            placeholder="seu@email.com"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none',
              marginBottom: '1rem'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha:</label>
          <input 
            type="password" 
            placeholder="••••••••"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none'
            }}
          />
        </div>
        
        <button 
          style={{ 
            width: '100%',
            padding: '12px 20px', 
            background: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          Entrar
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          style={{ 
            width: '100%',
            padding: '10px 20px', 
            background: 'transparent', 
            color: 'white', 
            border: '1px solid white', 
            borderRadius: '5px', 
            cursor: 'pointer'
          }}
        >
          ← Voltar para Home
        </button>
        
        <p style={{ 
          textAlign: 'center', 
          marginTop: '1rem', 
          fontSize: '0.9rem', 
          opacity: 0.8 
        }}>
          Página temporária - Em breve com funcionalidade completa
        </p>
      </div>
    </div>
  );
};

export default TempAuth;