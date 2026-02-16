
# Correcao Definitiva: Categoria + Saldo do Cartao + Idioma

## Resumo dos 3 Problemas

1. **Categoria "Outros"**: Quando o hint da IA e ignorado (fix anterior), o codigo cai na inferencia contextual (linhas 1132-1184) que apenas SUGERE categorias ao usuario -- nao resolve automaticamente via banco de dados. Resultado: mesmo com "supermercado" no texto, o sistema pergunta ao usuario em vez de resolver sozinho.

2. **Saldo do cartao Inter Black**: O trigger `update_card_balance` calcula `current_balance = SUM(transacoes)` = R$ 5.724,27, ignorando `initial_balance_original` = R$ 10.035,73. Deveria ser R$ 15.760,00.

3. **Idioma das respostas**: As perguntas do `whatsapp-input` (ex: "Qual a forma de pagamento?") sao fixas em portugues, mesmo quando o usuario escreve em ingles ou espanhol.

---

## Correcao 1: Resolucao Automatica via Tags do Banco

**Arquivo**: `supabase/functions/whatsapp-input/index.ts`

**Mudanca**: Quando `category_hint` e limpo (era "Outros"), em vez de ir direto para sugestoes, primeiro tentar resolver automaticamente usando as tags do banco de dados a partir de palavras-chave do `raw_message`.

Logica:
1. Extrair palavras relevantes do `raw_message` (ex: "supermercado", "padaria")
2. Para cada palavra, buscar na tabela `category_tags` por `keywords_pt` (mesmo caminho das linhas 648-700)
3. Se encontrar match, resolver o `resolved_category_id` automaticamente
4. Se nao encontrar, ai sim cair nas sugestoes

Isso garante que qualquer tag configurada em "Gerenciar Categorias" (como "supermercado" em "Alimentacao") sera respeitada, sem depender de listas hardcoded.

## Correcao 2: Trigger do Saldo

**Tipo**: Migracao SQL

**Mudanca**: Em todos os 3 blocos do trigger (INSERT, UPDATE, DELETE), alterar:

```
SET current_balance = total_expenses
```

Para:

```
SET current_balance = COALESCE(initial_balance_original, 0) + total_expenses
```

Isso faz o saldo refletir a divida total: pre-existente (R$ 10.035,73) + novos gastos (R$ 5.724,27) = R$ 15.760,00.

Apos aplicar, executar um recalculo para corrigir o saldo atual do cartao Inter Black do Ronaldo.

## Correcao 3: Respostas no Idioma do Usuario

**Arquivo**: `supabase/functions/whatsapp-input/index.ts`

**Mudanca**: Adicionar deteccao de idioma baseada no `raw_message` e traduzir as perguntas geradas pelo sistema.

Logica:
- Detectar idioma do `raw_message` usando patterns simples (palavras-chave PT/EN/ES)
- Usar templates de perguntas traduzidos: "Qual a forma de pagamento?" / "What payment method?" / "Cual metodo de pago?"
- Aplicar para todas as perguntas: categoria, cartao, conta, metodo de pagamento

---

## Detalhes Tecnicos

### Arquivo 1: `supabase/functions/whatsapp-input/index.ts`

**Secao 1 - Resolucao automatica via tags (antes da linha 1132)**:
- Quando `!mergedState.resolved_category_id && !mergedState.category_hint`, extrair keywords do `raw_message`
- Buscar cada keyword em `category_tags.keywords_pt` usando `contains()`
- Se match, seguir o caminho existente: `category_tag_relations` -> `categories` (via `default_category_id`)
- Se resolver, setar `mergedState.resolved_category_id` e pular as sugestoes

**Secao 2 - Deteccao de idioma e templates**:
- Funcao `detectLanguage(message)` simples baseada em patterns
- Objeto `QUESTION_TEMPLATES` com traducoes para PT/EN/ES
- Substituir strings hardcoded por templates[lang]

### Arquivo 2: Migracao SQL - `update_card_balance`

- Recriar funcao com `current_balance = COALESCE(initial_balance_original, 0) + total_expenses` em todos os blocos
- Recalcular saldo do cartao Inter Black imediatamente

### Impacto

- **Categorias**: Toda compra cujo texto contenha palavras configuradas nas tags do usuario sera resolvida automaticamente, sem depender da IA
- **Saldo**: O valor exibido no cartao refletira a divida real (pre-existente + gastos)
- **Idioma**: Perguntas de acompanhamento serao no mesmo idioma da mensagem do usuario
