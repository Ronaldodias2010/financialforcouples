console.log("TESTE BÁSICO - Se aparece no console, React está carregando");

const root = document.getElementById("root");
if (root) {
  root.innerHTML = `
    <div style="min-height: 100vh; background: white; padding: 2rem; font-family: system-ui;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h1 style="color: #059669; font-size: 2.5rem; margin-bottom: 1rem;">
          Couples Financials
        </h1>
        <p style="font-size: 1.25rem; margin-bottom: 2rem; color: #374151;">
          Sistema Funcionando ✅
        </p>
        <div style="background: #d1fae5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <p style="color: #065f46; font-size: 1.125rem;">
            🚀 Sistema restaurado com sucesso!
          </p>
        </div>
        <button onclick="window.location.href='/app'" 
                style="background: #059669; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer;">
          Acessar Dashboard
        </button>
      </div>
    </div>
  `;
}