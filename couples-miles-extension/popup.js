/**
 * Couples Miles Extension - Popup Script v2.2
 * 
 * AUDITORIA COMPLETA - Correções:
 * - Todo código encapsulado em DOMContentLoaded
 * - Validação de elementos DOM antes de uso
 * - STATUS_CONFIG completo e validado
 * - Logs estratégicos para debug
 * - Badge visual funcionando
 * - Fallback multi-programa
 * - Sem erros de sintaxe ou escopo
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [Couples Miles] Extensão inicializada');

  // ============= CONSTANTS =============
  const STATUS_CONFIG = {
    idle: { icon: '⏳', message: 'Pronto para sincronizar.', type: 'idle', showSpinner: false },
    checking_page: { icon: '🔍', message: 'Verificando página...', type: 'checking_page', showSpinner: true },
    extracting: { icon: '📊', message: 'Localizando saldo...', type: 'extracting', showSpinner: true },
    sending: { icon: '📤', message: 'Enviando saldo...', type: 'sending', showSpinner: true },
    success: { icon: '✅', message: 'Sincronizado com sucesso!', type: 'success', showSpinner: false },
    not_found: { icon: '❌', message: 'Saldo não encontrado.', type: 'not_found', showSpinner: false },
    wrong_page: { icon: '⚠️', message: 'Página incorreta.', type: 'wrong_page', showSpinner: false },
    api_error: { icon: '🔴', message: 'Erro de conexão.', type: 'api_error', showSpinner: false },
    not_logged: { icon: '🔒', message: 'Faça login no site primeiro.', type: 'not_logged', showSpinner: false }
  };

  const SUPPORTED_DOMAINS = {
    'latam.com': { name: 'LATAM Pass', code: 'latam_pass', programKey: 'latam', icon: '✈️' },
    'tudoazul.com.br': { name: 'Azul Fidelidade', code: 'azul', programKey: 'azul', icon: '💙' },
    'smiles.com.br': { name: 'Smiles', code: 'smiles', programKey: 'smiles', icon: '😊' },
    'livelo.com.br': { name: 'Livelo', code: 'livelo', programKey: 'livelo', icon: '💜' }
  };

  const SUPABASE_URL = 'https://elxttabdtddlavhseipz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E';

  // ============= DOM ELEMENTS (com validação) =============
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

  // Validar elementos DOM
  const missingElements = [];
  Object.entries(elements).forEach(([key, value]) => {
    if (!value) {
      missingElements.push(key);
    }
  });

  if (missingElements.length > 0) {
    console.warn('⚠️ [Couples Miles] Elementos DOM não encontrados:', missingElements);
  } else {
    console.log('✅ [Couples Miles] Todos elementos DOM encontrados');
  }

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

    try {
      chrome.action.setBadgeText({ text: texts[badgeState] || '' });
      chrome.action.setBadgeBackgroundColor({ color: colors[badgeState] || '#000000' });
      console.log('🏷️ [Badge] Estado:', badgeState);
    } catch (err) {
      console.error('❌ [Badge] Erro ao definir badge:', err);
    }
  }

  function clearBadge() {
    try {
      chrome.action.setBadgeText({ text: '' });
      console.log('🏷️ [Badge] Limpo');
    } catch (err) {
      console.error('❌ [Badge] Erro ao limpar badge:', err);
    }
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
    
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      for (const [domain, program] of Object.entries(SUPPORTED_DOMAINS)) {
        if (hostname.includes(domain)) {
          return program;
        }
      }
    } catch (err) {
      console.error('❌ [Program] Erro ao parsear URL:', err);
    }
    
    return null;
  }

  // ============= UNIVERSAL EXTRACTOR ENGINE v2.3 =============
  // Função injetada via chrome.scripting.executeScript
  // Estrutura simplificada e estável
  function universalExtractorEngine(program) {
    console.log('🔄 [Extractor v2.3] Iniciando para programa:', program);

    // ===== HELPER: Normaliza número brasileiro =====
    function normalize(value) {
      return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
    }

    // ===== HELPER: Valida faixa aceitável =====
    function isValid(value) {
      return value > 100 && value < 10000000;
    }

    // ===== HELPER: Verifica página de saldo =====
    function isBalancePage() {
      const text = document.body.innerText || '';
      return /milhas|pontos|saldo|miles|points|acumulad/i.test(text);
    }

    // ===== HELPER: Verifica login =====
    function isLoggedIn(programKey) {
      // Indicadores específicos por programa
      const indicators = {
        latam: ['#lb1-miles-amount', '[class*="logged"]', '[class*="UserMenu"]'],
        azul: ['[class*="logged"]', '[class*="user-menu"]'],
        smiles: ['[class*="logged"]', '[class*="user"]'],
        livelo: ['[class*="logged"]', '[class*="user"]']
      };
      
      const selectors = indicators[programKey] || [];
      for (const sel of selectors) {
        if (document.querySelector(sel)) return true;
      }
      
      // Fallback genérico
      if (document.querySelector('[class*="logged"]')) return true;
      if (document.querySelector('[class*="user-menu"]')) return true;
      
      return false;
    }

    // ===== HELPER: Calcula score =====
    function calculateScore(el, value, programKey) {
      let score = 50; // Base
      const context = (el.closest('div')?.innerText || '').toLowerCase();

      // Contexto positivo
      if (/milhas|pontos|saldo|miles|points/i.test(context)) score += 30;
      if (/acumulad|disponív|total|seu saldo|your/i.test(context)) score += 20;

      // Tags relevantes
      if (/^H[1-3]$/.test(el.tagName)) score += 15;
      if (el.tagName === 'STRONG' || el.tagName === 'B') score += 10;

      // Ajustes por programa
      if (programKey === 'latam') {
        if (el.closest('#lb1-miles-amount')) score += 80;
        if (/latam pass|milhas latam/i.test(context)) score += 30;
      }
      if (programKey === 'azul') {
        if (/tudoazul|pontos azul/i.test(context)) score += 30;
      }
      if (programKey === 'smiles') {
        if (/smiles|milhas smiles/i.test(context)) score += 30;
      }
      if (programKey === 'livelo') {
        if (/livelo|pontos livelo/i.test(context)) score += 30;
      }

      // Penaliza contextos negativos
      if (/campanha|promoção|ganhe|meta|bonus|transferir|resgatar/i.test(context)) {
        score -= 40;
      }

      return score;
    }

    // ===== EXTRAÇÃO PRINCIPAL =====
    const regex = /^\d{1,3}(\.\d{3})+$/;
    const elements = document.querySelectorAll('h1, h2, h3, span, strong, b, div, p');
    const candidates = [];

    console.log('🔍 [Extractor] Analisando', elements.length, 'elementos...');

    for (const el of elements) {
      const text = el.innerText?.trim();
      if (!text) continue;

      if (regex.test(text)) {
        const value = normalize(text);
        if (!isValid(value)) continue;

        const score = calculateScore(el, value, program);
        candidates.push({
          value: value,
          rawText: text,
          score: score,
          tag: el.tagName
        });
      }
    }

    console.log('💰 [Extractor] Candidatos encontrados:', candidates.length);

    // Sem candidatos
    if (candidates.length === 0) {
      return {
        success: false,
        error: 'no_candidates',
        isBalancePage: isBalancePage(),
        isLoggedIn: isLoggedIn(program),
        program: program
      };
    }

    // Bonus para maior valor
    const maxVal = Math.max(...candidates.map(c => c.value));
    candidates.forEach(c => {
      if (c.value === maxVal) c.score += 15;
    });

    // Ordena por score
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    console.log('🏆 [Extractor] Top 3 candidatos:');
    candidates.slice(0, 3).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.value} (score: ${c.score}, tag: ${c.tag})`);
    });

    // Valida score mínimo
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

    // Score insuficiente
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

  // ============= HELPER FUNCTIONS =============

  function updateStatus(statusState, customMessage = '') {
    // Validação de segurança
    if (!elements.statusFeedback || !elements.statusIcon || !elements.statusText) {
      console.error('❌ [Status] Elementos de status não encontrados no DOM');
      return;
    }

    const config = STATUS_CONFIG[statusState];
    if (!config) {
      console.error('❌ [Status] Status inválido:', statusState);
      return;
    }

    elements.statusFeedback.classList.remove('hidden');
    elements.statusFeedback.className = `status-feedback ${config.type}`;
    
    if (config.showSpinner) {
      elements.statusIcon.innerHTML = '<span class="spinner"></span>';
    } else {
      elements.statusIcon.textContent = config.icon;
    }
    
    elements.statusText.textContent = customMessage || config.message;
    console.log('📊 [Status]', statusState, customMessage || config.message);
  }

  function hideAllSections() {
    if (elements.consentModal) elements.consentModal.classList.add('hidden');
    if (elements.loginSection) elements.loginSection.classList.add('hidden');
    if (elements.mainSection) elements.mainSection.classList.add('hidden');
    if (elements.notSupportedSection) elements.notSupportedSection.classList.add('hidden');
  }

  function showConsentModal() {
    hideAllSections();
    if (elements.consentModal) elements.consentModal.classList.remove('hidden');
  }

  function showLoginSection() {
    hideAllSections();
    if (elements.loginSection) elements.loginSection.classList.remove('hidden');
  }

  function showMainSection() {
    hideAllSections();
    if (elements.mainSection) elements.mainSection.classList.remove('hidden');
  }

  function showNotSupportedSection() {
    hideAllSections();
    if (elements.notSupportedSection) elements.notSupportedSection.classList.remove('hidden');
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
    if (state.isLoading) {
      console.log('⏳ [Sync] Já está em andamento...');
      return;
    }
    
    console.log('🔄 [Sync] Iniciando sincronização...');
    
    state.isLoading = true;
    
    if (elements.syncBtn) {
      elements.syncBtn.disabled = true;
      const syncText = elements.syncBtn.querySelector('.sync-text');
      if (syncText) syncText.textContent = 'Sincronizando...';
    }
    
    if (elements.resultSection) elements.resultSection.classList.add('hidden');
    if (elements.actionMessage) elements.actionMessage.textContent = '';

    try {
      // Step 1: Obtém a aba ativa
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        console.error('❌ [Sync] Não foi possível acessar a aba atual');
        updateStatus('api_error', 'Não foi possível acessar a aba atual.');
        setBadge('error');
        return;
      }

      console.log('📄 [Sync] Página detectada:', tab.url);

      // Step 2: Detecta o programa pelo URL
      updateStatus('checking_page');
      setBadge('loading');
      
      const programKey = detectProgram(tab.url);
      const programInfo = getProgramInfo(tab.url);

      if (!programKey || !programInfo) {
        console.warn('⚠️ [Sync] Site não suportado:', tab.url);
        updateStatus('wrong_page', 'Este site não é suportado.');
        setBadge('error');
        return;
      }

      console.log('✈️ [Sync] Programa detectado:', programKey, programInfo.name);

      // Step 3: Executa o extrator com o programa como argumento
      updateStatus('extracting');
      
      let result;
      try {
        const injectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: universalExtractorEngine,
          args: [programKey]
        });
        
        result = injectionResult[0]?.result;
        console.log('📊 [Sync] Resultado da extração:', result);
      } catch (scriptError) {
        console.error('❌ [Sync] Erro ao executar script:', scriptError);
        updateStatus('api_error', 'Não foi possível acessar esta página. Verifique as permissões.');
        setBadge('error');
        return;
      }

      // Step 4: Processa resultado
      if (!result) {
        console.error('❌ [Sync] Resultado vazio');
        updateStatus('api_error', 'Erro ao processar página.');
        setBadge('error');
        return;
      }

      console.log('👤 [Sync] Usuário logado:', result.isLoggedIn);
      console.log('📄 [Sync] É página de saldo:', result.isBalancePage);

      if (!result.isLoggedIn) {
        updateStatus('not_logged', 'Faça login no site antes de sincronizar.');
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

      console.log('📤 [Sync] Enviando dados:', syncData);

      const syncResult = await sendMessage({
        action: 'syncMiles',
        data: syncData
      });

      if (!syncResult.success) {
        console.error('❌ [Sync] Erro do backend:', syncResult.message);
        updateStatus('api_error', syncResult.message || 'Erro ao enviar saldo para o servidor.');
        setBadge('error');
        return;
      }

      // Step 6: Sucesso!
      const formattedBalance = formatNumber(result.balance);
      console.log('✅ [Sync] Sucesso! Saldo:', formattedBalance);
      updateStatus('success', `Saldo sincronizado: ${formattedBalance} milhas`);
      setBadge('success');
      
      if (elements.resultBalance) elements.resultBalance.textContent = `${formattedBalance} milhas`;
      if (elements.resultSection) elements.resultSection.classList.remove('hidden');

      // Limpa badge após 5 segundos
      setTimeout(() => clearBadge(), 5000);

    } catch (error) {
      console.error('❌ [Sync] Erro geral:', error);
      updateStatus('api_error', 'Falha na comunicação. Tente novamente.');
      setBadge('error');
    } finally {
      state.isLoading = false;
      if (elements.syncBtn) {
        elements.syncBtn.disabled = false;
        const syncText = elements.syncBtn.querySelector('.sync-text');
        if (syncText) syncText.textContent = 'Sincronizar Milhas';
      }
    }
  }

  // ============= TAB DETECTION =============

  async function detectCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      state.currentTab = tab;

      if (!tab || !tab.url) {
        console.warn('⚠️ [Tab] Aba sem URL');
        showNotSupportedSection();
        return;
      }

      console.log('🔍 [Tab] URL atual:', tab.url);

      let hostname;
      try {
        hostname = new URL(tab.url).hostname.toLowerCase();
      } catch (err) {
        console.error('❌ [Tab] Erro ao parsear URL:', err);
        showNotSupportedSection();
        return;
      }

      let matchedProgram = null;
      for (const [domain, program] of Object.entries(SUPPORTED_DOMAINS)) {
        if (hostname.includes(domain)) {
          matchedProgram = program;
          break;
        }
      }

      if (!matchedProgram) {
        console.log('ℹ️ [Tab] Site não suportado:', hostname);
        showNotSupportedSection();
        return;
      }

      console.log('✅ [Tab] Programa detectado:', matchedProgram.name);

      state.currentProgram = matchedProgram;
      
      if (elements.programName) elements.programName.textContent = matchedProgram.name;
      if (elements.siteDomain) elements.siteDomain.textContent = hostname;
      if (elements.statusBadge) {
        elements.statusBadge.textContent = 'Detectado';
        elements.statusBadge.className = 'badge success';
      }
      if (elements.syncBtn) elements.syncBtn.disabled = false;
      if (elements.actionMessage) elements.actionMessage.textContent = 'Clique para sincronizar seu saldo';
      
      // Verifica rate limit
      const rateLimit = await sendMessage({
        action: 'checkRateLimit',
        programCode: matchedProgram.code
      });

      if (!rateLimit.allowed) {
        if (elements.syncBtn) elements.syncBtn.disabled = true;
        if (elements.actionMessage) elements.actionMessage.textContent = rateLimit.message;
      }

      showMainSection();

    } catch (error) {
      console.error('❌ [Tab] Erro ao detectar aba:', error);
      showNotSupportedSection();
    }
  }

  // ============= INITIALIZATION =============

  async function init() {
    console.log('🔧 [Init] Iniciando...');

    // Verifica consentimento
    const consentResult = await sendMessage({ action: 'checkConsent' });
    state.hasConsent = consentResult.hasConsent;
    console.log('📋 [Init] Consentimento:', state.hasConsent);

    if (!state.hasConsent) {
      showConsentModal();
      return;
    }

    // Verifica autenticação
    const authResult = await sendMessage({ action: 'checkAuth' });
    state.isAuthenticated = authResult.authenticated;
    console.log('🔐 [Init] Autenticado:', state.isAuthenticated);

    if (!state.isAuthenticated) {
      showLoginSection();
      return;
    }

    // Detecta aba atual
    await detectCurrentTab();
  }

  // ============= EVENT LISTENERS =============

  // Consent
  if (elements.acceptConsentBtn) {
    elements.acceptConsentBtn.addEventListener('click', async () => {
      console.log('✅ [Consent] Aceito');
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
  }

  // Login
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', async () => {
      const email = elements.emailInput?.value.trim();
      const password = elements.passwordInput?.value;

      if (!email || !password) {
        alert('Preencha email e senha');
        return;
      }

      elements.loginBtn.disabled = true;
      elements.loginBtn.textContent = 'Entrando...';

      try {
        console.log('🔐 [Login] Tentando login...');
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

        console.log('✅ [Login] Sucesso');
        await sendMessage({ action: 'setAuth', token: data.access_token });
        state.isAuthenticated = true;

        await detectCurrentTab();

      } catch (error) {
        console.error('❌ [Login] Erro:', error);
        alert(error.message || 'Erro ao fazer login');
      } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Entrar';
      }
    });
  }

  // Sync
  if (elements.syncBtn) {
    elements.syncBtn.addEventListener('click', handleSync);
  }

  // Logout
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async () => {
      console.log('👋 [Logout] Saindo...');
      await sendMessage({ action: 'logout' });
      state.isAuthenticated = false;
      showLoginSection();
    });
  }

  // ============= START =============
  init();

}); // Fim do DOMContentLoaded
