/**
 * Couples Miles Extension - Background Service Worker
 * 
 * Gerencia comunicação entre content script e API do Couples.
 * Implementa rate limiting e autenticação JWT.
 */

// Configuração da API
const API_CONFIG = {
  baseUrl: 'https://elxttabdtddlavhseipz.supabase.co/functions/v1',
  endpoint: '/extension-sync-miles'
};

// Rate limit: 1 sync por programa a cada 6 horas
const RATE_LIMIT_MS = 6 * 60 * 60 * 1000; // 6 horas em ms

// Armazena timestamps das últimas sincronizações
async function getLastSyncTime(programCode) {
  const result = await chrome.storage.local.get(`lastSync_${programCode}`);
  return result[`lastSync_${programCode}`] || 0;
}

async function setLastSyncTime(programCode) {
  await chrome.storage.local.set({
    [`lastSync_${programCode}`]: Date.now()
  });
}

// Verifica rate limit
async function checkRateLimit(programCode) {
  const lastSync = await getLastSyncTime(programCode);
  const timeSinceLastSync = Date.now() - lastSync;
  
  if (timeSinceLastSync < RATE_LIMIT_MS) {
    const remainingMs = RATE_LIMIT_MS - timeSinceLastSync;
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    return {
      allowed: false,
      remainingMs,
      message: `Aguarde ${remainingHours} hora(s) para sincronizar novamente`
    };
  }
  
  return { allowed: true };
}

// Obtém JWT do storage
async function getAuthToken() {
  const result = await chrome.storage.local.get('couplesAuthToken');
  return result.couplesAuthToken;
}

// Salva JWT no storage
async function setAuthToken(token) {
  await chrome.storage.local.set({ couplesAuthToken: token });
}

// Remove JWT do storage
async function clearAuthToken() {
  await chrome.storage.local.remove('couplesAuthToken');
}

// Verifica consentimento LGPD
async function hasConsent() {
  const result = await chrome.storage.local.get('lgpdConsent');
  return result.lgpdConsent === true;
}

// Salva consentimento LGPD
async function setConsent(accepted) {
  await chrome.storage.local.set({
    lgpdConsent: accepted,
    consentDate: new Date().toISOString()
  });
}

// Envia dados para API do Couples
async function sendToAPI(data) {
  const token = await getAuthToken();
  
  if (!token) {
    return {
      success: false,
      error: 'no_auth',
      message: 'Faça login no Couples antes de sincronizar'
    };
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Extension-Version': chrome.runtime.getManifest().version
      },
      body: JSON.stringify({
        program: data.program,
        balance: data.balance,
        captured_at: data.captured_at,
        source: 'browser_extension'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        await clearAuthToken();
        return {
          success: false,
          error: 'auth_expired',
          message: 'Sessão expirada. Faça login novamente no Couples.'
        };
      }
      
      return {
        success: false,
        error: 'api_error',
        message: errorData.error || 'Erro ao sincronizar com o Couples'
      };
    }

    const result = await response.json();
    
    // Atualiza timestamp de última sync
    await setLastSyncTime(data.program);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('[Couples Miles] Erro na API:', error);
    return {
      success: false,
      error: 'network_error',
      message: 'Erro de conexão. Verifique sua internet.'
    };
  }
}

// Listener para mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Indica resposta assíncrona
});

async function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'syncMiles':
      await handleSyncMiles(request.data, sendResponse);
      break;
      
    case 'checkAuth':
      const token = await getAuthToken();
      sendResponse({ authenticated: !!token });
      break;
      
    case 'setAuth':
      await setAuthToken(request.token);
      sendResponse({ success: true });
      break;
      
    case 'logout':
      await clearAuthToken();
      sendResponse({ success: true });
      break;
      
    case 'checkConsent':
      const consent = await hasConsent();
      sendResponse({ hasConsent: consent });
      break;
      
    case 'setConsent':
      await setConsent(request.accepted);
      sendResponse({ success: true });
      break;
      
    case 'checkRateLimit':
      const rateLimit = await checkRateLimit(request.programCode);
      sendResponse(rateLimit);
      break;
      
    case 'getLastSync':
      const lastSync = await getLastSyncTime(request.programCode);
      sendResponse({ lastSync });
      break;
      
    default:
      sendResponse({ error: 'unknown_action' });
  }
}

async function handleSyncMiles(data, sendResponse) {
  // Verifica consentimento
  const consent = await hasConsent();
  if (!consent) {
    sendResponse({
      success: false,
      error: 'no_consent',
      message: 'Aceite os termos antes de sincronizar'
    });
    return;
  }

  // Verifica rate limit
  const rateLimit = await checkRateLimit(data.program);
  if (!rateLimit.allowed) {
    sendResponse({
      success: false,
      error: 'rate_limit',
      message: rateLimit.message
    });
    return;
  }

  // Envia para API
  const result = await sendToAPI(data);
  sendResponse(result);
}

// Log de inicialização
console.log('[Couples Miles] Background service worker iniciado');
