import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const TempApp: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      color: 'white', 
      fontFamily: 'sans-serif', 
      padding: '2rem' 
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%',
        background: 'rgba(255,255,255,0.1)', 
        padding: '3rem', 
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          {t('hero.title')}
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          {t('hero.subtitle')}
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>Idioma/Language/Idioma:</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLanguage('pt')}
              style={{
                padding: '10px 20px',
                background: language === 'pt' ? '#10b981' : 'transparent',
                color: 'white',
                border: '1px solid white',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🇧🇷 Português
            </button>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '10px 20px',
                background: language === 'en' ? '#10b981' : 'transparent',
                color: 'white',
                border: '1px solid white',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => setLanguage('es')}
              style={{
                padding: '10px 20px',
                background: language === 'es' ? '#10b981' : 'transparent',
                color: 'white',
                border: '1px solid white',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🇪🇸 Español
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/auth'}
            style={{ 
              padding: '12px 30px', 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            {t('header.login')}
          </button>
          
          <button 
            style={{ 
              padding: '12px 30px', 
              background: 'transparent', 
              color: 'white', 
              border: '2px solid white', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {t('hero.cta.free')}
          </button>
        </div>
        
        <p style={{ 
          marginTop: '2rem', 
          fontSize: '0.9rem', 
          opacity: 0.7 
        }}>
          ✅ Sistema de tradução funcionando<br/>
          🔧 App sendo restaurado gradualmente
        </p>
      </div>
    </div>
  );
};

export default TempApp;