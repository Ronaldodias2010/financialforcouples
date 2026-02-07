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
 * 
 * Usa Universal Extractor 2.0 para extração baseada em scoring
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

  /**
   * Extrai saldo usando Universal Extractor 2.0
   * Fluxo:
   * 1. Tenta seletores específicos primeiro
   * 2. Fallback para extração universal com scoring
   */
  async function extractBalance() {
    const config = currentProgram.config;
    const programCode = config.programCode;
    
    try {
      console.log(`[Couples Miles] Iniciando extração para ${programCode}...`);

      // Verifica se Universal Extractor está disponível
      if (window.UniversalExtractor) {
        // Usa extração com fallback (seletores específicos + universal)
        const result = await window.UniversalExtractor.extractWithFallback(
          programCode,
          config.selectors
        );

        if (result && result.value > 0) {
          console.log(`[Couples Miles] Saldo extraído: ${result.value} (método: ${result.method}, confiança: ${result.confidence})`);
          return {
            success: true,
            balance: result.value,
            rawText: result.rawText,
            confidence: result.confidence,
            method: result.method,
            score: result.score
          };
        }
      } else {
        console.log('[Couples Miles] Universal Extractor não disponível, usando método legado...');
        // Fallback para método legado se Universal Extractor não estiver carregado
        return await extractBalanceLegacy();
      }

      // Se nenhum método funcionou
      return {
        success: false,
        error: 'balance_not_found',
        message: 'Não foi possível encontrar o saldo de milhas na página'
      };

    } catch (error) {
      console.error('[Couples Miles] Erro na extração:', error);
      return {
        success: false,
        error: 'extraction_error',
        message: error.message
      };
    }
  }

  /**
   * Método legado de extração (fallback)
   */
  async function extractBalanceLegacy() {
    const config = currentProgram.config;
    
    try {
      // Se o programa requer aguardar carregamento dinâmico
      if (config.requiresWait && window.waitForAnySelector) {
        console.log('[Couples Miles] Aguardando carregamento dinâmico...');
        try {
          const result = await window.waitForAnySelector(config.selectors, 10000);
          const text = result.element.textContent || result.element.innerText;
          const balance = window.normalizeBalance(text);
          
          if (balance > 0) {
            console.log(`[Couples Miles] Saldo encontrado via wait: ${balance}`);
            return {
              success: true,
              balance: balance,
              rawText: text.trim(),
              method: 'legacy_wait'
            };
          }
        } catch (waitError) {
          console.log('[Couples Miles] Timeout aguardando elemento, tentando busca direta...');
        }
      }
      
      // Busca direta nos seletores
      for (const selector of config.selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText;
          const balance = window.normalizeBalance ? window.normalizeBalance(text) : parseInt(text.replace(/\D/g, ''), 10);
          
          if (balance > 0) {
            console.log(`[Couples Miles] Saldo encontrado: ${balance}`);
            return {
              success: true,
              balance: balance,
              rawText: text.trim(),
              method: 'legacy_selector'
            };
          }
        }
      }
      
      // Fallback: tenta encontrar qualquer elemento com número grande + "milhas/pontos"
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent || '';
        const match = text.match(/\b(\d{1,3}(?:[.,]\d{3})*)\s*(?:milhas?|pontos?|miles?|points?)\b/i);
        if (match) {
          const balance = window.normalizeBalance ? window.normalizeBalance(match[1]) : parseInt(match[1].replace(/\D/g, ''), 10);
          if (balance >= 100) {
            console.log(`[Couples Miles] Saldo encontrado via fallback: ${balance}`);
            return {
              success: true,
              balance: balance,
              rawText: match[0],
              method: 'legacy_fallback'
            };
          }
        }
      }
      
      return {
        success: false,
        error: 'balance_not_found',
        message: 'Não foi possível encontrar o saldo de milhas na página'
      };
    } catch (error) {
      return {
        success: false,
        error: 'extraction_error',
        message: error.message
      };
    }
  }

  // Handler para extração de saldo (async)
  async function handleBalanceExtraction(sendResponse) {
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

      // Extrai saldo (async)
      const result = await extractBalance();
      
      if (result.success) {
        console.log(`[Couples Miles] Enviando saldo: ${result.balance} (raw: ${result.rawText})`);
        sendResponse({
          success: true,
          data: {
            program: currentProgram.config.programCode,
            programName: currentProgram.config.programName,
            balance: result.balance,
            rawText: result.rawText,
            confidence: result.confidence || 'unknown',
            method: result.method || 'unknown',
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
