import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAPrompt } from "@/components/PWAPrompt";
import Landing from "./pages/Landing";
import AppDashboard from "./pages/AppDashboard";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import EmailTest from "./pages/EmailTest";
import EmailConfirmation from "./pages/EmailConfirmation";
import SendConfirmationEmail from "./pages/SendConfirmationEmail";
import { AdminDashboard } from "./pages/AdminDashboard";

const App = () => (
  <>
    <Toaster />
    <PWAPrompt />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <AppDashboard />
        </ProtectedRoute>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/email-confirmation" element={<EmailConfirmation />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/email-test" element={<EmailTest />} />
      <Route path="/send-confirmation" element={<SendConfirmationEmail />} />
      {/* Redirect legacy routes */}
      <Route path="/login" element={<Auth />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppDashboard />
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;
