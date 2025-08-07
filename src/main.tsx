import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { ThemeProvider } from "@/hooks/useTheme";
import { Toaster } from "@/components/ui/toaster";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

console.log('🚀 Main.tsx: Starting app render');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <SubscriptionProvider>
              <BrowserRouter>
                <App />
                <Toaster />
              </BrowserRouter>
            </SubscriptionProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

console.log('✅ Main.tsx: App render completed');
