import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingSimple from "./pages/LandingSimple";
import Auth from "./pages/Auth";

const App = () => {
  console.log("✅ App.tsx - adicionando rotas principais");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingSimple />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
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
                Página não encontrada
              </p>
              <button 
                onClick={() => window.location.href = '/'}
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
                🏠 Voltar ao Início
              </button>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;