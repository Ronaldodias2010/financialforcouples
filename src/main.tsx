import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Landing from "./pages/Landing";
import "./index.css";

console.log("🚀 TESTE ISOLADO - LANDING PAGE");

// App mínimo só com Landing
function MinimalApp() {
  return (
    <TooltipProvider>
      <Toaster />
      <Landing />
    </TooltipProvider>
  );
}

const root = document.getElementById("root");

if (!root) {
  console.error("❌ Root element não encontrado");
} else {
  console.log("✅ Root element encontrado");
  
  try {
    console.log("🔄 Criando React root...");
    const reactRoot = createRoot(root);
    console.log("✅ React root criado");
    
    console.log("🔄 Testando Landing isolada...");
    reactRoot.render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <MinimalApp />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>
    );
    console.log("✅ SUCESSO! Landing isolada carregada!");
    
  } catch (error) {
    console.error("❌ ERRO na segunda fase:", error);
    console.error("Stack:", error.stack);
  }
}