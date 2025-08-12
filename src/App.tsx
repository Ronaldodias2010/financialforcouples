import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// Removed global TooltipProvider to prevent crashes; using SafeTooltipProvider instead
import { LanguageProvider } from "@/hooks/useLanguage";
import { AuthProvider } from "@/hooks/useAuth";
import { SafeTooltipProvider } from "./components/system/SafeTooltipProvider";
import { GlobalErrorBoundary } from "./components/system/GlobalErrorBoundary";
import { ClientOnly } from "./components/system/ClientOnly";
import { GlobalErrorLogger } from "./components/system/GlobalErrorLogger";
import { PerformanceMonitor } from "./components/system/PerformanceMonitor";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { RouteSEO } from "./components/seo/RouteSEO";
import LandingSimple from "./pages/LandingSimple";
import LandingStable from "./pages/LandingStable";
import Auth from "./pages/Auth";
const Landing = lazy(() => import("./pages/Landing"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const AccountsPage = lazy(() => import("./pages/AccountsPage").then(m => ({ default: m.AccountsPage })));
const CardsPage = lazy(() => import("./pages/CardsPage").then(m => ({ default: m.CardsPage })));
const MileagePage = lazy(() => import("./pages/MileagePage").then(m => ({ default: m.MileagePage })));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage").then(m => ({ default: m.UserProfilePage })));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage").then(m => ({ default: m.SubscriptionPage })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const SendConfirmationEmail = lazy(() => import("./pages/SendConfirmationEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmailTest = lazy(() => import("./pages/EmailTest"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const Privacy = lazy(() => import("./pages/Privacy"));
import { ProtectedRoute } from "./components/ProtectedRoute";
// PWAPrompt temporarily disabled to stabilize app

const App = () => {
  console.log("🔧 App component renderizando...");
  
  // Simplified QueryClient creation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

  console.log("🔧 QueryClient criado");

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              <SafeTooltipProvider>
                <SubscriptionProvider>
                  <Routes>
                    <Route path="/" element={<LandingStable />} />
                    <Route path="/landing-old" element={<LandingSimple />} />
                    <Route path="/landing-new" element={
                      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
                        <Landing />
                      </Suspense>
                    } />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/forgot-password" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <ForgotPassword />
                      </Suspense>
                    } />
                    <Route path="/reset-password" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <ResetPassword />
                      </Suspense>
                    } />
                    <Route path="/email-confirmation" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <EmailConfirmation />
                      </Suspense>
                    } />
                    <Route path="/send-confirmation" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <SendConfirmationEmail />
                      </Suspense>
                    } />
                    <Route path="/email-test" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <EmailTest />
                      </Suspense>
                    } />
                    <Route path="/privacy" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <Privacy />
                      </Suspense>
                    } />
                    
                    {/* Protected Routes */}
                    <Route path="/app" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <AppDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/accounts" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <AccountsPage onBack={() => window.history.back()} />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/cards" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <CardsPage onBack={() => window.history.back()} />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/mileage" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <MileagePage onBack={() => window.history.back()} />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <UserProfilePage onBack={() => window.history.back()} />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/subscription" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <SubscriptionPage onBack={() => window.history.back()} />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/subscription-success" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <SubscriptionSuccess />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <AdminDashboard />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="/change-password" element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Carregando...</div>}>
                          <ChangePassword />
                        </Suspense>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={
                      <Suspense fallback={<div>Carregando...</div>}>
                        <NotFound />
                      </Suspense>
                    } />
                  </Routes>
                  
                  <Toaster />
                  <Sonner />
                  <GlobalErrorLogger />
                  <PerformanceMonitor />
                  <RouteSEO />
                </SubscriptionProvider>
              </SafeTooltipProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;