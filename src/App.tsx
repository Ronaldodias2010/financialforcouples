import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  console.log("✅ App.tsx - versão mínima");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={
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
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰 Couples Financials</h1>
              <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                ✅ Sistema ONLINE
              </p>
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: '1.5rem', 
                borderRadius: '10px',
                marginBottom: '1rem'
              }}>
                <p><strong>Status:</strong> Funcionando</p>
                <p><strong>Cache:</strong> Limpo</p>
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
                  fontSize: '1rem',
                  marginRight: '10px'
                }}
              >
                🔐 Login
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                🔄 Recarregar
              </button>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;