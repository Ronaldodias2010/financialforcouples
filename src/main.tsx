import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Componente Landing básico
const Landing = () => (
  <div className="min-h-screen bg-white text-gray-900 p-8">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4 text-emerald-600">Couples Financials</h1>
      <p className="text-xl mb-8">Sistema de gestão financeira para casais</p>
      <div className="bg-emerald-50 p-6 rounded-lg mb-8">
        <p className="text-lg">🚧 Sistema em manutenção - voltaremos em breve</p>
      </div>
      <a href="/app" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
        Acessar Sistema
      </a>
    </div>
  </div>
);

// App básico funcionando
const AppBasic = () => (
  <div className="min-h-screen bg-white text-gray-900 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-emerald-600">Couples Financials - Dashboard</h1>
      <div className="bg-emerald-50 p-6 rounded-lg">
        <p className="text-lg">Sistema funcionando normalmente</p>
        <p className="mt-2">Em breve todas as funcionalidades estarão disponíveis.</p>
      </div>
    </div>
  </div>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppBasic />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);