// Teste de emergência sem React Router
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Componente simples sem hooks
const EmergencyApp = () => {
  return (
    <div style={{
      minHeight: "100vh",
      background: "white",
      padding: "2rem",
      fontFamily: "system-ui",
      color: "#111"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center"
      }}>
        <h1 style={{
          color: "#059669",
          fontSize: "2.5rem",
          marginBottom: "1rem"
        }}>
          Couples Financials
        </h1>
        <p style={{
          fontSize: "1.25rem",
          marginBottom: "2rem",
          color: "#374151"
        }}>
          ✅ Sistema Funcionando - React Carregado
        </p>
        <div style={{
          background: "#d1fae5",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem"
        }}>
          <p style={{
            color: "#065f46",
            fontSize: "1.125rem"
          }}>
            🚀 Teste de React bem-sucedido!
          </p>
        </div>
      </div>
    </div>
  );
};

// Tentar renderizar sem StrictMode primeiro
const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<EmergencyApp />);
    console.log("✅ React renderizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao renderizar React:", error);
    // Fallback para HTML puro
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: white; padding: 2rem; font-family: system-ui; text-align: center;">
        <h1 style="color: #dc2626; font-size: 2rem;">FALLBACK ATIVO</h1>
        <p>React falhou, usando HTML puro</p>
      </div>
    `;
  }
} else {
  console.error("❌ Elemento root não encontrado!");
}