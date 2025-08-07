import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ThemeProvider } from "@/hooks/useThemeSimple";
import { Toaster } from "@/components/ui/toaster";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

const BasicApp = () => {
  console.log("🟢 BasicApp renderizando...");
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>
        ✅ APP FUNCIONANDO
      </h1>
      <p style={{ color: '#666' }}>
        Data: {new Date().toLocaleString()}
      </p>
      <p style={{ color: '#009688' }}>
        Se você vê isso, o React básico funciona!
      </p>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BasicApp />
  </StrictMode>
);
