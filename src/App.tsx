import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Lazy imports
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const AccountsPage = lazy(() => import("./pages/AccountsPage").then(m => ({ default: m.AccountsPage })));
const CardsPage = lazy(() => import("./pages/CardsPage").then(m => ({ default: m.CardsPage })));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage").then(m => ({ default: m.UserProfilePage })));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage").then(m => ({ default: m.SubscriptionPage })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Using AuthProvider from hooks/useAuth.tsx to avoid duplication

// Protected Route
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div style={{ padding: 16 }}>Carregando...</div>;
  }

  return user ? <>{children}</> : null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={<div style={{ padding: 16 }}>Carregando...</div>}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                
                <Route path="/app" element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute><AccountsPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                <Route path="/cards" element={<ProtectedRoute><CardsPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfilePage onBack={() => window.history.back()} /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
            <Sonner />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;