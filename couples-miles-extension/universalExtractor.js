/**
 * Couples Miles Extension - Universal Extractor 2.0
 * 
 * Sistema universal de extração de saldo de milhas/pontos com:
 * - Motor baseado em candidatos
 * - Sistema de score de confiança
 * - Ajustes contextuais por programa
 * - Seleção do candidato com maior score
 * 
 * SEGURANÇA:
 * - Execução apenas após clique manual
 * - Não captura senhas ou cookies
 * - Apenas leitura de texto visível no DOM
 * - Sem scraping server-side
 */

(function() {
  'use strict';

  // ============================================
  // UTILITÁRIOS
  // ============================================

  /**
   * Normaliza número brasileiro (183.401 → 183401)
   */
  function normalize(value) {
    if (!value) return 0;
    // Remove pontos (separador de milhar brasileiro)
    // Remove vírgulas (caso exista decimal)
    const cleaned = value.replace(/\./g, '').replace(/,/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  /**
   * Valida se o valor está em faixa aceitável para milhas
   * Mínimo: 100 (saldo mínimo razoável)
   * Máximo: 10.000.000 (10 milhões - teto razoável)
   */
  function isValid(value) {
    return value > 100 && value < 10000000;
  }

  /**
   * Aguarda elemento no DOM (para sites React/SPA)
   */
  function waitForContent(timeout = 8000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        // Verifica se há conteúdo numérico significativo na página
        const hasContent = document.body.innerText.match(/\d{1,3}(\.\d{3})+/);
        
        if (hasContent || Date.now() - startTime >= timeout) {
          resolve();
        } else {
          setTimeout(check, 200);
        }
      };
      
      check();
    });
  }

  // ============================================
  // COLETOR DE CANDIDATOS
  // ============================================

  /**
   * Coleta todos os candidatos numéricos válidos da página
   */
  function collectCandidates() {
    // Regex para números no formato brasileiro: 183.401, 1.234.567, etc.
    const brazilianNumberRegex = /^\d{1,3}(\.\d{3})+$/;
    
    // Elementos onde tipicamente aparece o saldo
    const elements = document.querySelectorAll(
      'h1, h2, h3, h4, span, strong, b, div, p, [class*="miles"], [class*="pontos"], [class*="saldo"], [class*="balance"]'
    );

    const candidates = [];

    for (const el of elements) {
      const text = el.innerText?.trim();
      if (!text) continue;

      // Testa se é um número no formato brasileiro
      if (brazilianNumberRegex.test(text)) {
        const value = normalize(text);
        
        if (!isValid(value)) continue;

        // Evita duplicatas do mesmo valor no mesmo container
        const parentText = el.parentElement?.innerText || '';
        const isDuplicate = candidates.some(c => 
          c.value === value && 
          c.parentText === parentText
        );

        if (!isDuplicate) {
          candidates.push({
            element: el,
            value,
            rawText: text,
            tagName: el.tagName,
            parentText: parentText.substring(0, 200),
            score: 0
          });
        }
      }
    }

    console.log(`[Universal Extractor] Coletados ${candidates.length} candidatos`);
    return candidates;
  }

  // ============================================
  // SCORING BASE
  // ============================================

  /**
   * Aplica pontuação base para todos os candidatos
   */
  function applyBaseScoring(candidates) {
    candidates.forEach(candidate => {
      const el = candidate.element;
      const context = el.closest('div')?.innerText?.toLowerCase() || '';
      const parentContext = el.parentElement?.innerText?.toLowerCase() || '';
      const fullContext = context + ' ' + parentContext;

      // Contexto de milhas/pontos/saldo (+40)
      if (/milhas|pontos|saldo|balance|miles|points/.test(fullContext)) {
        candidate.score += 40;
      }

      // Tag de destaque: H1, H2, H3 (+20)
      if (/^H[1-3]$/.test(el.tagName)) {
        candidate.score += 20;
      }

      // Tags de ênfase: STRONG, B (+15)
      if (el.tagName === 'STRONG' || el.tagName === 'B') {
        candidate.score += 15;
      }

      // SPAN dentro de contexto de saldo (+10)
      if (el.tagName === 'SPAN' && /milhas|pontos/.test(fullContext)) {
        candidate.score += 10;
      }

      // Penaliza valores muito pequenos (-10)
      if (candidate.value < 1000) {
        candidate.score -= 10;
      }

      // Bônus para valores típicos de saldo (+5)
      if (candidate.value >= 10000 && candidate.value <= 500000) {
        candidate.score += 5;
      }
    });

    // Bônus para o maior valor (+15)
    if (candidates.length > 0) {
      const maxValue = Math.max(...candidates.map(c => c.value));
      candidates.forEach(c => {
        if (c.value === maxValue) {
          c.score += 15;
        }
      });
    }

    return candidates;
  }

  // ============================================
  // AJUSTES CONTEXTUAIS POR PROGRAMA
  // ============================================

  /**
   * Ajustes específicos para LATAM - Atualizado 2025
   * Baseado na estrutura real do site: "Milhas acumuladas" → "183.401"
   */
  function applyLatamContextAdjustments(candidates) {
    candidates.forEach(candidate => {
      const el = candidate.element;
      const context = el.closest('div')?.innerText?.toLowerCase() || '';
      const sectionContext = el.closest('section')?.innerText?.toLowerCase() || '';
      const fullContext = context + ' ' + sectionContext;
      const id = el.id?.toLowerCase() || '';
      const className = el.className?.toLowerCase() || '';
      const parentId = el.parentElement?.id?.toLowerCase() || '';

      // Seletor específico LATAM (#lb1-miles-amount) (+100)
      if (parentId.includes('lb1-miles') || id.includes('lb1-miles') || 
          el.closest('#lb1-miles-amount')) {
        candidate.score += 100;
      }

      // NOVO: Contexto "Milhas acumuladas" - match exato do screenshot (+120)
      if (/milhas acumuladas/.test(fullContext)) {
        candidate.score += 120;
        console.log(`[LATAM] Bônus +120 para "${candidate.rawText}" - contexto "milhas acumuladas"`);
      }

      // Contexto positivo forte (+50)
      if (/total acumulado|saldo atual|seu saldo|your miles|available miles/.test(fullContext)) {
        candidate.score += 50;
      }

      // NOVO: Perto de "LATAM Pass" ou categoria (+40)
      if (/latam pass|categoria latam/.test(fullContext)) {
        candidate.score += 40;
      }

      // Contexto de header/perfil (+30)
      if (/header|profile|user-info|account|minha.conta/.test(className) || 
          /header|profile|user-info|account/.test(parentId)) {
        candidate.score += 30;
      }

      // Contexto negativo forte (-60)
      if (/meta|campanha|promoção|ganhe até|desafio|challenge|earn up to|goal|objetivo/.test(fullContext)) {
        candidate.score -= 60;
      }

      // Contexto de transferência/resgate (-30)
      if (/transferir|resgatar|usar milhas|redeem|transfer/.test(fullContext)) {
        candidate.score -= 30;
      }

      // Contexto de histórico/extrato (-20)
      if (/histórico|extrato|statement|history|movimento/.test(fullContext)) {
        candidate.score -= 20;
      }

      // NOVO: Penaliza valores relacionados a wallet/dinheiro (-50)
      if (/wallet|brl|r\$|reais|disponíveis para compras/.test(fullContext)) {
        candidate.score -= 50;
      }

      // NOVO: Penaliza contexto de "vencendo" ou expiração (-40)
      if (/vencer|vencendo|expira|validade/.test(fullContext)) {
        candidate.score -= 40;
      }
    });

    return candidates;
  }

  /**
   * Ajustes específicos para Azul (TudoAzul)
   */
  function applyAzulContextAdjustments(candidates) {
    candidates.forEach(candidate => {
      const el = candidate.element;
      const context = el.closest('div')?.innerText?.toLowerCase() || '';
      const className = el.className?.toLowerCase() || '';

      // Contexto TudoAzul específico (+50)
      if (/tudoazul|tudo azul|pontos azul/.test(context)) {
        candidate.score += 50;
      }

      // Classe de saldo (+40)
      if (/balance|saldo|points/.test(className)) {
        candidate.score += 40;
      }

      // Contexto negativo
      if (/campanha|promoção|ganhe|desafio|meta/.test(context)) {
        candidate.score -= 50;
      }
    });

    return candidates;
  }

  /**
   * Ajustes específicos para Smiles
   */
  function applySmilesContextAdjustments(candidates) {
    candidates.forEach(candidate => {
      const el = candidate.element;
      const context = el.closest('div')?.innerText?.toLowerCase() || '';
      const className = el.className?.toLowerCase() || '';

      // Contexto Smiles específico (+50)
      if (/smiles|milhas smiles|sua conta/.test(context)) {
        candidate.score += 50;
      }

      // Classe de milhas (+40)
      if (/miles|milhas|balance|saldo/.test(className)) {
        candidate.score += 40;
      }

      // Contexto negativo
      if (/clube smiles|assinatura|mensalidade|plano/.test(context)) {
        candidate.score -= 40;
      }

      if (/promoção|oferta|desconto/.test(context)) {
        candidate.score -= 50;
      }
    });

    return candidates;
  }

  /**
   * Ajustes específicos para Livelo
   */
  function applyLiveloContextAdjustments(candidates) {
    candidates.forEach(candidate => {
      const el = candidate.element;
      const context = el.closest('div')?.innerText?.toLowerCase() || '';
      const className = el.className?.toLowerCase() || '';

      // Contexto Livelo específico (+50)
      if (/livelo|pontos livelo|seus pontos/.test(context)) {
        candidate.score += 50;
      }

      // Classe de pontos (+40)
      if (/points|pontos|balance|saldo/.test(className)) {
        candidate.score += 40;
      }

      // Contexto negativo
      if (/vencendo|expirar|validade|expira/.test(context)) {
        candidate.score -= 30;
      }

      if (/campanha|promoção|ganhe|bônus/.test(context)) {
        candidate.score -= 50;
      }
    });

    return candidates;
  }

  /**
   * Aplica ajustes contextuais baseado no programa
   */
  function applyProgramContextAdjustments(candidates, program) {
    switch (program) {
      case 'latam_pass':
      case 'latam':
        return applyLatamContextAdjustments(candidates);
      
      case 'azul':
      case 'tudoazul':
        return applyAzulContextAdjustments(candidates);
      
      case 'smiles':
        return applySmilesContextAdjustments(candidates);
      
      case 'livelo':
        return applyLiveloContextAdjustments(candidates);
      
      default:
        console.log(`[Universal Extractor] Programa não reconhecido: ${program}`);
        return candidates;
    }
  }

  // ============================================
  // SELEÇÃO FINAL
  // ============================================

  /**
   * Seleciona o candidato com maior confiança
   * Requer score mínimo de 50 para ser válido
   */
  function selectHighestConfidence(candidates) {
    if (candidates.length === 0) {
      console.log('[Universal Extractor] Nenhum candidato encontrado');
      return null;
    }

    // Ordena por score decrescente
    candidates.sort((a, b) => b.score - a.score);

    // Log dos top 3 candidatos para debug
    console.log('[Universal Extractor] Top candidatos:');
    candidates.slice(0, 3).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.value} (score: ${c.score}, tag: ${c.tagName})`);
    });

    const best = candidates[0];
    
    // Requer score mínimo de 50 para validar
    if (best && best.score >= 50) {
      console.log(`[Universal Extractor] Selecionado: ${best.value} (score: ${best.score})`);
      return {
        value: best.value,
        rawText: best.rawText,
        score: best.score,
        confidence: best.score >= 100 ? 'high' : best.score >= 70 ? 'medium' : 'low'
      };
    }

    console.log('[Universal Extractor] Nenhum candidato com score suficiente');
    return null;
  }

  // ============================================
  // FUNÇÃO PRINCIPAL
  // ============================================

  /**
   * Extrai saldo de milhas/pontos usando sistema de scoring
   * 
   * @param {string} program - Código do programa (latam, azul, smiles, livelo)
   * @returns {Promise<{value: number, rawText: string, score: number, confidence: string}|null>}
   */
  async function extractMiles(program) {
    console.log(`[Universal Extractor] Iniciando extração para: ${program}`);

    // Aguarda conteúdo carregar (React/SPA)
    await waitForContent();

    // Etapa 1: Coleta candidatos
    let candidates = collectCandidates();
    
    if (candidates.length === 0) {
      console.log('[Universal Extractor] Nenhum candidato numérico encontrado');
      return null;
    }

    // Etapa 2: Aplica scoring base
    candidates = applyBaseScoring(candidates);

    // Etapa 3: Aplica ajustes contextuais do programa
    candidates = applyProgramContextAdjustments(candidates, program);

    // Etapa 4: Seleciona melhor candidato
    return selectHighestConfidence(candidates);
  }

  /**
   * Tenta extração usando seletores específicos primeiro,
   * depois fallback para extração universal
   */
  async function extractWithFallback(program, specificSelectors) {
    console.log(`[Universal Extractor] Tentando extração para: ${program}`);

    // Aguarda conteúdo carregar
    await waitForContent();

    // Tenta seletores específicos primeiro
    if (specificSelectors && specificSelectors.length > 0) {
      for (const selector of specificSelectors) {
        try {
          const el = document.querySelector(selector);
          if (el) {
            const text = el.innerText?.trim();
            if (text && /^\d{1,3}(\.\d{3})+$/.test(text)) {
              const value = normalize(text);
              if (isValid(value)) {
                console.log(`[Universal Extractor] Encontrado via seletor: ${selector} → ${value}`);
                return {
                  value,
                  rawText: text,
                  score: 150, // Score alto para seletor específico
                  confidence: 'high',
                  method: 'specific_selector'
                };
              }
            }
          }
        } catch (e) {
          console.log(`[Universal Extractor] Erro no seletor ${selector}:`, e);
        }
      }
    }

    // Fallback para extração universal
    console.log('[Universal Extractor] Usando extração universal...');
    const result = await extractMiles(program);
    
    if (result) {
      result.method = 'universal';
    }
    
    return result;
  }

  // ============================================
  // EXPORTAÇÃO
  // ============================================

  // Exporta para uso global
  window.UniversalExtractor = {
    extractMiles,
    extractWithFallback,
    normalize,
    isValid,
    collectCandidates,
    applyBaseScoring,
    applyProgramContextAdjustments,
    waitForContent
  };

  console.log('[Universal Extractor] Módulo carregado');
})();
