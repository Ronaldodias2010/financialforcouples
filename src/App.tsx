import React from "react";
import { Routes, Route } from "react-router-dom";

// Lazy import para evitar problemas de carregamento
const Landing = React.lazy(() => import("./pages/Landing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const AppDashboard = React.lazy(() => import("./pages/AppDashboard"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const App = () => {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl font-bold mb-4">💰 Couples Financials</div>
          <div className="animate-pulse">Carregando...</div>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<AppDashboard />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<AppDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;