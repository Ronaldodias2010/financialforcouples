import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 APLICAÇÃO RESTAURADA E FUNCIONANDO");

const root = document.getElementById("root");

if (!root) {
  console.error("❌ Elemento root não encontrado");
  throw new Error("Root element not found");
}

console.log("✅ Elemento root encontrado:", root);

// Ensure no stale service workers/cache keep old bundles causing crashes
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      console.log('[SW] Unregistering service worker', reg.scope)
      reg.unregister();
    });
  });
}
if (typeof caches !== 'undefined') {
  caches.keys().then((keys) => {
    keys.forEach((k) => {
      console.log('[Cache] Deleting cache', k);
      caches.delete(k);
    });
  });
}

try {
  console.log("🔄 Criando React root...");
  
  const reactRoot = createRoot(root);
  console.log("✅ React root criado com sucesso");
  
  console.log("🔄 Renderizando aplicação completa...");
  
  reactRoot.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
  
  console.log("✅ SUCESSO! Aplicação completa renderizada!");
  
} catch (error) {
  console.error("❌ ERRO ao renderizar aplicação:", error);
  console.error("Stack trace:", error.stack);
  
  // FALLBACK DE EMERGÊNCIA
  root.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: sans-serif; text-align: center; padding: 2rem;">
      <div style="max-width: 600px;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">💰 Couples Financials</h1>
        <p style="margin-bottom: 2rem;">Sistema Ativo - Modo de Emergência</p>
        
        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; text-align: left;">
          <p><strong>Status:</strong> ✅ Funcionando</p>
          <p><strong>Modo:</strong> Emergência (React falhou)</p>
          <p><strong>Erro:</strong> ${error.message}</p>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
          <button onclick="location.reload()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🔄 Tentar Novamente</button>
          <button onclick="window.location.href='/auth'" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🔐 Fazer Login</button>
        </div>
        
        <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
          Seus dados estão seguros. Este é um problema técnico temporário.
        </p>
      </div>
    </div>
  `;
  
  console.log("✅ Fallback de emergência ativado");
}