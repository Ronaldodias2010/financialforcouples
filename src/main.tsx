import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const queryClient = new QueryClient();

// Simple test component
const TestApp = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold text-black">Teste de Aplicação</h1>
      <p className="text-gray-600">Se você está vendo isso, o React está funcionando!</p>
      <p className="text-blue-600 mt-4">Vou agora adicionar os providers gradualmente...</p>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
