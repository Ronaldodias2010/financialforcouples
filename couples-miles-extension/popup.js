/**
 * Couples Miles Extension - Popup Script v2.4
 * 
 * REESTRUTURAÇÃO COMPLETA E DEFINITIVA
 * - Todo código encapsulado em DOMContentLoaded
 * - Nenhum await fora de função async
 * - Nenhum return fora de função
 * - Todas as chaves {} balanceadas
 * - chrome.scripting apenas dentro do click handler async
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 [Couples Miles] Extensão inicializada v2.4');

  // ================= CONSTANTS =================
  var SUPABASE_URL = 'https://elxttabdtddlavhseipz.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E';

  var SUPPORTED_DOMAINS = {
    'latam.com': { name: 'LATAM Pass', code: 'latam_pass', programKey: 'latam', icon: '✈️' },
    'tudoazul.com.br': { name: 'Azul Fidelidade', code: 'azul', programKey: 'azul', icon: '💙' },
    'smiles.com.br': { name: 'Smiles', code: 'smiles', programKey: 'smiles', icon: '😊' },
    'livelo.com.br': { name: 'Livelo', code: 'livelo', programKey: 'livelo', icon: '💜' }
  };

  // ================= STATUS CONFIG =================
  var STATUS_CONFIG = {
    idle: { type: 'neutral', icon: '⏳', message: 'Pronto para sincronizar.', showSpinner: false },
    checking_page: { type: 'loading', icon: '🔍', message: 'Verificando página...', showSpinner: true },
    extracting: { type: 'loading', icon: '📊', message: 'Localizando saldo...', showSpinner: true },
    sending: { type: 'loading', icon: '📤', message: 'Enviando saldo...', showSpinner: true },
    success: { type: 'success', icon: '✅', message: 'Sincronizado com sucesso!', showSpinner: false },
    not_found: { type: 'warning', icon: '❌', message: 'Saldo não encontrado.', showSpinner: false },
    wrong_page: { type: 'warning', icon: '⚠️', message: 'Página incorreta.', showSpinner: false },
    api_error: { type: 'error', icon: '🔴', message: 'Erro de conexão.', showSpinner: false },
    not_logged: { type: 'warning', icon: '🔒', message: 'Faça login no site primeiro.', showSpinner: false }
  };

  // ================= ELEMENTS =================
  var elements = {
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
  var missingElements = [];
  Object.keys(elements).forEach(function(key) {
    if (!elements[key]) {
      missingElements.push(key);
    }
  });

  if (missingElements.length > 0) {
    console.warn('⚠️ [Couples Miles] Elementos DOM não encontrados:', missingElements);
  } else {
    console.log('✅ [Couples Miles] Todos elementos DOM encontrados');
  }

  // ================= STATE =================
  var state = {
    hasConsent: false,
    isAuthenticated: false,
    currentTab: null,
    currentProgram: null,
    isLoading: false
  };

  // ================= HELPER FUNCTIONS =================

  function formatNumber(num) {
    return num.toLocaleString('pt-BR');
  }

  function sendMessage(message) {
    return new Promise(function(resolve) {
      chrome.runtime.sendMessage(message, function(response) {
        resolve(response || {});
      });
    });
  }

  function detectProgram(url) {
    if (!url) return null;
    var lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('latam.com')) return 'latam';
    if (lowerUrl.includes('tudoazul.com')) return 'azul';
    if (lowerUrl.includes('smiles.com')) return 'smiles';
    if (lowerUrl.includes('livelo.com')) return 'livelo';
    
    return null;
  }

  function getProgramInfo(url) {
    if (!url) return null;
    
    try {
      var hostname = new URL(url).hostname.toLowerCase();
      var domains = Object.keys(SUPPORTED_DOMAINS);
      
      for (var i = 0; i < domains.length; i++) {
        var domain = domains[i];
        if (hostname.includes(domain)) {
          return SUPPORTED_DOMAINS[domain];
        }
      }
    } catch (err) {
      console.error('❌ [Program] Erro ao parsear URL:', err);
    }
    
    return null;
  }

  function setBadge(badgeState) {
    var colors = {
      success: '#1DB954',
      error: '#FF4C4C',
      loading: '#FFA500'
    };

    var texts = {
      success: '✓',
      error: '!',
      loading: '...'
    };

    try {
      chrome.action.setBadgeText({ text: texts[badgeState] || '' });
      chrome.action.setBadgeBackgroundColor({ color: colors[badgeState] || '#000000' });
    } catch (err) {
      console.error('❌ [Badge] Erro:', err);
    }
  }

  function clearBadge() {
    try {
      chrome.action.setBadgeText({ text: '' });
    } catch (err) {
      console.error('❌ [Badge] Erro ao limpar:', err);
    }
  }

  // ================= UPDATE STATUS =================

  function updateStatus(statusState, customMessage) {
    var config = STATUS_CONFIG[statusState];
    if (!config) {
      console.error('❌ [Status] Status inválido:', statusState);
      return;
    }

    if (!elements.statusFeedback || !elements.statusIcon || !elements.statusText) {
      console.error('❌ [Status] Elementos de status não encontrados');
      return;
    }

    elements.statusFeedback.classList.remove('hidden');
    elements.statusFeedback.className = 'status-feedback ' + config.type;

    if (config.showSpinner) {
      elements.statusIcon.innerHTML = '<span class="spinner"></span>';
    } else {
      elements.statusIcon.textContent = config.icon;
    }

    elements.statusText.textContent = customMessage || config.message;
    console.log('📊 [Status]', statusState, customMessage || config.message);
  }

  // ================= UI FUNCTIONS =================

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

  // ================= EXTRACTOR ENGINE =================

  function universalExtractorEngine(program) {
    console.log('🔄 [Extractor] Iniciando para programa:', program);

    function normalize(value) {
      return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
    }

    function isValid(value) {
      return value > 100 && value < 10000000;
    }

    function isBalancePage() {
      var text = document.body.innerText || '';
      return /milhas|pontos|saldo|miles|points|acumulad/i.test(text);
    }

    function isLoggedIn(programKey) {
      var indicators = {
        latam: ['#lb1-miles-amount', '[class*="logged"]', '[class*="UserMenu"]'],
        azul: ['[class*="logged"]', '[class*="user-menu"]'],
        smiles: ['[class*="logged"]', '[class*="user"]'],
        livelo: ['[class*="logged"]', '[class*="user"]']
      };
      
      var selectors = indicators[programKey] || [];
      for (var i = 0; i < selectors.length; i++) {
        if (document.querySelector(selectors[i])) return true;
      }
      
      if (document.querySelector('[class*="logged"]')) return true;
      if (document.querySelector('[class*="user-menu"]')) return true;
      
      return false;
    }

    function calculateScore(el, value, programKey) {
      var score = 50;
      var context = (el.closest('div') ? el.closest('div').innerText : '').toLowerCase();

      if (/milhas|pontos|saldo|miles|points/i.test(context)) score += 30;
      if (/acumulad|disponív|total|seu saldo|your/i.test(context)) score += 20;

      if (/^H[1-3]$/.test(el.tagName)) score += 15;
      if (el.tagName === 'STRONG' || el.tagName === 'B') score += 10;

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

      if (/campanha|promoção|ganhe|meta|bonus|transferir|resgatar/i.test(context)) {
        score -= 40;
      }

      return score;
    }

    var regex = /^\d{1,3}(\.\d{3})+$/;
    var pageElements = document.querySelectorAll('h1, h2, h3, span, strong, b, div, p');
    var candidates = [];

    for (var i = 0; i < pageElements.length; i++) {
      var el = pageElements[i];
      var text = el.innerText ? el.innerText.trim() : '';
      if (!text) continue;

      if (regex.test(text)) {
        var value = normalize(text);
        if (!isValid(value)) continue;

        var score = calculateScore(el, value, program);
        candidates.push({
          value: value,
          rawText: text,
          score: score,
          tag: el.tagName
        });
      }
    }

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'no_candidates',
        isBalancePage: isBalancePage(),
        isLoggedIn: isLoggedIn(program),
        program: program
      };
    }

    var maxVal = 0;
    for (var j = 0; j < candidates.length; j++) {
      if (candidates[j].value > maxVal) maxVal = candidates[j].value;
    }
    
    for (var k = 0; k < candidates.length; k++) {
      if (candidates[k].value === maxVal) candidates[k].score += 15;
    }

    candidates.sort(function(a, b) { return b.score - a.score; });
    var best = candidates[0];

    if (best.score >= 50) {
      return {
        success: true,
        balance: best.value,
        rawText: best.rawText,
        score: best.score,
        confidence: best.score >= 100 ? 'high' : (best.score >= 70 ? 'medium' : 'low'),
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

  // ================= SYNC CLICK HANDLER =================

  if (elements.syncBtn) {
    elements.syncBtn.addEventListener('click', async function() {
      if (state.isLoading) {
        console.log('⏳ [Sync] Já está em andamento...');
        return;
      }
      
      console.log('🔄 [Sync] Iniciando sincronização...');
      
      state.isLoading = true;
      elements.syncBtn.disabled = true;
      
      var syncText = elements.syncBtn.querySelector('.sync-text');
      if (syncText) syncText.textContent = 'Sincronizando...';
      
      if (elements.resultSection) elements.resultSection.classList.add('hidden');
      if (elements.actionMessage) elements.actionMessage.textContent = '';

      try {
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        var tab = tabs[0];
        
        if (!tab || !tab.id) {
          console.error('❌ [Sync] Não foi possível acessar a aba atual');
          updateStatus('api_error', 'Não foi possível acessar a aba atual.');
          setBadge('error');
          return;
        }

        console.log('📄 [Sync] Página detectada:', tab.url);
        updateStatus('checking_page');
        setBadge('loading');
        
        var programKey = detectProgram(tab.url);
        var programInfo = getProgramInfo(tab.url);

        if (!programKey || !programInfo) {
          console.warn('⚠️ [Sync] Site não suportado:', tab.url);
          updateStatus('wrong_page', 'Este site não é suportado.');
          setBadge('error');
          return;
        }

        console.log('✈️ [Sync] Programa detectado:', programKey, programInfo.name);
        updateStatus('extracting');
        
        var result;
        try {
          var injectionResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: universalExtractorEngine,
            args: [programKey]
          });
          
          result = injectionResult[0] ? injectionResult[0].result : null;
          console.log('📊 [Sync] Resultado da extração:', result);
        } catch (scriptError) {
          console.error('❌ [Sync] Erro ao executar script:', scriptError);
          updateStatus('api_error', 'Não foi possível acessar esta página.');
          setBadge('error');
          return;
        }

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
            updateStatus('not_found', 'Saldo incerto (' + formatNumber(result.bestValue) + '). Navegue até página principal.');
          } else {
            updateStatus('not_found', 'Saldo não encontrado nesta página.');
          }
          setBadge('error');
          return;
        }

        updateStatus('sending');
        
        var syncData = {
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

        var syncResult = await sendMessage({
          action: 'syncMiles',
          data: syncData
        });

        if (!syncResult.success) {
          console.error('❌ [Sync] Erro do backend:', syncResult.message);
          updateStatus('api_error', syncResult.message || 'Erro ao enviar saldo para o servidor.');
          setBadge('error');
          return;
        }

        var formattedBalance = formatNumber(result.balance);
        console.log('✅ [Sync] Sucesso! Saldo:', formattedBalance);
        updateStatus('success', 'Saldo sincronizado: ' + formattedBalance + ' milhas');
        setBadge('success');
        
        if (elements.resultBalance) elements.resultBalance.textContent = formattedBalance + ' milhas';
        if (elements.resultSection) elements.resultSection.classList.remove('hidden');

        setTimeout(function() { clearBadge(); }, 5000);

      } catch (error) {
        console.error('❌ [Sync] Erro geral:', error);
        updateStatus('api_error', 'Falha na comunicação. Tente novamente.');
        setBadge('error');
      } finally {
        state.isLoading = false;
        if (elements.syncBtn) {
          elements.syncBtn.disabled = false;
          var syncTextEl = elements.syncBtn.querySelector('.sync-text');
          if (syncTextEl) syncTextEl.textContent = 'Sincronizar Milhas';
        }
      }
    });
  }

  // ================= CONSENT HANDLER =================

  if (elements.acceptConsentBtn) {
    elements.acceptConsentBtn.addEventListener('click', async function() {
      console.log('✅ [Consent] Aceito');
      await sendMessage({ action: 'setConsent', accepted: true });
      state.hasConsent = true;
      
      var authResult = await sendMessage({ action: 'checkAuth' });
      state.isAuthenticated = authResult.authenticated;

      if (!state.isAuthenticated) {
        showLoginSection();
      } else {
        await detectCurrentTab();
      }
    });
  }

  // ================= LOGIN HANDLER =================

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', async function() {
      var email = elements.emailInput ? elements.emailInput.value.trim() : '';
      var password = elements.passwordInput ? elements.passwordInput.value : '';

      if (!email || !password) {
        alert('Preencha email e senha');
        return;
      }

      elements.loginBtn.disabled = true;
      elements.loginBtn.textContent = 'Entrando...';

      try {
        console.log('🔐 [Login] Tentando login...');
        var response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ email: email, password: password })
        });

        var data = await response.json();

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

  // ================= LOGOUT HANDLER =================

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async function() {
      console.log('👋 [Logout] Saindo...');
      await sendMessage({ action: 'logout' });
      state.isAuthenticated = false;
      showLoginSection();
    });
  }

  // ================= TAB DETECTION =================

  async function detectCurrentTab() {
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      var tab = tabs[0];
      state.currentTab = tab;

      if (!tab || !tab.url) {
        console.warn('⚠️ [Tab] Aba sem URL');
        showNotSupportedSection();
        return;
      }

      console.log('🔍 [Tab] URL atual:', tab.url);

      var hostname;
      try {
        hostname = new URL(tab.url).hostname.toLowerCase();
      } catch (err) {
        console.error('❌ [Tab] Erro ao parsear URL:', err);
        showNotSupportedSection();
        return;
      }

      var matchedProgram = null;
      var domains = Object.keys(SUPPORTED_DOMAINS);
      for (var i = 0; i < domains.length; i++) {
        var domain = domains[i];
        if (hostname.includes(domain)) {
          matchedProgram = SUPPORTED_DOMAINS[domain];
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
      
      var rateLimit = await sendMessage({
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

  // ================= INITIALIZATION =================

  async function init() {
    console.log('🔧 [Init] Iniciando...');

    var consentResult = await sendMessage({ action: 'checkConsent' });
    state.hasConsent = consentResult.hasConsent;
    console.log('📋 [Init] Consentimento:', state.hasConsent);

    if (!state.hasConsent) {
      showConsentModal();
      return;
    }

    var authResult = await sendMessage({ action: 'checkAuth' });
    state.isAuthenticated = authResult.authenticated;
    console.log('🔐 [Init] Autenticado:', state.isAuthenticated);

    if (!state.isAuthenticated) {
      showLoginSection();
      return;
    }

    await detectCurrentTab();
  }

  // ================= START =================
  init();

});
