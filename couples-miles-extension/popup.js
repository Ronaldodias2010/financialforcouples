/**
 * Couples Miles Extension - Popup Script
 * 
 * Gerencia a interface do popup e interação com o usuário.
 */

// Elementos DOM
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
  resultBalance: document.getElementById('result-balance')
};

// Estado da aplicação
let state = {
  hasConsent: false,
  isAuthenticated: false,
  currentTab: null,
  currentProgram: null,
  isLoading: false
};

// Programas suportados
const SUPPORTED_DOMAINS = {
  'latam.com': { name: 'LATAM Pass', code: 'latam_pass', icon: '✈️' },
  'tudoazul.com.br': { name: 'Azul Fidelidade', code: 'azul', icon: '💙' },
  'smiles.com.br': { name: 'Smiles', code: 'smiles', icon: '😊' },
  'livelo.com.br': { name: 'Livelo', code: 'livelo', icon: '💜' }
};

// API URL
const SUPABASE_URL = 'https://elxttabdtddlavhseipz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E';

// Inicialização
document.addEventListener('DOMContentLoaded', init);

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

// Mostra modal de consentimento
function showConsentModal() {
  hideAllSections();
  elements.consentModal.classList.remove('hidden');
}

// Mostra seção de login
function showLoginSection() {
  hideAllSections();
  elements.loginSection.classList.remove('hidden');
}

// Mostra seção principal
function showMainSection() {
  hideAllSections();
  elements.mainSection.classList.remove('hidden');
}

// Mostra seção não suportado
function showNotSupportedSection() {
  hideAllSections();
  elements.notSupportedSection.classList.remove('hidden');
}

// Esconde todas as seções
function hideAllSections() {
  elements.consentModal.classList.add('hidden');
  elements.loginSection.classList.add('hidden');
  elements.mainSection.classList.add('hidden');
  elements.notSupportedSection.classList.add('hidden');
}

// Detecta aba atual e programa
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

    // Verifica se é um domínio suportado
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
    
    // Atualiza UI
    elements.programName.textContent = matchedProgram.name;
    elements.siteDomain.textContent = hostname;
    
    // Verifica status do login no site
    await checkSiteStatus();
    
    showMainSection();

  } catch (error) {
    console.error('Erro ao detectar aba:', error);
    showNotSupportedSection();
  }
}

// Verifica status do site (login, etc)
async function checkSiteStatus() {
  try {
    const response = await chrome.tabs.sendMessage(state.currentTab.id, {
      action: 'checkStatus'
    });

    if (response && response.success) {
      const isLoggedIn = response.data.isLoggedIn;
      
      if (isLoggedIn) {
        elements.statusBadge.textContent = 'Logado';
        elements.statusBadge.className = 'badge success';
        elements.syncBtn.disabled = false;
        elements.actionMessage.textContent = 'Clique para sincronizar seu saldo';
      } else {
        elements.statusBadge.textContent = 'Não logado';
        elements.statusBadge.className = 'badge warning';
        elements.syncBtn.disabled = true;
        elements.actionMessage.textContent = 'Faça login no site primeiro';
      }
    } else {
      // Content script pode não estar carregado
      elements.statusBadge.textContent = 'Verificando...';
      elements.statusBadge.className = 'badge';
      elements.syncBtn.disabled = false;
      elements.actionMessage.textContent = 'Tente sincronizar após fazer login';
    }

    // Verifica rate limit
    const rateLimit = await sendMessage({
      action: 'checkRateLimit',
      programCode: state.currentProgram.code
    });

    if (!rateLimit.allowed) {
      elements.syncBtn.disabled = true;
      elements.actionMessage.textContent = rateLimit.message;
    }

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    elements.statusBadge.textContent = 'Erro';
    elements.statusBadge.className = 'badge error';
    elements.syncBtn.disabled = false;
    elements.actionMessage.textContent = 'Tente sincronizar manualmente';
  }
}

// Event Listeners
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
    // Autentica com Supabase
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

    // Salva token
    await sendMessage({ action: 'setAuth', token: data.access_token });
    state.isAuthenticated = true;

    // Vai para seção principal
    await detectCurrentTab();

  } catch (error) {
    console.error('Erro no login:', error);
    alert(error.message || 'Erro ao fazer login');
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Entrar';
  }
});

elements.syncBtn.addEventListener('click', async () => {
  if (state.isLoading) return;
  
  state.isLoading = true;
  elements.syncBtn.disabled = true;
  elements.syncBtn.querySelector('.sync-text').textContent = 'Sincronizando...';
  elements.resultSection.classList.add('hidden');
  elements.actionMessage.textContent = '';

  try {
    // Extrai saldo via content script
    const extractResult = await chrome.tabs.sendMessage(state.currentTab.id, {
      action: 'extractBalance'
    });

    if (!extractResult || !extractResult.success) {
      throw new Error(extractResult?.message || 'Não foi possível extrair o saldo');
    }

    // Envia para API via background
    const syncResult = await sendMessage({
      action: 'syncMiles',
      data: extractResult.data
    });

    if (!syncResult.success) {
      throw new Error(syncResult.message || 'Erro ao sincronizar');
    }

    // Sucesso!
    elements.resultBalance.textContent = `${extractResult.data.balance.toLocaleString('pt-BR')} milhas`;
    elements.resultSection.classList.remove('hidden');
    elements.actionMessage.textContent = 'Sincronizado com sucesso!';
    elements.actionMessage.className = 'action-message success';

  } catch (error) {
    console.error('Erro na sincronização:', error);
    elements.actionMessage.textContent = error.message;
    elements.actionMessage.className = 'action-message error';
  } finally {
    state.isLoading = false;
    elements.syncBtn.disabled = false;
    elements.syncBtn.querySelector('.sync-text').textContent = 'Sincronizar Milhas';
  }
});

elements.logoutBtn.addEventListener('click', async () => {
  await sendMessage({ action: 'logout' });
  state.isAuthenticated = false;
  showLoginSection();
});

// Envia mensagem para background script
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}
