/**
 * Couples Miles Extension - Selectors Configuration
 * 
 * Este arquivo contém os seletores DOM para cada programa de milhagem.
 * Atualize aqui quando os sites mudarem seus layouts.
 * 
 * IMPORTANTE: Estes seletores são para extração client-side apenas.
 * Nenhum scraping server-side é realizado.
 */

const MILEAGE_SELECTORS = {
  // LATAM Pass
  latam: {
    domain: 'latam.com',
    programName: 'LATAM Pass',
    programCode: 'latam_pass',
    selectors: [
      // Múltiplos seletores para maior resiliência
      '[data-testid="miles-balance"]',
      '.miles-balance-value',
      '.user-miles-balance',
      '.latam-pass-miles',
      '[class*="miles"] [class*="balance"]',
      '[class*="MilesBalance"]',
      // Fallback: buscar elementos com texto de milhas
      '.header-miles',
      '#miles-container .value'
    ],
    loginIndicators: [
      '[data-testid="user-menu"]',
      '.user-logged',
      '.user-name',
      '[class*="UserMenu"]'
    ],
    balanceRegex: /[\d.,]+/
  },

  // Azul Fidelidade (TudoAzul)
  azul: {
    domain: 'tudoazul.com.br',
    programName: 'Azul Fidelidade',
    programCode: 'azul',
    selectors: [
      '[data-testid="points-balance"]',
      '.points-balance',
      '.tudoazul-points',
      '.user-points-value',
      '[class*="pontos"]',
      '[class*="Points"]',
      '.balance-value',
      '#balance-points'
    ],
    loginIndicators: [
      '.user-logged-in',
      '[data-testid="user-area"]',
      '.user-menu-logged',
      '[class*="LoggedUser"]'
    ],
    balanceRegex: /[\d.,]+/
  },

  // Smiles
  smiles: {
    domain: 'smiles.com.br',
    programName: 'Smiles',
    programCode: 'smiles',
    selectors: [
      '[data-testid="miles-balance"]',
      '.smiles-balance',
      '.user-miles',
      '[class*="milhas"]',
      '[class*="Miles"]',
      '.balance-miles-value',
      '#smiles-balance',
      '.header-miles-balance'
    ],
    loginIndicators: [
      '.user-logged',
      '[data-testid="logged-user"]',
      '.smiles-user-menu',
      '[class*="UserLogged"]'
    ],
    balanceRegex: /[\d.,]+/
  },

  // Livelo
  livelo: {
    domain: 'livelo.com.br',
    programName: 'Livelo',
    programCode: 'livelo',
    selectors: [
      '[data-testid="points-balance"]',
      '.livelo-points',
      '.points-value',
      '[class*="pontos"]',
      '[class*="Points"]',
      '.user-balance',
      '#points-balance',
      '.header-points'
    ],
    loginIndicators: [
      '.user-logged',
      '[data-testid="user-logged"]',
      '.livelo-user-area',
      '[class*="LoggedUser"]'
    ],
    balanceRegex: /[\d.,]+/
  }
};

// Função para detectar programa atual baseado no domínio
function detectCurrentProgram() {
  const hostname = window.location.hostname.toLowerCase();
  
  for (const [key, config] of Object.entries(MILEAGE_SELECTORS)) {
    if (hostname.includes(config.domain)) {
      return { key, config };
    }
  }
  
  return null;
}

// Função para normalizar número de milhas
function normalizeBalance(text) {
  if (!text) return 0;
  
  // Remove espaços e caracteres especiais, mantendo apenas números
  let cleaned = text.replace(/\s/g, '');
  
  // Detecta formato brasileiro (1.234,56) vs americano (1,234.56)
  const hasCommaAsDecimal = /\d+\.\d{3},\d{2}$/.test(cleaned);
  const hasDotAsDecimal = /\d+,\d{3}\.\d{2}$/.test(cleaned);
  
  if (hasCommaAsDecimal) {
    // Formato brasileiro: remove pontos, troca vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDotAsDecimal) {
    // Formato americano: remove vírgulas
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Formato simples: remove pontos e vírgulas extras
    cleaned = cleaned.replace(/[.,]/g, '');
  }
  
  // Extrai apenas números
  const match = cleaned.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Exporta para uso no content.js
if (typeof window !== 'undefined') {
  window.MILEAGE_SELECTORS = MILEAGE_SELECTORS;
  window.detectCurrentProgram = detectCurrentProgram;
  window.normalizeBalance = normalizeBalance;
}
