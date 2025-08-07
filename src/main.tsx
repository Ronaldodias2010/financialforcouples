import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const BasicApp = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-4">Couples Financials</h1>
      <p className="text-lg">App funcionando - teste básico</p>
      <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded">
        Teste
      </button>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BasicApp />
  </StrictMode>,
);
