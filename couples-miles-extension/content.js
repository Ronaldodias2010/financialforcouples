/**
 * Couples Miles Extension - Content Script
 * 
 * Este script é injetado nas páginas dos programas de milhagem.
 * Ele extrai APENAS o saldo visível na tela após login manual.
 * 
 * SEGURANÇA:
 * - Não captura senhas
 * - Não intercepta credenciais
 * - Não armazena cookies ou sessões
 * - Só executa após clique manual do usuário
 */

(function() {
  'use strict';

  // Verifica se estamos em um domínio permitido
  const currentProgram = window.detectCurrentProgram();
  
  if (!currentProgram) {
    console.log('[Couples Miles] Domínio não suportado');
    return;
  }

  console.log(`[Couples Miles] Detectado: ${currentProgram.config.programName}`);

  // Escuta mensagens do popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractBalance') {
      handleBalanceExtraction(sendResponse);
      return true; // Indica que resposta será assíncrona
    }
    
    if (request.action === 'checkStatus') {
      handleStatusCheck(sendResponse);
      return true;
    }
  });

  // Verifica se usuário está logado
  function isUserLoggedIn() {
    const config = currentProgram.config;
    
    for (const selector of config.loginIndicators) {
      const element = document.querySelector(selector);
      if (element) {
        return true;
      }
    }
    
    return false;
  }

  // Extrai saldo de milhas
  function extractBalance() {
    const config = currentProgram.config;
    
    for (const selector of config.selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText;
        const balance = window.normalizeBalance(text);
        
        if (balance > 0) {
          console.log(`[Couples Miles] Saldo encontrado: ${balance}`);
          return {
            success: true,
            balance: balance,
            rawText: text.trim(),
            selector: selector
          };
        }
      }
    }
    
    // Fallback: tenta encontrar qualquer elemento com número grande
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent || '';
      const match = text.match(/\b(\d{1,3}(?:[.,]\d{3})*)\s*(?:milhas?|pontos?|miles?|points?)\b/i);
      if (match) {
        const balance = window.normalizeBalance(match[1]);
        if (balance >= 100) { // Mínimo razoável
          console.log(`[Couples Miles] Saldo encontrado via fallback: ${balance}`);
          return {
            success: true,
            balance: balance,
            rawText: match[0],
            selector: 'fallback'
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'balance_not_found',
      message: 'Não foi possível encontrar o saldo de milhas na página'
    };
  }

  // Handler para extração de saldo
  function handleBalanceExtraction(sendResponse) {
    try {
      // Verifica login primeiro
      const loggedIn = isUserLoggedIn();
      
      if (!loggedIn) {
        sendResponse({
          success: false,
          error: 'not_logged_in',
          message: 'Faça login no site antes de sincronizar'
        });
        return;
      }

      // Extrai saldo
      const result = extractBalance();
      
      if (result.success) {
        sendResponse({
          success: true,
          data: {
            program: currentProgram.config.programCode,
            programName: currentProgram.config.programName,
            balance: result.balance,
            rawText: result.rawText,
            captured_at: new Date().toISOString(),
            url: window.location.href
          }
        });
      } else {
        sendResponse(result);
      }
    } catch (error) {
      console.error('[Couples Miles] Erro na extração:', error);
      sendResponse({
        success: false,
        error: 'extraction_error',
        message: error.message
      });
    }
  }

  // Handler para verificação de status
  function handleStatusCheck(sendResponse) {
    try {
      const loggedIn = isUserLoggedIn();
      
      sendResponse({
        success: true,
        data: {
          program: currentProgram.config.programCode,
          programName: currentProgram.config.programName,
          domain: currentProgram.config.domain,
          isLoggedIn: loggedIn,
          url: window.location.href
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: 'status_error',
        message: error.message
      });
    }
  }

  // Notifica que content script está carregado
  console.log(`[Couples Miles] Content script carregado para ${currentProgram.config.programName}`);
})();
