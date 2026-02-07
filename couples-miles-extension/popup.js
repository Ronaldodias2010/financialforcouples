/**
 * Couples Miles Extension - Popup Script v2.1
 * 
 * Usa chrome.scripting.executeScript para execução sob demanda.
 * Inclui sistema de badge visual e suporte multi-programa.
 */

// ============= DOM ELEMENTS =============
const elements = {
  consentModal: document.getElementById('consent-modal'),
  acceptConsentBtn: document.getElementById('accept-consent'),
  loginSection: document.getElementById('login-section'),
  mainSection: document.getElementById('main-section'),
  notSupportedSection: document.getElementById('not-supported-section'),
  emailInput: document.getElementById('email-input'),
  passwordInput: document.getElementById('password-input'),
  loginBtn: document.getElementById('login-btn'),
  syncBtn: document.getElementById('sync-btn'),
  logoutBtn: document.getElementById('logout-btn'),
  programName: document.getElementById('program-name'),
  siteDomain: document.getElementById('site-domain'),
  statusBadge: document.getElementById('status-badge'),
  actionMessage: document.getElementById('action-message'),
  resultSection: document.getElementById('result-section'),
  resultBalance: document.getElementById('result-balance'),
  statusFeedback: document.getElementById('status-feedback'),
  statusIcon: document.getElementById('status-icon'),
  statusText: document.getElementById('status-text')
};

// ============= CONSTANTS =============
const STATUS_CONFIG = {
  idle: { icon: '⏳', message: 'Pronto para sincronizar.', type: 'idle' },
  checking_page: { icon: '🔍', message: 'Verificando página...', type: 'checking_page', showSpinner: true },
  extracting: { icon: '📊', message: 'Localizando saldo...', type: 'extracting', showSpinner: true },
  sending: { icon: '📤', message: 'Enviando saldo...', type: 'sending', showSpinner: true },
  success: { icon: '✅', type: 'success' },
  not_found: { icon: '❌', type: 'not_found' },
  wrong_page: { icon: '⚠️', type: 'wrong_page' },
  api_error: { icon: '🔴', type: 'api_error' }
};

const SUPPORTED_DOMAINS = {
  'latam.com': { name: 'LATAM Pass', code: 'latam_pass', programKey: 'latam', icon: '✈️' },
  'tudoazul.com.br': { name: 'Azul Fidelidade', code: 'azul', programKey: 'azul', icon: '💙' },
  'smiles.com.br': { name: 'Smiles', code: 'smiles', programKey: 'smiles', icon: '😊' },
  'livelo.com.br': { name: 'Livelo', code: 'livelo', programKey: 'livelo', icon: '💜' }
};

const SUPABASE_URL = 'https://elxttabdtddlavhseipz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E';

// ============= STATE =============
let state = {
  hasConsent: false,
  isAuthenticated: false,
  currentTab: null,
  currentProgram: null,
  isLoading: false
};

// ============= BADGE SYSTEM =============
function setBadge(badgeState) {
  const colors = {
    success: '#1DB954',  // verde
    error: '#FF4C4C',    // vermelho
    loading: '#FFA500'   // amarelo
  };

  const texts = {
    success: '✓',
    error: '!',
    loading: '...'
  };

  chrome.action.setBadgeText({ text: texts[badgeState] || '' });
  chrome.action.setBadgeBackgroundColor({ color: colors[badgeState] || '#000000' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

// ============= PROGRAM DETECTION =============
function detectProgram(url) {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('latam.com')) return 'latam';
  if (lowerUrl.includes('tudoazul.com')) return 'azul';
  if (lowerUrl.includes('smiles.com')) return 'smiles';
  if (lowerUrl.includes('livelo.com')) return 'livelo';
  
  return null;
}

function getProgramInfo(url) {
  if (!url) return null;
  const hostname = new URL(url).hostname.toLowerCase();
  
  for (const [domain, program] of Object.entries(SUPPORTED_DOMAINS)) {
    if (hostname.includes(domain)) {
      return program;
    }
  }
  return null;
}

// ============= UNIVERSAL EXTRACTOR ENGINE =============
// Esta função é injetada diretamente na página via chrome.scripting.executeScript
// Recebe o programa como argumento para ajustes contextuais
function universalExtractorEngine(program) {
  // Normaliza número no formato brasileiro (183.401 -> 183401)
  function normalize(value) {
    return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10);
  }

  // Valida se valor está em faixa aceitável
  function isValid(value) {
    return value > 100 && value < 10000000;
  }

  // Calcula score de confiança do candidato com ajustes por programa
  function calculateScore(el, value, programKey) {
    let score = 0;
    const context = el.closest('div')?.innerText || '';
    const parentContext = el.parentElement?.innerText || '';

    // Contexto positivo básico (todos os programas)
    if (/milhas|pontos|saldo|miles|points/i.test(context)) score += 40;
    
    // Tag relevante
    if (/H1|H2|H3/.test(el.tagName)) score += 20;
    if (el.tagName === 'STRONG' || el.tagName === 'B') score += 15;
    if (el.tagName === 'SPAN') score += 10;

    // ========== AJUSTES POR PROGRAMA ==========
    
    if (programKey === 'latam') {
      // LATAM Pass - ajustes específicos
      if (/milhas acumuladas|total acumulado|saldo atual|seu saldo|available miles/i.test(context)) {
        score += 50;
      }
      // Proximidade com elemento lb1-miles-amount
      if (el.closest('#lb1-miles-amount')) {
        score += 100;
      }
      // Contexto negativo
      if (/meta|campanha|promoção|ganhe até|desafio|bonus/i.test(context)) {
        score -= 40;
      }
    }
    
    if (programKey === 'azul') {
      // Azul Fidelidade (TudoAzul)
      if (/tudoazul|pontos tudoazul|saldo de pontos|seus pontos/i.test(context)) {
        score += 50;
      }
      if (el.closest('[class*="points"]') || el.closest('[class*="pontos"]')) {
        score += 30;
      }
    }
    
    if (programKey === 'smiles') {
      // Smiles
      if (/milhas smiles|saldo smiles|suas milhas|milhas disponíveis/i.test(context)) {
        score += 50;
      }
      if (el.closest('[class*="miles"]') || el.closest('[class*="smiles"]')) {
        score += 30;
      }
    }
    
    if (programKey === 'livelo') {
      // Livelo
      if (/pontos livelo|saldo livelo|seus pontos|pontos disponíveis/i.test(context)) {
        score += 50;
      }
      if (el.closest('[class*="points"]') || el.closest('[class*="livelo"]')) {
        score += 30;
      }
    }

    // Penaliza contextos de conversão/taxas (todos os programas)
    if (/por\s+\d|cada\s+\d|per\s+\d|a partir de|from\s+\d/i.test(parentContext)) {
      score -= 30;
    }

    return score;
  }

  // Verifica se é página de saldo
  function isBalancePage() {
    const text = document.body.innerText || '';
    return /milhas|saldo|milhas acumuladas|total acumulado|pontos disponíveis|seu saldo|your miles|available miles|seus pontos/i.test(text);
  }

  // Verifica indicadores de login por programa
  function isLoggedIn(programKey) {
    const loginIndicators = {
      latam: [
        '#lb1-miles-amount',
        '[data-testid="user-menu"]',
        '.user-logged',
        '[class*="UserMenu"]',
        '[class*="logged"]'
      ],
      azul: [
        '.user-logged-in',
        '[data-testid="user-area"]',
        '.user-menu-logged',
        '[class*="LoggedUser"]'
      ],
      smiles: [
        '.user-logged',
        '[data-testid="logged-user"]',
        '.smiles-user-menu',
        '[class*="UserLogged"]'
      ],
      livelo: [
        '.user-logged',
        '[data-testid="user-logged"]',
        '.livelo-user-area',
        '[class*="LoggedUser"]'
      ]
    };
    
    const selectors = loginIndicators[programKey] || [];
    
    for (const selector of selectors) {
      if (document.querySelector(selector)) {
        return true;
      }
    }
    
    // Fallback genérico
    const genericSelectors = [
      '[class*="logged"]',
      '[class*="user-menu"]',
      '[class*="UserMenu"]'
    ];
    
    for (const selector of genericSelectors) {
      if (document.querySelector(selector)) {
        return true;
      }
    }
    
    return false;
  }

  // Regex para números no formato brasileiro
  const regex = /^\d{1,3}(\.\d{3})+$/;
  const elements = document.querySelectorAll('h1, h2, h3, span, strong, b, div, p');

  const candidates = [];

  for (const el of elements) {
    const text = el.innerText?.trim();
    if (!text) continue;

    // Verifica se é um número no formato brasileiro
    if (regex.test(text)) {
      const value = normalize(text);
      if (!isValid(value)) continue;

      const score = calculateScore(el, value, program);
      candidates.push({ 
        value, 
        score, 
        rawText: text,
        tag: el.tagName 
      });
    }
  }

  // Se não encontrou candidatos
  if (candidates.length === 0) {
    return {
      success: false,
      error: 'no_candidates',
      isBalancePage: isBalancePage(),
      isLoggedIn: isLoggedIn(program),
      program: program
    };
  }

  // Bonus para o maior valor
  const maxValue = Math.max(...candidates.map(c => c.value));
  candidates.forEach(c => {
    if (c.value === maxValue) c.score += 15;
  });

  // Ordena por score
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];

  // Só retorna se score for suficiente
  if (best.score >= 50) {
    return {
      success: true,
      balance: best.value,
      rawText: best.rawText,
      score: best.score,
      confidence: best.score >= 100 ? 'high' : best.score >= 70 ? 'medium' : 'low',
      isBalancePage: isBalancePage(),
      isLoggedIn: isLoggedIn(program),
      candidatesCount: candidates.length,
      program: program
    };
  }

  return {
    success: false,
    error: 'low_confidence',
    bestScore: best.score,
    bestValue: best.value,
    isBalancePage: isBalancePage(),
    isLoggedIn: isLoggedIn(program),
    program: program
  };
}

  // Bonus para o maior valor
  const maxValue = Math.max(...candidates.map(c => c.value));
  candidates.forEach(c => {
    if (c.value === maxValue) c.score += 15;
  });

  // Ordena por score
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];

  // Só retorna se score for suficiente
  if (best.score >= 50) {
    return {
      success: true,
      balance: best.value,
      rawText: best.rawText,
      score: best.score,
      confidence: best.score >= 100 ? 'high' : best.score >= 70 ? 'medium' : 'low',
      isBalancePage: isBalancePage(),
      isLoggedIn: isLoggedIn(),
      candidatesCount: candidates.length
    };
  }

  return {
    success: false,
    error: 'low_confidence',
    bestScore: best.score,
    bestValue: best.value,
    isBalancePage: isBalancePage(),
    isLoggedIn: isLoggedIn()
  };
}

// ============= HELPER FUNCTIONS =============

function updateStatus(statusState, customMessage = '') {
  const config = STATUS_CONFIG[statusState];
  if (!config) return;

  elements.statusFeedback.classList.remove('hidden');
  elements.statusFeedback.className = `status-feedback ${config.type}`;
  
  if (config.showSpinner) {
    elements.statusIcon.innerHTML = '<span class="spinner"></span>';
  } else {
    elements.statusIcon.textContent = config.icon;
  }
  
  elements.statusText.textContent = customMessage || config.message;
}

function hideAllSections() {
  elements.consentModal.classList.add('hidden');
  elements.loginSection.classList.add('hidden');
  elements.mainSection.classList.add('hidden');
  elements.notSupportedSection.classList.add('hidden');
}

function showConsentModal() {
  hideAllSections();
  elements.consentModal.classList.remove('hidden');
}

function showLoginSection() {
  hideAllSections();
  elements.loginSection.classList.remove('hidden');
}

function showMainSection() {
  hideAllSections();
  elements.mainSection.classList.remove('hidden');
}

function showNotSupportedSection() {
  hideAllSections();
  elements.notSupportedSection.classList.remove('hidden');
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}

function formatNumber(num) {
  return num.toLocaleString('pt-BR');
}

// ============= MAIN SYNC FUNCTION =============

async function handleSync() {
  if (state.isLoading) return;
  
  state.isLoading = true;
  elements.syncBtn.disabled = true;
  elements.syncBtn.querySelector('.sync-text').textContent = 'Sincronizando...';
  elements.resultSection.classList.add('hidden');
  elements.actionMessage.textContent = '';

  try {
    // Step 1: Obtém a aba ativa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      updateStatus('api_error', 'Não foi possível acessar a aba atual.');
      setBadge('error');
      return;
    }

    // Step 2: Detecta o programa pelo URL
    updateStatus('checking_page');
    setBadge('loading');
    
    const programKey = detectProgram(tab.url);
    const programInfo = getProgramInfo(tab.url);

    if (!programKey || !programInfo) {
      updateStatus('wrong_page', 'Este site não é suportado.');
      setBadge('error');
      return;
    }

    // Step 3: Executa o extrator com o programa como argumento
    updateStatus('extracting');
    
    let result;
    try {
      const injectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: universalExtractorEngine,
        args: [programKey]  // Passa o programa como argumento
      });
      
      result = injectionResult[0]?.result;
    } catch (scriptError) {
      console.error('Erro ao executar script:', scriptError);
      updateStatus('api_error', 'Não foi possível acessar esta página. Verifique as permissões.');
      setBadge('error');
      return;
    }

    console.log('Resultado da extração:', result);

    // Step 4: Processa resultado
    if (!result) {
      updateStatus('api_error', 'Erro ao processar página.');
      setBadge('error');
      return;
    }

    if (!result.isLoggedIn) {
      updateStatus('wrong_page', 'Faça login no site antes de sincronizar.');
      setBadge('error');
      return;
    }

    if (!result.isBalancePage) {
      updateStatus('wrong_page', 'Navegue até a página onde seu saldo esteja visível.');
      setBadge('error');
      return;
    }

    if (!result.success) {
      if (result.error === 'low_confidence') {
        updateStatus('not_found', `Saldo incerto (${formatNumber(result.bestValue)}). Navegue até página principal.`);
      } else {
        updateStatus('not_found', 'Saldo não encontrado nesta página.');
      }
      setBadge('error');
      return;
    }

    // Step 5: Envia para o backend
    updateStatus('sending');
    
    const syncData = {
      program: programInfo.code,
      programName: programInfo.name,
      balance: result.balance,
      rawText: result.rawText,
      confidence: result.confidence,
      score: result.score,
      captured_at: new Date().toISOString(),
      url: tab.url
    };

    const syncResult = await sendMessage({
      action: 'syncMiles',
      data: syncData
    });

    if (!syncResult.success) {
      updateStatus('api_error', syncResult.message || 'Erro ao enviar saldo para o servidor.');
      setBadge('error');
      return;
    }

    // Step 6: Sucesso!
    const formattedBalance = formatNumber(result.balance);
    updateStatus('success', `Saldo sincronizado: ${formattedBalance} milhas`);
    setBadge('success');
    
    elements.resultBalance.textContent = `${formattedBalance} milhas`;
    elements.resultSection.classList.remove('hidden');

    // Limpa badge após 5 segundos
    setTimeout(() => clearBadge(), 5000);

  } catch (error) {
    console.error('Erro na sincronização:', error);
    updateStatus('api_error', 'Falha na comunicação. Tente novamente.');
    setBadge('error');
  } finally {
    state.isLoading = false;
    elements.syncBtn.disabled = false;
    elements.syncBtn.querySelector('.sync-text').textContent = 'Sincronizar Milhas';
  }
}

// ============= TAB DETECTION =============

async function detectCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    state.currentTab = tab;

    if (!tab || !tab.url) {
      showNotSupportedSection();
      return;
    }

    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase();

    let matchedProgram = null;
    for (const [domain, program] of Object.entries(SUPPORTED_DOMAINS)) {
      if (hostname.includes(domain)) {
        matchedProgram = program;
        break;
      }
    }

    if (!matchedProgram) {
      showNotSupportedSection();
      return;
    }

    state.currentProgram = matchedProgram;
    
    elements.programName.textContent = matchedProgram.name;
    elements.siteDomain.textContent = hostname;
    elements.statusBadge.textContent = 'Detectado';
    elements.statusBadge.className = 'badge success';
    elements.syncBtn.disabled = false;
    elements.actionMessage.textContent = 'Clique para sincronizar seu saldo';
    
    // Verifica rate limit
    const rateLimit = await sendMessage({
      action: 'checkRateLimit',
      programCode: matchedProgram.code
    });

    if (!rateLimit.allowed) {
      elements.syncBtn.disabled = true;
      elements.actionMessage.textContent = rateLimit.message;
    }

    showMainSection();

  } catch (error) {
    console.error('Erro ao detectar aba:', error);
    showNotSupportedSection();
  }
}

// ============= INITIALIZATION =============

async function init() {
  // Verifica consentimento
  const consentResult = await sendMessage({ action: 'checkConsent' });
  state.hasConsent = consentResult.hasConsent;

  if (!state.hasConsent) {
    showConsentModal();
    return;
  }

  // Verifica autenticação
  const authResult = await sendMessage({ action: 'checkAuth' });
  state.isAuthenticated = authResult.authenticated;

  if (!state.isAuthenticated) {
    showLoginSection();
    return;
  }

  // Detecta aba atual
  await detectCurrentTab();
}

// ============= EVENT LISTENERS =============

document.addEventListener('DOMContentLoaded', init);

elements.acceptConsentBtn.addEventListener('click', async () => {
  await sendMessage({ action: 'setConsent', accepted: true });
  state.hasConsent = true;
  
  const authResult = await sendMessage({ action: 'checkAuth' });
  state.isAuthenticated = authResult.authenticated;

  if (!state.isAuthenticated) {
    showLoginSection();
  } else {
    await detectCurrentTab();
  }
});

elements.loginBtn.addEventListener('click', async () => {
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;

  if (!email || !password) {
    alert('Preencha email e senha');
    return;
  }

  elements.loginBtn.disabled = true;
  elements.loginBtn.textContent = 'Entrando...';

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || 'Credenciais inválidas');
    }

    await sendMessage({ action: 'setAuth', token: data.access_token });
    state.isAuthenticated = true;

    await detectCurrentTab();

  } catch (error) {
    console.error('Erro no login:', error);
    alert(error.message || 'Erro ao fazer login');
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Entrar';
  }
});

elements.syncBtn.addEventListener('click', handleSync);

elements.logoutBtn.addEventListener('click', async () => {
  await sendMessage({ action: 'logout' });
  state.isAuthenticated = false;
  showLoginSection();
});
