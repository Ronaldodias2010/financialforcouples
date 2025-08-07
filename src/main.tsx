import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Most basic test component possible - NO CSS, NO imports
const TestApp = () => {
  console.log("TestApp rendering...");
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: 'black',
        marginBottom: '10px'
      }}>
        🟢 TESTE BÁSICO FUNCIONANDO
      </h1>
      <p style={{ color: 'gray' }}>
        Se você está vendo isso, o React funciona!
      </p>
      <p style={{ color: 'blue', marginTop: '10px' }}>
        Data: {new Date().toLocaleString()}
      </p>
    </div>
  );
};

console.log("main.tsx: Starting render...");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("Root created, about to render...");
  
  root.render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
  
  console.log("Render called successfully!");
} else {
  console.error("ERRO: Elemento root não encontrado!");
}
