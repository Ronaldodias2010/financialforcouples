import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// Removed global TooltipProvider to prevent crashes; using SafeTooltipProvider instead
import { LanguageProvider } from "@/hooks/useLanguage";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import LandingSimple from "./pages/LandingSimple";
import { SafeTooltipProvider } from "./components/system/SafeTooltipProvider";
import { GlobalErrorBoundary } from "./components/system/GlobalErrorBoundary";
import { ClientOnly } from "./components/system/ClientOnly";
import { GlobalErrorLogger } from "./components/system/GlobalErrorLogger";
import Auth from "./pages/Auth";
import AppDashboard from "./pages/AppDashboard";
import { AccountsPage } from "./pages/AccountsPage";
import { CardsPage } from "./pages/CardsPage";
import { MileagePage } from "./pages/MileagePage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailConfirmation from "./pages/EmailConfirmation";
import SendConfirmationEmail from "./pages/SendConfirmationEmail";
import NotFound from "./pages/NotFound";
import EmailTest from "./pages/EmailTest";
import { ProtectedRoute } from "./components/ProtectedRoute";
// PWAPrompt temporarily disabled to stabilize app

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <LanguageProvider>
            <ClientOnly>
              <SafeTooltipProvider>
                <GlobalErrorBoundary>
                  <Routes>
                    <Route path="/" element={<LandingSimple />} />
                    <Route path="/landing-new" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/email-confirmation" element={<EmailConfirmation />} />
                    <Route path="/send-confirmation" element={<SendConfirmationEmail />} />
                    <Route path="/email-test" element={<EmailTest />} />
                    
                    {/* Protected Routes */}
                    <Route path="/app" element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
                    <Route path="/accounts" element={<ProtectedRoute><AccountsPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                    <Route path="/cards" element={<ProtectedRoute><CardsPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                    <Route path="/mileage" element={<ProtectedRoute><MileagePage onBack={() => window.history.back()} /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><UserProfilePage onBack={() => window.history.back()} /></ProtectedRoute>} />
                    <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage onBack={() => window.history.back()} /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </GlobalErrorBoundary>
                <Toaster />
                <Sonner />
                <GlobalErrorLogger />
              </SafeTooltipProvider>
            </ClientOnly>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;