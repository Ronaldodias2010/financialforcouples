import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppProvider } from "./providers/AppProvider";
import "./index.css";

console.log("🚀 Iniciando aplicação Couples Financials...");

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Root element not found");
}

console.log("✅ Root element encontrado");

try {
  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </React.StrictMode>
  );
  
  console.log("✅ Aplicação renderizada com sucesso!");
} catch (error) {
  console.error("❌ Erro fatal ao renderizar aplicação:", error);
  
  // Fallback UI em caso de erro crítico
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: sans-serif; text-align: center; padding: 2rem;">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">💰 Couples Financials</h1>
        <p style="margin-bottom: 1rem;">Erro ao carregar aplicação</p>
        <button onclick="location.reload()" style="padding: 12px 24px; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
          Tentar Novamente
        </button>
      </div>
    </div>
  `;
}