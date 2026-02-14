

# Corrigir Qualidade dos Cards de Milhagem - Scraping Assertivo

## Problemas Identificados

Analisando os dados atuais no banco, encontrei exatamente os problemas reportados:

1. **Cards sem destino de viagem**: "Promoção Geral" ou "Destino não especificado" -- ex: "Esfera oferece ate 52% de desconto na compra de pontos" (nao e uma viagem)
2. **Milhas sinteticas falsas**: O scraper converte porcentagens em milhas (52% -> 52.000, 70% -> 70.000) -- isso e enganoso
3. **Programas errados**: "Esfera 52% desconto" aparece como "Livelo" em vez de "Esfera"
4. **Titulos com lixo**: "live.rezync.com is blocked" salvo como titulo
5. **Badges sobrepostos**: Dois programas aparecendo no mesmo card (Livelo + Azul)
6. **Sem regra de 21 dias**: Promotions expiram com 7 dias (inativo) e 30 dias (delete), mas a regra deveria ser 21 dias

## Regra de Ouro para os Cards

Um card so sera exibido se contiver TODOS estes 3 elementos:
- **Destino de viagem** (cidade/pais real, nao "Promocao Geral")
- **Quantidade de milhas/pontos** (numero real extraido do artigo, nao sintetico)
- **Programa/companhia** (Azul, LATAM, Smiles, Livelo, etc.)

Cards que nao atendam aos 3 criterios serao descartados silenciosamente.

## Plano de Implementacao

### 1. Reescrever logica de parsing no scraper

**Arquivo**: `supabase/functions/firecrawl-promotions-scraper/index.ts`

Mudancas:
- **Remover milhas sinteticas**: Eliminar a logica que converte porcentagens em milhas (`pct * 1000`). Se nao ha milhas reais no texto, o card nao e criado.
- **Validar destino obrigatorio**: Se `extractRoute()` retornar `destino: null`, o artigo e descartado. Nunca usar "Promocao Geral" ou "Destino nao especificado".
- **Expandir `extractRoute()`**: Adicionar uma lista abrangente de destinos conhecidos (cidades, paises) para detectar no titulo e conteudo -- ex: "Cancun", "Miami", "Paris", "Lisboa", "Orlando", "Buenos Aires", "Santiago", etc.
- **Filtrar conteudo nao-viagem**: Bloquear artigos sobre compra de pontos, bonus de transferencia, descontos genericos que nao mencionam um destino de viagem.
- **Corrigir `detectProgram()`**: Adicionar "Esfera" como programa. Priorizar deteccao pela ordem de especificidade (Esfera antes de Livelo, TudoAzul antes de Azul generico).
- **Filtrar titulos com lixo**: Rejeitar artigos cujo titulo contenha "is blocked", "rezync", "whatsapp", "baixe o app".

### 2. Regra de expiracao de 21 dias

**Arquivo**: `supabase/functions/firecrawl-promotions-scraper/index.ts` e `src/components/financial/ScrapedPromotionsList.tsx`

- Mudar a janela de limpeza de 7 dias (inativo) para **21 dias** (inativo + delete)
- Na query de listagem, filtrar `created_at >= 21 dias atras` em vez de 30 dias
- Se o artigo mencionar uma data de validade explicita (ex: "valido ate 18/02"), extrair e usar como data de expiracao

### 3. Corrigir exibicao dos cards

**Arquivo**: `src/components/financial/ScrapedPromotionsList.tsx` e `src/components/admin/PromotionCard.tsx`

- Garantir que apenas **um** badge de programa apareca por card (sem sobreposicao)
- O card exibira: **Destino** (grande), **Milhas** (destaque), **Programa** (badge unico), **Link** (ver oferta)
- Adicionar cor para "Esfera" no mapa de cores dos programas

### 4. Limpar dados atuais invalidos

Executar limpeza no banco para remover os cards problematicos atuais:
- Cards com `destino = 'Promocao Geral'` ou `'Destino nao especificado'`
- Cards com `titulo` contendo "is blocked"
- Cards com milhas sinteticas (valores como 2.699, 2.026 que sao claramente errados)

---

## Detalhes Tecnicos

### Nova logica de validacao (pseudocodigo)

```text
parsePromotion(titulo, url, markdown):
  1. Filtrar titulo com palavras bloqueadas
  2. Extrair milhas REAIS (nao percentuais)
     - Se nao encontrar milhas >= 1000 -> DESCARTAR
  3. Extrair destino de viagem
     - Tentar extractRoute() com regex
     - Tentar matchKnownDestinations() com lista de cidades
     - Se destino = null -> DESCARTAR
  4. Detectar programa (com Esfera adicionado)
  5. Montar card com os 3 dados obrigatorios
```

### Lista de destinos conhecidos para matching

Mais de 60 cidades/regioes incluindo: Miami, Orlando, New York, Los Angeles, Las Vegas, Cancun, Punta Cana, Buenos Aires, Santiago, Lima, Bogota, Lisboa, Paris, Londres, Madri, Roma, Barcelona, Amsterdam, Dublin, Toquio, Dubai, Cidade do Panama, Sao Paulo, Rio de Janeiro, Salvador, Recife, Fortaleza, Natal, Florianopolis, entre outras.

### Arquivos modificados
- `supabase/functions/firecrawl-promotions-scraper/index.ts` -- logica principal de parsing
- `src/components/financial/ScrapedPromotionsList.tsx` -- regra de 21 dias + exibicao
- `src/components/admin/PromotionCard.tsx` -- cor Esfera + prevenir sobreposicao
- `src/components/financial/FeaturedPromotionCard.tsx` -- cor Esfera

