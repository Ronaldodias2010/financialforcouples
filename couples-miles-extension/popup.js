/**
 * Couples Miles Extension - Popup Script v2.0
 * 
 * Usa chrome.scripting.executeScript para execução sob demanda.
 * Não depende de content scripts fixos.
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
  'latam.com': { name: 'LATAM Pass', code: 'latam_pass', icon: '✈️' },
  'tudoazul.com.br': { name: 'Azul Fidelidade', code: 'azul', icon: '💙' },
  'smiles.com.br': { name: 'Smiles', code: 'smiles', icon: '😊' },
  'livelo.com.br': { name: 'Livelo', code: 'livelo', icon: '💜' }
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

// ============= UNIVERSAL EXTRACTOR ENGINE =============
// Esta função é injetada diretamente na página via chrome.scripting.executeScript
function universalExtractorEngine() {
  // Normaliza número no formato brasileiro (183.401 -> 183401)
  function normalize(value) {
    return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10);
  }

  // Valida se valor está em faixa aceitável
  function isValid(value) {
    return value > 100 && value < 10000000;
  }

  // Calcula score de confiança do candidato
  function calculateScore(el, value) {
    let score = 0;
    const context = el.closest('div')?.innerText || '';
    const parentContext = el.parentElement?.innerText || '';

    // Contexto positivo básico
    if (/milhas|pontos|saldo|miles|points/i.test(context)) score += 40;
    
    // Tag relevante
    if (/H1|H2|H3/.test(el.tagName)) score += 20;
    if (el.tagName === 'STRONG' || el.tagName === 'B') score += 15;
    if (el.tagName === 'SPAN') score += 10;

    // Contexto positivo forte (LATAM específico)
    if (/milhas acumuladas|total acumulado|saldo atual|seu saldo|available miles/i.test(context)) {
      score += 50;
    }

    // Proximidade com elemento lb1-miles-amount (LATAM)
    if (el.closest('#lb1-miles-amount')) {
      score += 100;
    }

    // Contexto negativo (promoções, metas)
    if (/meta|campanha|promoção|ganhe até|desafio|bonus|promo|earn up to/i.test(context)) {
      score -= 40;
    }

    // Penaliza se o contexto menciona "por" ou "cada" (taxas de conversão)
    if (/por\s+\d|cada\s+\d|per\s+\d/i.test(parentContext)) {
      score -= 30;
    }

    return score;
  }

  // Verifica se é página de saldo
  function isBalancePage() {
    const text = document.body.innerText || '';
    return /milhas|saldo|milhas acumuladas|total acumulado|pontos disponíveis|seu saldo|your miles|available miles/i.test(text);
  }

  // Verifica indicadores de login
  function isLoggedIn() {
    const loginIndicators = [
      '#lb1-miles-amount',
      '[data-testid="user-menu"]',
      '.user-logged',
      '.user-name',
      '[class*="UserMenu"]',
      '[class*="logged"]',
      '[class*="LoggedUser"]',
      '.user-logged-in'
    ];
    
    for (const selector of loginIndicators) {
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

      const score = calculateScore(el, value);
      candidates.push({ 
        value, 
        score, 
        rawText: text,
        tag: el.tagName 
      });
    }
  }

  // Se não encontrou candidatos, retorna resultado negativo
  if (candidates.length === 0) {
    return {
      success: false,
      error: 'no_candidates',
      isBalancePage: isBalancePage(),
      isLoggedIn: isLoggedIn()
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
      return;
    }

    // Step 2: Verifica se é um domínio suportado
    updateStatus('checking_page');
    
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
      updateStatus('wrong_page', 'Este site não é suportado.');
      return;
    }

    // Step 3: Executa o extrator diretamente na página
    updateStatus('extracting');
    
    let result;
    try {
      const injectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: universalExtractorEngine
      });
      
      result = injectionResult[0]?.result;
    } catch (scriptError) {
      console.error('Erro ao executar script:', scriptError);
      updateStatus('api_error', 'Não foi possível acessar esta página. Verifique as permissões.');
      return;
    }

    console.log('Resultado da extração:', result);

    // Step 4: Processa resultado
    if (!result) {
      updateStatus('api_error', 'Erro ao processar página.');
      return;
    }

    if (!result.isLoggedIn) {
      updateStatus('wrong_page', 'Faça login no site antes de sincronizar.');
      return;
    }

    if (!result.isBalancePage) {
      updateStatus('wrong_page', 'Navegue até a página onde seu saldo esteja visível.');
      return;
    }

    if (!result.success) {
      if (result.error === 'low_confidence') {
        updateStatus('not_found', `Saldo incerto (${result.bestValue}). Navegue até página principal.`);
      } else {
        updateStatus('not_found', 'Saldo não encontrado nesta página.');
      }
      return;
    }

    // Step 5: Envia para o backend
    updateStatus('sending');
    
    const syncData = {
      program: matchedProgram.code,
      programName: matchedProgram.name,
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
      return;
    }

    // Step 6: Sucesso!
    const formattedBalance = formatNumber(result.balance);
    updateStatus('success', `Saldo sincronizado: ${formattedBalance} milhas`);
    
    elements.resultBalance.textContent = `${formattedBalance} milhas`;
    elements.resultSection.classList.remove('hidden');

  } catch (error) {
    console.error('Erro na sincronização:', error);
    updateStatus('api_error', 'Falha na comunicação. Tente novamente.');
  } finally {
    state.isLoading = true;
    elements.syncBtn.disabled = false;
    elements.syncBtn.querySelector('.sync-text').textContent = 'Sincronizar Milhas';
    state.isLoading = false;
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
