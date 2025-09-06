import React, { Suspense, lazy } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/hooks/useAuth";
import { SafeTooltipProvider } from "./components/system/SafeTooltipProvider";
import { GlobalErrorBoundary } from "./components/system/GlobalErrorBoundary";
import { ClientOnly } from "./components/system/ClientOnly";
import { GlobalErrorLogger } from "./components/system/GlobalErrorLogger";
import { PerformanceMonitor } from "./components/system/PerformanceMonitor";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { RouteSEO } from "./components/seo/RouteSEO";
import { LanguageProvider } from "@/contexts/LanguageContext";

import LandingSimple from "./pages/LandingSimple";
const PrivacyPolicy = lazy(() => import("./components/landing/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./components/landing/TermsOfUse"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Partnership = lazy(() => import("./pages/Partnership"));
import Auth from "./pages/Auth";
const Landing = lazy(() => import("./pages/Landing"));
const DirectCheckout = lazy(() => import("./pages/DirectCheckout"));
const CheckoutEmailConfirmation = lazy(() => import("./pages/CheckoutEmailConfirmation"));
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
const CleanupPastel = lazy(() => import("./pages/CleanupPastel"));
const TestPartnerEmails = lazy(() => import("./pages/TestPartnerEmails").then(m => ({ default: m.TestPartnerEmails })));
import { ProtectedRoute } from "./components/ProtectedRoute";
// PWAPrompt temporarily disabled to stabilize app

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const navigate = useNavigate();
  
  const handleNavBack = () => {
    // Use React Router navigation instead of window.history.back()
    // This prevents the black screen issue in Chrome SPAs
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/app'); // Fallback to dashboard
    }
  };

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
                <SubscriptionProvider>
                  <GlobalErrorBoundary>
                    <Suspense fallback={<div style={{ padding: 16 }}>Carregando...</div>}>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/checkout-direto" element={<DirectCheckout />} />
                        <Route path="/checkout-email-confirmation" element={<CheckoutEmailConfirmation />} />
                        <Route path="/landing-simple" element={<LandingSimple />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/login" element={<Auth />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/email-confirmation" element={<EmailConfirmation />} />
                        <Route path="/send-confirmation" element={<SendConfirmationEmail />} />
                        <Route path="/email-test" element={<EmailTest />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/sobre-nos" element={<AboutUs />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/parceria" element={<Partnership />} />
                        <Route path="/partnership" element={<Partnership />} />
                        <Route path="/asociacion" element={<Partnership />} />
                        
                        {/* Protected Routes */}
                        <Route path="/app" element={<ProtectedRoute><AppDashboard /></ProtectedRoute>} />
                        <Route path="/accounts" element={<ProtectedRoute><AccountsPage onBack={handleNavBack} /></ProtectedRoute>} />
                        <Route path="/cards" element={<ProtectedRoute><CardsPage onBack={handleNavBack} /></ProtectedRoute>} />
                        <Route path="/mileage" element={<ProtectedRoute><MileagePage onBack={handleNavBack} /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><UserProfilePage onBack={handleNavBack} /></ProtectedRoute>} />
                        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage onBack={handleNavBack} /></ProtectedRoute>} />
                        <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                        <Route path="/cleanup-pastel" element={<ProtectedRoute><CleanupPastel /></ProtectedRoute>} />
                        <Route path="/test-emails" element={<TestPartnerEmails />} />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </GlobalErrorBoundary>
                  <Toaster />
                  <Sonner />
                  <GlobalErrorLogger />
                  <PerformanceMonitor />
                  <RouteSEO />
                 </SubscriptionProvider>
               </SafeTooltipProvider>
             </ClientOnly>
           
           </LanguageProvider>
          </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

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
                <SubscriptionProvider>
                  <GlobalErrorBoundary>
                    <AppRoutes />
                  </GlobalErrorBoundary>
                 </SubscriptionProvider>
               </SafeTooltipProvider>
             </ClientOnly>
           </LanguageProvider>
          </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;