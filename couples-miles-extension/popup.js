/**
 * Couples Miles Extension - Popup Script v2.7
 * 
 * FLUXO HÍBRIDO CORRIGIDO
 * - REGRA: Nunca navegar automaticamente
 * - REGRA: Sempre tentar extrair na página atual primeiro
 * - REGRA: Só mostrar opção de navegação manual se não encontrar saldo
 * - Estados: idle, awaiting_confirmation, manual_mode, synced
 * - Proteção contra execução dupla
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 [Couples Miles] Extensão inicializada v2.7 - Fluxo Híbrido Corrigido');

  // ================= CONSTANTS =================
  var SUPABASE_URL = 'https://elxttabdtddlavhseipz.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHR0YWJkdGRkbGF2aHNlaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTQ0OTMsImV4cCI6MjA2OTczMDQ5M30.r2-vpMnG9eyp7-pa1U_Mdj6qGW0VjQXbdppP50usC7E';

  // URLs das páginas de milhas para cada programa
  var SUPPORTED_DOMAINS = {
    // LATAM - Múltiplos domínios (latam.com, latamairlines.com, latampass.com)
    'latam.com': { 
      name: 'LATAM Pass', 
      code: 'latam_pass', 
      programKey: 'latam', 
      icon: '✈️', 
      milesUrl: 'https://www.latamairlines.com/br/pt/minha-conta' 
    },
    'latamairlines.com': { 
      name: 'LATAM Pass', 
      code: 'latam_pass', 
      programKey: 'latam', 
      icon: '✈️', 
      milesUrl: 'https://www.latamairlines.com/br/pt/minha-conta' 
    },
    'latampass.com': { 
      name: 'LATAM Pass', 
      code: 'latam_pass', 
      programKey: 'latam', 
      icon: '✈️', 
      milesUrl: 'https://latampass.com/myaccount' 
    },
    // Azul - Múltiplos domínios (voeazul.com.br, tudoazul.voeazul.com.br)
    'voeazul.com.br': { 
      name: 'Azul Fidelidade', 
      code: 'azul', 
      programKey: 'azul', 
      icon: '💙', 
      milesUrl: 'https://www.voeazul.com.br/home/br/pt/home',
      requiresClick: true, // Indica que usuário precisa clicar para ver pontos
      clickInstruction: 'Clique no seu nome para expandir o menu e ver seus pontos antes de sincronizar.'
    },
    'tudoazul.voeazul.com.br': { 
      name: 'Azul Fidelidade', 
      code: 'azul', 
      programKey: 'azul', 
      icon: '💙', 
      milesUrl: 'https://www.voeazul.com.br/home/br/pt/home',
      requiresClick: true,
      clickInstruction: 'Clique no seu nome para expandir o menu e ver seus pontos antes de sincronizar.'
    },
    'smiles.com.br': { 
      name: 'Smiles', 
      code: 'smiles', 
      programKey: 'smiles', 
      icon: '😊', 
      milesUrl: 'https://www.smiles.com.br/minha-conta' 
    },
    'livelo.com.br': { 
      name: 'Livelo', 
      code: 'livelo', 
      programKey: 'livelo', 
      icon: '💜', 
      milesUrl: 'https://www.livelo.com.br/minha-conta' 
    }
  };

  // ================= SYNC STATES =================
  var SYNC_STATE = {
    IDLE: 'idle',
    EXTRACTING: 'extracting',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    MANUAL_MODE: 'manual_mode',
    SYNCED: 'synced'
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
    statusText: document.getElementById('status-text'),
    // Elementos do fluxo híbrido
    actionSection: document.getElementById('action-section'),
    confirmationSection: document.getElementById('confirmation-section'),
    detectedBalance: document.getElementById('detected-balance'),
    confirmYesBtn: document.getElementById('confirm-yes-btn'),
    confirmNoBtn: document.getElementById('confirm-no-btn'),
    retrySection: document.getElementById('retry-section'),
    retrySyncBtn: document.getElementById('retry-sync-btn'),
    notFoundSection: document.getElementById('not-found-section'),
    goToMilesBtn: document.getElementById('go-to-miles-btn'),
    retryHereBtn: document.getElementById('retry-here-btn')
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
    isLoading: false,
    syncState: SYNC_STATE.IDLE,
    detectedData: null // Armazena dados detectados aguardando confirmação
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
    
    // LATAM - Múltiplos domínios
    if (lowerUrl.includes('latam.com') || 
        lowerUrl.includes('latamairlines.com') || 
        lowerUrl.includes('latampass.com')) {
      return 'latam';
    }
    // Azul - Múltiplos domínios
    if (lowerUrl.includes('voeazul.com') || 
        lowerUrl.includes('tudoazul.voeazul.com')) {
      return 'azul';
    }
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

  // ================= UI STATE MANAGEMENT =================

  function setSyncState(newState) {
    console.log('🔄 [SyncState] Transição:', state.syncState, '->', newState);
    state.syncState = newState;
    updateUIForState();
  }

  function updateUIForState() {
    // Esconder todas as seções de fluxo
    if (elements.actionSection) elements.actionSection.classList.add('hidden');
    if (elements.confirmationSection) elements.confirmationSection.classList.add('hidden');
    if (elements.retrySection) elements.retrySection.classList.add('hidden');
    if (elements.notFoundSection) elements.notFoundSection.classList.add('hidden');
    if (elements.resultSection) elements.resultSection.classList.add('hidden');

    switch (state.syncState) {
      case SYNC_STATE.IDLE:
        if (elements.actionSection) elements.actionSection.classList.remove('hidden');
        break;
      
      case SYNC_STATE.AUTO_DETECTED:
      case SYNC_STATE.AWAITING_CONFIRMATION:
        if (elements.confirmationSection) elements.confirmationSection.classList.remove('hidden');
        if (state.detectedData && elements.detectedBalance) {
          elements.detectedBalance.textContent = formatNumber(state.detectedData.balance);
        }
        break;
      
      case SYNC_STATE.MANUAL_MODE:
        if (elements.retrySection) elements.retrySection.classList.remove('hidden');
        break;
      
      case SYNC_STATE.SYNCED:
        if (elements.resultSection) elements.resultSection.classList.remove('hidden');
        if (elements.actionSection) elements.actionSection.classList.remove('hidden');
        break;
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
    updateUIForState();
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

  // ================= EXTRACTION FUNCTION =================

  async function performExtraction() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    
    if (!tab || !tab.id) {
      throw new Error('Não foi possível acessar a aba atual');
    }

    var programKey = detectProgram(tab.url);
    var programInfo = getProgramInfo(tab.url);

    if (!programKey || !programInfo) {
      throw new Error('Site não suportado');
    }

    state.currentProgram = programInfo;
    state.currentTab = tab;

    var injectionResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: universalExtractorEngine,
      args: [programKey]
    });
    
    var result = injectionResult[0] ? injectionResult[0].result : null;

    if (!result) {
      throw new Error('Erro ao processar página');
    }

    return {
      result: result,
      tab: tab,
      programInfo: programInfo
    };
  }

  // ================= SEND TO BACKEND =================

  async function sendToBackend(data) {
    console.log('📤 [Sync] Enviando dados:', data);

    var syncResult = await sendMessage({
      action: 'syncMiles',
      data: data
    });

    if (!syncResult.success) {
      throw new Error(syncResult.message || 'Erro ao enviar saldo para o servidor.');
    }

    return syncResult;
  }

  // ================= SYNC CLICK HANDLER =================
  // REGRA CRÍTICA: NUNCA navegar automaticamente
  // REGRA: Sempre tentar extração na página atual primeiro
  // REGRA: Só mostrar opção de navegação se usuário clicar no botão

  if (elements.syncBtn) {
    elements.syncBtn.addEventListener('click', async function() {
      console.log('🔄 [Sync] Botão clicado');
      
      // ============ PROTEÇÃO CONTRA EXECUÇÃO DUPLA ============
      if (state.isLoading) {
        console.log('⏳ [Sync] Já está em andamento, ignorando clique');
        return;
      }
      
      // ============ PROTEÇÃO: NÃO REINICIAR SE JÁ TEM DADOS ============
      if (state.syncState === SYNC_STATE.AWAITING_CONFIRMATION && state.detectedData) {
        console.log('⚠️ [Sync] Já há saldo aguardando confirmação. Use os botões Sim/Não.');
        return;
      }
      
      // ============ INICIAR EXTRAÇÃO ============
      console.log('🔄 [Sync] Iniciando extração na página ATUAL (SEM NAVEGAÇÃO)...');
      
      state.isLoading = true;
      state.syncState = SYNC_STATE.EXTRACTING;
      
      // Desabilitar botão e mostrar loading
      if (elements.syncBtn) {
        elements.syncBtn.disabled = true;
        var syncText = elements.syncBtn.querySelector('.sync-text');
        if (syncText) syncText.textContent = 'Localizando...';
      }
      
      // Esconder seções anteriores
      hideFlowSections();
      
      try {
        updateStatus('extracting', 'Procurando saldo na página atual...');
        setBadge('loading');
        
        // ============ PASSO 1: VERIFICAR SE PROGRAMA REQUER CLIQUE ============
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        var currentTab = tabs[0];
        var currentProgramInfo = getProgramInfo(currentTab.url);
        
        if (currentProgramInfo && currentProgramInfo.requiresClick) {
          console.log('⚠️ [Sync] Programa requer clique para ver pontos');
          updateStatus('idle', currentProgramInfo.clickInstruction);
        }
        
        // ============ PASSO 2: EXTRAIR NA PÁGINA ATUAL ============
        // IMPORTANTE: Não chamar chrome.tabs.update aqui!
        var extraction = await performExtraction();
        var result = extraction.result;
        var programInfo = extraction.programInfo;
        var tab = extraction.tab;

        console.log('📊 [Sync] Resultado da extração:', JSON.stringify(result, null, 2));

        // ============ SALDO ENCONTRADO - PARAR E MOSTRAR PREVIEW ============
        if (result && result.success && result.balance) {
          console.log('✅ [Sync] SALDO ENCONTRADO:', result.balance);
          console.log('✅ [Sync] Mostrando preview - NÃO navegando');
          
          // Armazenar dados para confirmação
          state.detectedData = {
            program: programInfo.code,
            programName: programInfo.name,
            balance: result.balance,
            rawText: result.rawText,
            confidence: result.confidence,
            score: result.score,
            captured_at: new Date().toISOString(),
            url: tab.url
          };

          // Esconder status e mostrar confirmação
          if (elements.statusFeedback) elements.statusFeedback.classList.add('hidden');
          
          // Atualizar UI para confirmação
          setSyncState(SYNC_STATE.AWAITING_CONFIRMATION);
          clearBadge();
          
          // ============ IMPORTANTE: RETORNAR AQUI - NÃO CONTINUAR ============
          console.log('✅ [Sync] Preview exibido. Aguardando confirmação do usuário.');
          state.isLoading = false;
          resetSyncButton();
          return; // <-- PARAR AQUI
        }

        // ============ SALDO NÃO ENCONTRADO ============
        console.log('❌ [Sync] Saldo não encontrado na página atual');
        
        // Determinar mensagem apropriada
        if (!result.isLoggedIn) {
          updateStatus('not_logged', 'Faça login no site antes de sincronizar.');
        } else if (!result.isBalancePage) {
          updateStatus('wrong_page', 'Esta não parece ser a página de saldo.');
        } else {
          updateStatus('not_found', 'Não encontramos saldo nesta página.');
        }
        
        // Limpar dados e mostrar opção de navegação manual
        state.detectedData = null;
        
        // Esconder action e mostrar not found
        if (elements.actionSection) elements.actionSection.classList.add('hidden');
        if (elements.notFoundSection) elements.notFoundSection.classList.remove('hidden');
        
        setBadge('error');
        state.syncState = SYNC_STATE.MANUAL_MODE;
        
        // ============ IMPORTANTE: NÃO NAVEGAR AUTOMATICAMENTE ============
        // Apenas mostrar o botão "Ir para página de milhas"

      } catch (error) {
        console.error('❌ [Sync] Erro:', error);
        updateStatus('api_error', error.message || 'Erro ao processar página.');
        setBadge('error');
        setSyncState(SYNC_STATE.IDLE);
      } finally {
        state.isLoading = false;
        resetSyncButton();
      }
    });
  }

  // ================= HELPER: ESCONDER SEÇÕES DO FLUXO =================
  function hideFlowSections() {
    if (elements.resultSection) elements.resultSection.classList.add('hidden');
    if (elements.notFoundSection) elements.notFoundSection.classList.add('hidden');
    if (elements.retrySection) elements.retrySection.classList.add('hidden');
    if (elements.confirmationSection) elements.confirmationSection.classList.add('hidden');
    if (elements.actionMessage) elements.actionMessage.textContent = '';
  }

  // ================= HELPER: RESETAR BOTÃO SYNC =================
  function resetSyncButton() {
    if (elements.syncBtn) {
      elements.syncBtn.disabled = false;
      var syncTextEl = elements.syncBtn.querySelector('.sync-text');
      if (syncTextEl) syncTextEl.textContent = 'Sincronizar Milhas';
    }
  }

  // ================= CONFIRM YES HANDLER =================

  if (elements.confirmYesBtn) {
    elements.confirmYesBtn.addEventListener('click', async function() {
      if (!state.detectedData) {
        console.error('❌ [Confirm] Sem dados detectados');
        return;
      }

      console.log('✅ [Confirm] Usuário confirmou o saldo');
      
      // Desabilitar botões
      elements.confirmYesBtn.disabled = true;
      elements.confirmNoBtn.disabled = true;
      elements.confirmYesBtn.textContent = '⏳ Enviando...';
      
      var confirmationCard = document.querySelector('.confirmation-card');
      if (confirmationCard) confirmationCard.classList.add('loading');

      try {
        setBadge('loading');
        
        await sendToBackend(state.detectedData);
        
        var formattedBalance = formatNumber(state.detectedData.balance);
        console.log('✅ [Sync] Sucesso! Saldo:', formattedBalance);
        
        if (elements.resultBalance) {
          elements.resultBalance.textContent = formattedBalance + ' milhas';
        }
        
        setBadge('success');
        setSyncState(SYNC_STATE.SYNCED);
        
        // Limpar dados detectados
        state.detectedData = null;

        setTimeout(function() { clearBadge(); }, 5000);

      } catch (error) {
        console.error('❌ [Confirm] Erro ao enviar:', error);
        updateStatus('api_error', error.message);
        setBadge('error');
        setSyncState(SYNC_STATE.IDLE);
      } finally {
        // Restaurar botões
        elements.confirmYesBtn.disabled = false;
        elements.confirmNoBtn.disabled = false;
        elements.confirmYesBtn.textContent = '✅ Sim, enviar';
        
        if (confirmationCard) confirmationCard.classList.remove('loading');
      }
    });
  }

  // ================= CONFIRM NO HANDLER =================

  if (elements.confirmNoBtn) {
    elements.confirmNoBtn.addEventListener('click', function() {
      console.log('❌ [Confirm] Usuário rejeitou o saldo');
      
      // Limpar dados detectados
      state.detectedData = null;
      
      // Mostrar seção de retry
      setSyncState(SYNC_STATE.MANUAL_MODE);
    });
  }

  // ================= RETRY SYNC HANDLER =================

  if (elements.retrySyncBtn) {
    elements.retrySyncBtn.addEventListener('click', function() {
      console.log('🔄 [Retry] Tentando novamente');
      
      // Voltar para estado idle e esconder retry
      setSyncState(SYNC_STATE.IDLE);
      
      // Simular clique no botão de sync
      if (elements.syncBtn) {
        elements.syncBtn.click();
      }
    });
  }

  // ================= RETRY HERE HANDLER (Nova página atual) =================

  if (elements.retryHereBtn) {
    elements.retryHereBtn.addEventListener('click', function() {
      console.log('🔄 [RetryHere] Tentando novamente na página atual');
      
      // Esconder seção not found
      if (elements.notFoundSection) elements.notFoundSection.classList.add('hidden');
      if (elements.statusFeedback) elements.statusFeedback.classList.add('hidden');
      
      // Voltar para estado idle
      setSyncState(SYNC_STATE.IDLE);
      
      // Simular clique no botão de sync
      if (elements.syncBtn) {
        elements.syncBtn.click();
      }
    });
  }

  // ================= GO TO MILES PAGE HANDLER =================

  if (elements.goToMilesBtn) {
    elements.goToMilesBtn.addEventListener('click', async function() {
      console.log('🔗 [GoTo] Navegando para página de milhas');
      
      var programInfo = state.currentProgram;
      if (!programInfo || !programInfo.milesUrl) {
        console.error('❌ [GoTo] URL de milhas não encontrada');
        return;
      }

      try {
        // Navegar para a página de milhas na aba atual
        await chrome.tabs.update(state.currentTab.id, { url: programInfo.milesUrl });
        
        // Esconder seção not found e voltar para idle
        if (elements.notFoundSection) elements.notFoundSection.classList.add('hidden');
        setSyncState(SYNC_STATE.IDLE);
        
        // Fechar popup para o usuário ver a página
        window.close();
      } catch (error) {
        console.error('❌ [GoTo] Erro ao navegar:', error);
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

      // Inicializar estado
      setSyncState(SYNC_STATE.IDLE);
      showMainSection();

    } catch (error) {
      console.error('❌ [Tab] Erro ao detectar aba:', error);
      showNotSupportedSection();
    }
  }

  // ================= INITIALIZATION =================

  async function init() {
    console.log('🔧 [Init] Iniciando v2.8 - Multi-domínio LATAM...');

    try {
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
    } catch (error) {
      console.error('❌ [Init] Erro crítico:', error);
      // Mostrar seção de não suportado como fallback para evitar popup em branco
      showNotSupportedSection();
    }
  }

  // ================= START =================
  init();

});
