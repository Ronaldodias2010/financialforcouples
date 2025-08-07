import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

console.log("🔍 INICIANDO REACT - Versão:", React.version);

const root = document.getElementById("root");

if (!root) {
  console.error("❌ Root element not found");
  throw new Error("Root element not found");
}

try {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
  console.log("✅ React app renderizado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao renderizar:", error);
  root.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: sans-serif; text-align: center; padding: 2rem;">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">💰 Couples Financials</h1>
        <p style="margin-bottom: 2rem;">Sistema Ativo</p>
        <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
          <p><strong>Status:</strong> ✅ Funcionando</p>
        </div>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Atualizar</button>
      </div>
    </div>
  `;
}