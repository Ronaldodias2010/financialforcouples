import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: "2rem"
      }}
    >
      <div style={{ maxWidth: "800px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: "bold" }}>
          ✅ {t('dashboard.title')}
        </h1>
        <p style={{ fontSize: "1.125rem", marginBottom: "1rem", opacity: 0.95 }}>
          Bem-vindo ao Couples Financials!
        </p>
        <p style={{ marginBottom: "2rem", opacity: 0.9 }}>
          Email: {user?.email}
        </p>
        
        <div style={{ 
          background: "rgba(255,255,255,0.1)", 
          padding: "2rem", 
          borderRadius: "12px",
          marginBottom: "2rem",
          backdropFilter: "blur(10px)"
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            📊 {t('dashboard.title')}
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem",
            marginTop: "1.5rem"
          }}>
            <div style={{ 
              background: "rgba(255,255,255,0.2)", 
              padding: "1.5rem", 
              borderRadius: "8px"
            }}>
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
                {t('dashboard.balance')}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold" }}>
                R$ 0,00
              </div>
            </div>
            <div style={{ 
              background: "rgba(255,255,255,0.2)", 
              padding: "1.5rem", 
              borderRadius: "8px"
            }}>
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
                {t('dashboard.income')}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#4ade80" }}>
                R$ 0,00
              </div>
            </div>
            <div style={{ 
              background: "rgba(255,255,255,0.2)", 
              padding: "1.5rem", 
              borderRadius: "8px"
            }}>
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "0.5rem" }}>
                {t('dashboard.expenses')}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#f87171" }}>
                R$ 0,00
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={signOut}
          style={{
            padding: "12px 32px",
            background: "white",
            color: "#059669",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          Sair
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
