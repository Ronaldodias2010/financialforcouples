import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import "./index.css";

console.log("🚀 TESTE DIRETO NO MAIN - LANDING SIMPLIFICADA");

// Landing Simplificada direto no main.tsx
function TestLanding() {
  console.log("🔄 TestLanding: Iniciando renderização");
  
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">💰 Couples Financials</h1>
        <p className="text-2xl mb-6 opacity-90">LANDING SIMPLIFICADA FUNCIONANDO!</p>
        
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-2xl mb-6">
          <div className="bg-yellow-500 text-black p-4 rounded-lg mb-4">
            <strong className="text-xl">🎉 LANDING PAGE OK!</strong>
          </div>
          <p className="mb-3 text-lg"><strong>React:</strong> ✅ OK</p>
          <p className="mb-3 text-lg"><strong>Router:</strong> ✅ OK</p>
          <p className="mb-3 text-lg"><strong>Auth:</strong> ✅ OK</p>
          <p className="text-lg"><strong>User:</strong> {user ? '✅ Logado' : '❌ Não logado'}</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-lg font-bold text-xl"
            size="lg"
          >
            🔐 Ir para Autenticação
          </Button>
          
          {user && (
            <Button 
              onClick={() => navigate("/app")}
              className="bg-purple-500 hover:bg-purple-600 px-8 py-4 rounded-lg font-bold text-xl ml-4"
              size="lg"
            >
              📱 Ir para Dashboard
            </Button>
          )}
        </div>
        
        <p className="mt-6 text-sm opacity-70">
          Se vê esta mensagem, a Landing page básica está funcionando!
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <TestLanding />
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
    
    console.log("🔄 Testando Landing direto no main...");
    reactRoot.render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>
    );
    console.log("✅ SUCESSO! Landing direto funcionando!");
    
  } catch (error) {
    console.error("❌ ERRO:", error);
    console.error("Stack:", error.stack);
  }
}