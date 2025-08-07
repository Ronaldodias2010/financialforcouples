import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

console.log("🚀 TESTE COM CSS E ROUTING - INICIALIZANDO");

// Componente de teste com CSS
function TestApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">💰 Couples Financials</h1>
        <p className="text-xl mb-6 opacity-90">CSS + React + Router funcionando!</p>
        
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl mb-6">
          <div className="bg-green-500 p-3 rounded-lg mb-4">
            <strong className="text-lg">✅ TUDO FUNCIONANDO</strong>
          </div>
          <p className="mb-2"><strong>React:</strong> ✅ OK</p>
          <p className="mb-2"><strong>CSS/Tailwind:</strong> ✅ OK</p>
          <p><strong>Router:</strong> ✅ OK</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/auth'}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold text-lg transition-colors"
        >
          🔐 Ir para Login
        </button>
      </div>
    </div>
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
    
    console.log("🔄 Testando com CSS e Router...");
    reactRoot.render(
      <StrictMode>
        <BrowserRouter>
          <TestApp />
        </BrowserRouter>
      </StrictMode>
    );
    console.log("✅ SUCESSO! CSS + Router funcionando!");
    
  } catch (error) {
    console.error("❌ ERRO na segunda fase:", error);
    console.error("Stack:", error.stack);
  }
}