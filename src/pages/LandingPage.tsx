import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: "2rem",
        textAlign: "center"
      }}
    >
      <div style={{ maxWidth: "600px" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", fontWeight: "bold" }}>
          💰 {t('hero.title')}
        </h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "3rem", opacity: 0.95 }}>
          {t('hero.subtitle')}
        </p>
        <Button
          onClick={() => navigate('/auth')}
          style={{
            padding: "16px 40px",
            fontSize: "1.125rem",
            fontWeight: "bold",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease"
          }}
        >
          {t('header.login')}
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
