// DIAGNÓSTICO COMPLETO - TESTE 1: JavaScript Básico
console.log("🔍 INICIANDO DIAGNÓSTICO DE EMERGÊNCIA");

const rootElement = document.getElementById("root");
console.log("📍 Root element:", rootElement);

if (!rootElement) {
  document.body.innerHTML = `
    <div style="background: red; color: white; padding: 20px; text-align: center;">
      <h1>ERRO: Element 'root' não encontrado</h1>
    </div>
  `;
} else {
  // TESTE 1: HTML Puro primeiro
  rootElement.innerHTML = `
    <div style="min-height: 100vh; background: #f0f9ff; padding: 2rem; font-family: Arial, sans-serif;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h1 style="color: #0369a1; font-size: 2.5rem; margin-bottom: 1rem;">
          🚨 DIAGNÓSTICO DE EMERGÊNCIA
        </h1>
        <div style="background: #dbeafe; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p style="font-size: 1.2rem; color: #1e40af;">
            ✅ JavaScript está funcionando
          </p>
        </div>
        <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p style="color: #92400e;">
            🔄 Testando React em 2 segundos...
          </p>
        </div>
        <div id="react-test" style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <p>Aguardando teste React...</p>
        </div>
      </div>
    </div>
  `;

  // TESTE 2: Tentar React após 2 segundos
  setTimeout(() => {
    try {
      console.log("🧪 Testando imports React...");
      
      // Teste se conseguimos importar React
      import("react").then((React) => {
        console.log("✅ React importado:", React);
        
        import("react-dom/client").then((ReactDOM) => {
          console.log("✅ ReactDOM importado:", ReactDOM);
          
          // Teste se conseguimos criar um elemento React
          const element = React.createElement("div", {
            style: { 
              background: "#dcfce7", 
              padding: "1rem", 
              borderRadius: "8px",
              color: "#166534"
            }
          }, "🎉 REACT FUNCIONANDO!");
          
          // Teste se conseguimos renderizar
          const root = ReactDOM.createRoot(document.getElementById("react-test"));
          root.render(element);
          
          console.log("✅ React renderizado com sucesso!");
          
        }).catch(err => {
          console.error("❌ Erro no ReactDOM:", err);
          document.getElementById("react-test").innerHTML = `
            <p style="color: red;">❌ Erro ReactDOM: ${err.message}</p>
          `;
        });
        
      }).catch(err => {
        console.error("❌ Erro no React import:", err);
        document.getElementById("react-test").innerHTML = `
          <p style="color: red;">❌ Erro React import: ${err.message}</p>
        `;
      });
      
    } catch (error) {
      console.error("❌ Erro geral:", error);
      document.getElementById("react-test").innerHTML = `
        <p style="color: red;">❌ Erro geral: ${error.message}</p>
      `;
    }
  }, 2000);
}

console.log("🔍 Diagnóstico iniciado - verifique a página");