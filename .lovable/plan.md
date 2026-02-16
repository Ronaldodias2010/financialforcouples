

# Corrigir Prioridade de Classificação de Categorias

## Problema Identificado

O fluxo de classificação no `whatsapp-input` tem duas etapas:

1. **Etapa 1 (linha 723)**: Usa o `category_hint` da IA (n8n) para resolver a categoria. Se a IA diz "Moradia", o sistema aceita.
2. **Etapa 2 (linha 1216)**: Faz lookup nas keywords da mensagem original contra as tags do banco de dados. Essa etapa **nunca executa** se a Etapa 1 já resolveu.

No caso "gastei na minha conta do Santander de mercado de farmácia":
- A IA classificou como "Moradia" (provavelmente por causa da palavra "conta")
- O edge confiou na IA e resolveu para Moradia
- As keywords "farmácia" (Saude) e "mercado" (Alimentacao) nunca foram consultadas

## Solucao

Inverter a prioridade: **keywords da mensagem original devem ter prioridade sobre o hint da IA**.

---

## Detalhes Tecnicos

### Arquivo: `supabase/functions/whatsapp-input/index.ts`

**Mudanca principal**: Mover o bloco de DB TAG LOOKUP (linhas 1216-1288) para **antes** da resolucao por `category_hint` (linha 723), dentro do bloco PATCH.

A nova ordem sera:

```text
1. PRIMEIRO: Buscar keywords da mensagem original no banco (farmacia -> Saude)
2. SEGUNDO: Se nao encontrou, usar category_hint da IA
3. TERCEIRO: Fallback por nome direto da categoria
```

### Mudancas especificas:

1. **No bloco PATCH (apos o merge state, ~linha 712)**: Adicionar o lookup de DB TAGS usando `raw_message` ANTES de usar `category_hint`:
   - Extrair palavras da `raw_message` (normalizar acentos)
   - Buscar todas as `category_tags` com keywords
   - Para cada palavra, verificar match nas keywords (pt, en, es)
   - Se encontrar match, resolver via `category_tag_relations` -> `categories` do usuario
   - Implementar sistema de **pontuacao**: se multiplas keywords matcham categorias diferentes (ex: "mercado" -> Alimentacao, "farmacia" -> Saude), a keyword mais especifica (menos categorias associadas) vence

2. **Manter o `category_hint` como fallback**: So usar quando o DB TAG LOOKUP nao encontrar nada

3. **Adicionar logica de desempate por especificidade**: Se "conta" matcha Moradia, Tecnologia, etc. (keyword generica) mas "farmacia" matcha so Saude (keyword especifica), "farmacia" vence

### Logica de pontuacao proposta:

```text
Para cada palavra da mensagem:
  - Contar quantas categorias diferentes essa keyword aparece
  - Keywords que aparecem em 1 categoria = peso 10 (muito especifica)
  - Keywords que aparecem em 2-3 categorias = peso 5
  - Keywords que aparecem em 4+ categorias = peso 1 (generica, ex: "conta")
  
Somar pontos por categoria e escolher a de maior pontuacao.
```

### Exemplo com a mensagem "gastei na minha conta do Santander de mercado de farmacia":

```text
Palavras extraidas: ["gastei", "conta", "santander", "mercado", "farmacia"]

- "conta" -> Moradia (luz, gas, agua), Tecnologia (celular) = peso 1 (generica)
- "mercado" -> Alimentacao = peso 10 (especifica)
- "farmacia" -> Saude = peso 10 (especifica)

Pontuacao: Alimentacao=10, Saude=10, Moradia=1
Desempate: primeira keyword mais especifica encontrada = "mercado" -> Alimentacao

Ou: manter a ULTIMA keyword especifica = "farmacia" -> Saude
```

4. **Tambem aplicar a mesma correcao no `process-financial-input/index.ts`** (linhas 794-902): Mesmo problema existe la - o `category_hint` e usado diretamente sem consultar keywords da mensagem.

### Limpeza de tags duplicadas

Existem 4 tags "farmacia" duplicadas no banco. Apos a correcao de prioridade, limpar duplicatas com uma migration:
- Manter apenas 1 tag "farmacia" (a mais completa em keywords)
- Remover as 3 duplicadas e suas relacoes

