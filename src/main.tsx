import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 TESTE COM APP REAL - INICIALIZANDO");

const root = document.getElementById("root");

if (!root) {
  console.error("❌ Root element não encontrado");
} else {
  console.log("✅ Root element encontrado");
  
  try {
    console.log("🔄 Criando React root...");
    const reactRoot = createRoot(root);
    console.log("✅ React root criado");
    
    console.log("🔄 Testando com App completo...");
    reactRoot.render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>
    );
    console.log("✅ SUCESSO! App completo funcionando!");
    
  } catch (error) {
    console.error("❌ ERRO na segunda fase:", error);
    console.error("Stack:", error.stack);
  }
}