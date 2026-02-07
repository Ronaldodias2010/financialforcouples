
# Plano: Corrigir Extensão Couples Miles para Capturar Milhas LATAM

## Diagnóstico do Problema

### Problema 1: Domínios não reconhecidos
A extensão só reconhece `latam.com`, mas as páginas de milhas LATAM usam dois domínios diferentes:
- `latamairlines.com` (mais comum - ex: `https://www.latamairlines.com/br/pt/minha-conta`)
- `latampass.com` (ex: `https://latampass.com/myaccount`)

### Problema 2: Popup em branco
Quando a extensão não reconhece o domínio, ela deveria mostrar "Site não suportado", mas está aparecendo em branco. Isso indica que há um erro de JavaScript impedindo a renderização.

### Problema 3: Redirecionamento ao clicar
Quando o usuário clica em "Ir para página de milhas", ele é redirecionado para uma URL antiga (`latam.com/pt_br/latam-pass/minha-conta/`) que não contém as milhas.

## Solução Proposta

### Etapa 1: Atualizar `manifest.json`
Adicionar os novos domínios na lista de permissões de host:

```json
"host_permissions": [
  "https://*.latam.com/*",
  "https://*.latamairlines.com/*",
  "https://*.latampass.com/*",
  "https://*.tudoazul.com/*",
  "https://*.smiles.com.br/*",
  "https://*.livelo.com.br/*"
]
```

### Etapa 2: Atualizar `popup.js` (SUPPORTED_DOMAINS)
Adicionar os novos domínios na lógica de detecção e atualizar a URL de milhas:

```javascript
var SUPPORTED_DOMAINS = {
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
  // ... outros programas
};
```

### Etapa 3: Atualizar `selectors.js`
Adicionar os novos domínios na configuração de seletores:

```javascript
const MILEAGE_SELECTORS = {
  latam: {
    domains: ['latam.com', 'latamairlines.com', 'latampass.com'],
    // ... restante da configuração
  }
};
```

### Etapa 4: Corrigir `detectProgram()` em `popup.js`
Atualizar para reconhecer os novos domínios:

```javascript
function detectProgram(url) {
  if (!url) return null;
  var lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('latam.com') || 
      lowerUrl.includes('latamairlines.com') || 
      lowerUrl.includes('latampass.com')) {
    return 'latam';
  }
  // ... outros programas
}
```

### Etapa 5: Adicionar tratamento de erro no popup
Envolver o código de inicialização em try-catch para evitar popup em branco:

```javascript
async function init() {
  try {
    console.log('🔧 [Init] Iniciando...');
    // ... código existente
  } catch (error) {
    console.error('❌ [Init] Erro crítico:', error);
    // Mostrar seção de erro ao invés de popup em branco
    showNotSupportedSection();
  }
}
```

### Etapa 6: Melhorar fluxo de extração com fallback visual
Quando não encontrar saldo, mostrar mensagem mais clara com instruções:

```html
<div id="not-found-section" class="not-found-section hidden">
  <div class="info-card warning">
    <span class="icon">🔍</span>
    <div>
      <strong>Saldo não encontrado nesta página</strong>
      <p>Navegue até onde seu saldo de milhas esteja visível e clique em "Tentar Novamente".</p>
    </div>
  </div>
  <button id="retry-here-btn" class="btn btn-primary">
    🔄 Tentar Novamente (nesta página)
  </button>
  <button id="go-to-miles-btn" class="btn btn-secondary">
    🔗 Ir para página de milhas
  </button>
</div>
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `manifest.json` | Adicionar `latamairlines.com` e `latampass.com` nas host_permissions |
| `popup.js` | Atualizar SUPPORTED_DOMAINS, detectProgram(), adicionar tratamento de erro |
| `selectors.js` | Atualizar configuração LATAM para múltiplos domínios |
| `popup.html` | Melhorar seção not-found com botão "Tentar Novamente" |
| `content.js` | Atualizar detectCurrentProgram() para múltiplos domínios |

## Fluxo Após Correção

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Usuário abre extensão                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Detecta domínio (latamairlines.com, latampass.com, latam.com)  │
│  → Mostra "LATAM Pass detectado" + botão "Sincronizar"          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           Usuário clica em "Sincronizar Milhas"                 │
│           (NÃO navega - extrai na página atual)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
   ┌────────────────┐             ┌────────────────────┐
   │ Saldo Encontrado│             │ Saldo NÃO Encontrado│
   │ → Preview:      │             │ → Mensagem:         │
   │ "183.401 milhas"│             │ "Navegue até a      │
   │ "Está correto?" │             │ página de milhas"   │
   │                 │             │                     │
   │ [Sim] [Não]     │             │ [Tentar Novamente]  │
   │                 │             │ [Ir para página]    │
   └───────┬────────┘             └─────────┬──────────┘
           │                                 │
           ▼                                 │
   ┌────────────────┐                        │
   │ Envia para API │                        │
   │ → Atualiza card│                        │
   │ no dashboard   │◀───────────────────────┘
   └────────────────┘     (após navegar e tentar novamente)
```

## Seção Técnica

### Detalhes da Implementação

1. **Manifest V3 Host Permissions**: O Chrome exige que todos os domínios onde a extensão vai executar scripts estejam declarados em `host_permissions`. Sem isso, `chrome.scripting.executeScript()` falha silenciosamente.

2. **Detecção de Domínio**: A função `getProgramInfo()` usa `hostname.includes(domain)` para matching parcial. Com múltiplas entradas para LATAM, qualquer variação será reconhecida.

3. **Universal Extractor Engine**: O motor de extração já está preparado para LATAM com scoring específico (+120 para "milhas acumuladas"). Não precisa de alteração.

4. **Rate Limit**: O backend já impõe limite de 6 horas por programa. Não será afetado.

5. **Atualização da Extensão**: Após as mudanças, será necessário recarregar a extensão no Chrome (`chrome://extensions/` → ícone de atualização) para que as novas permissões entrem em vigor.
