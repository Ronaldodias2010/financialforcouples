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
  // LATAM Pass - Atualizado para layout 2024/2025
  // IMPORTANTE: Suporta múltiplos domínios (latam.com, latamairlines.com, latampass.com)
  latam: {
    domain: 'latam.com', // Domínio principal (compatibilidade)
    domains: ['latam.com', 'latamairlines.com', 'latampass.com'], // Todos os domínios
    programName: 'LATAM Pass',
    programCode: 'latam_pass',
    selectors: [
      // Seletor principal - estrutura atual do site LATAM (2025)
      // O saldo aparece como "183.401" dentro da seção "Milhas acumuladas"
      '#lb1-miles-amount strong',
      '#lb1-miles-amount h3 strong',
      '#lb1-miles-amount span strong',
      '#lb1-miles-amount',
      // Estrutura latamairlines.com e latampass.com
      '[class*="milhas"] strong',
      '[class*="miles"] strong',
      '[class*="balance"] strong',
      '[class*="accumulated"] strong',
      '[class*="acumuladas"] strong',
      // Fallbacks gerais para outras estruturas possíveis
      '[data-testid="miles-balance"]',
      '[data-testid="accumulated-miles"]',
      '.miles-balance-value',
      '.user-miles-balance',
      '[class*="MilesBalance"]',
      '[class*="AccumulatedMiles"]',
      '.header-miles',
      // Busca mais genérica em containers de perfil
      '[class*="profile"] [class*="miles"]',
      '[class*="account"] [class*="miles"]',
      '[class*="summary"] strong',
      // Seletores específicos para latamairlines.com
      '[class*="minha-conta"] strong',
      '[class*="my-account"] strong'
    ],
    loginIndicators: [
      '#lb1-miles-amount',
      '[data-testid="user-menu"]',
      '.user-logged',
      '.user-name',
      '[class*="UserMenu"]',
      '[class*="logged"]',
      '[class*="profile"]',
      // Indicadores de conta LATAM Pass
      '[class*="category"]',
      '[class*="Categoria"]',
      // Indicadores para latamairlines.com
      '[class*="account"]',
      '[class*="minha-conta"]'
    ],
    balanceRegex: /[\d.,]+/,
    requiresWait: true // Indica que precisa aguardar carregamento dinâmico
  },

  // Azul Fidelidade (TudoAzul) - Atualizado para layout 2025
  // IMPORTANTE: Suporta múltiplos domínios (voeazul.com.br, tudoazul.voeazul.com.br)
  azul: {
    domain: 'voeazul.com.br', // Domínio principal (compatibilidade)
    domains: ['voeazul.com.br', 'tudoazul.voeazul.com.br'], // Todos os domínios
    programName: 'Azul Fidelidade',
    programCode: 'azul',
    selectors: [
      // Seletores para o portal TudoAzul
      '[class*="pontos"]',
      '[class*="points"]',
      '[class*="saldo"]',
      '[class*="balance"]',
      '[class*="tudoazul"]',
      // Seletores para header/menu do usuário
      '[class*="user"] [class*="pontos"]',
      '[class*="header"] [class*="pontos"]',
      '[class*="menu"] [class*="pontos"]',
      '[class*="account"] [class*="pontos"]',
      // Seletores genéricos
      '[data-testid="points-balance"]',
      '.points-balance',
      '.tudoazul-points',
      '.user-points-value',
      '[class*="Points"]',
      '.balance-value',
      '#balance-points',
      // Busca em containers de perfil
      '[class*="profile"] [class*="pontos"]',
      '[class*="minha-conta"] [class*="pontos"]'
    ],
    loginIndicators: [
      '[class*="logged"]',
      '[class*="user"]',
      '[class*="account"]',
      '[class*="minha-conta"]',
      '[class*="profile"]',
      '.user-logged-in',
      '[data-testid="user-area"]',
      '.user-menu-logged',
      '[class*="LoggedUser"]',
      // Presença do saldo indica login
      '[class*="pontos"]'
    ],
    balanceRegex: /[\d.,]+/,
    requiresWait: true // Site tem carregamento dinâmico
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

  // Livelo - Atualizado para layout 2025
  // Saldo aparece no header como "1.762 pontos" ao lado do nome do usuário
  livelo: {
    domain: 'livelo.com.br',
    programName: 'Livelo',
    programCode: 'livelo',
    selectors: [
      // Seletor principal - header com pontos (estrutura atual 2025)
      // O saldo aparece como "1.762 pontos" no menu do usuário
      '[class*="header"] [class*="pontos"]',
      '[class*="header"] [class*="points"]',
      '[class*="user"] [class*="pontos"]',
      '[class*="menu"] [class*="pontos"]',
      // Busca por texto "pontos" próximo ao nome do usuário
      '[class*="account"] [class*="pontos"]',
      '[class*="minha-conta"] [class*="pontos"]',
      // Seletores genéricos
      '[data-testid="points-balance"]',
      '.livelo-points',
      '.points-value',
      '[class*="pontos"]',
      '[class*="Points"]',
      '.user-balance',
      '#points-balance',
      '.header-points',
      // Busca em containers de perfil/conta
      '[class*="profile"] [class*="pontos"]',
      '[class*="saldo"]',
      '[class*="balance"]'
    ],
    loginIndicators: [
      // Indicador de login - nome do usuário ou saudação "Olá, NOME"
      '[class*="user"]',
      '[class*="logged"]',
      '[class*="account"]',
      '[class*="minha-conta"]',
      '.user-logged',
      '[data-testid="user-logged"]',
      '.livelo-user-area',
      '[class*="LoggedUser"]',
      // Presença do saldo indica login
      '[class*="pontos"]'
    ],
    balanceRegex: /[\d.,]+/,
    requiresWait: true // Site pode ter carregamento dinâmico
  }
};

// Função para detectar programa atual baseado no domínio
// Suporta múltiplos domínios por programa (ex: LATAM tem 3 domínios)
function detectCurrentProgram() {
  const hostname = window.location.hostname.toLowerCase();
  
  for (const [key, config] of Object.entries(MILEAGE_SELECTORS)) {
    // Verificar array de domínios (novo formato)
    if (config.domains && Array.isArray(config.domains)) {
      for (const domain of config.domains) {
        if (hostname.includes(domain)) {
          return { key, config };
        }
      }
    }
    // Fallback para domínio único (formato antigo)
    if (hostname.includes(config.domain)) {
      return { key, config };
    }
  }
  
  return null;
}

// Função para normalizar número de milhas
// Suporta formatos: "183.401" (BR), "183,401" (US), "183401"
function normalizeBalance(text) {
  if (!text) return 0;
  
  // Remove espaços, quebras de linha e texto não-numérico
  let cleaned = text.replace(/\s+/g, '').trim();
  
  // Extrai apenas a parte numérica (números, pontos e vírgulas)
  const numericPart = cleaned.match(/[\d.,]+/);
  if (!numericPart) return 0;
  
  cleaned = numericPart[0];
  
  // Detecta formato brasileiro (1.234 ou 1.234,56) vs americano (1,234 ou 1,234.56)
  // Formato BR: pontos como separador de milhar, vírgula como decimal
  // Formato US: vírgulas como separador de milhar, ponto como decimal
  
  const hasCommaAsDecimal = /\d+\.\d{3},\d{1,2}$/.test(cleaned);
  const hasDotAsDecimal = /\d+,\d{3}\.\d{1,2}$/.test(cleaned);
  const isBrazilianThousands = /^\d{1,3}(\.\d{3})+$/.test(cleaned); // 183.401
  const isAmericanThousands = /^\d{1,3}(,\d{3})+$/.test(cleaned); // 183,401
  
  if (hasCommaAsDecimal || isBrazilianThousands) {
    // Formato brasileiro: remove pontos (separador de milhar)
    cleaned = cleaned.replace(/\./g, '');
    // Se tiver vírgula decimal, troca por ponto
    cleaned = cleaned.replace(',', '.');
  } else if (hasDotAsDecimal || isAmericanThousands) {
    // Formato americano: remove vírgulas (separador de milhar)
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Formato simples ou ambíguo: remove todos os separadores
    cleaned = cleaned.replace(/[.,]/g, '');
  }
  
  // Extrai apenas números inteiros (milhas são sempre inteiras)
  const match = cleaned.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Função para aguardar elemento no DOM (para sites com carregamento dinâmico/React)
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // Verifica se já existe
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    
    const interval = 100;
    let elapsed = 0;
    
    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
        return;
      }
      
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        reject(new Error(`Elemento não encontrado: ${selector}`));
      }
    }, interval);
  });
}

// Função para aguardar qualquer um dos seletores
async function waitForAnySelector(selectors, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return { element: el, selector };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Nenhum seletor encontrado após timeout');
}

// Exporta para uso no content.js
if (typeof window !== 'undefined') {
  window.MILEAGE_SELECTORS = MILEAGE_SELECTORS;
  window.detectCurrentProgram = detectCurrentProgram;
  window.normalizeBalance = normalizeBalance;
  window.waitForElement = waitForElement;
  window.waitForAnySelector = waitForAnySelector;
}
