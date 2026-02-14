

# Migrar Scraping do Python/ngrok para Firecrawl (100% interno)

## Resposta: SIM, e possivel!

Fiz testes reais contra o site `passageirodeprimeira.com` e confirmei que:
- A homepage retorna markdown limpo com titulos e links de artigos
- A pagina `/categorias/promocoes/` retorna lista de promocoes com titulos e URLs
- Artigos individuais retornam conteudo completo com detalhes de milhas, programas, cupons, etc.
- O conector Firecrawl ja esta instalado e a chave `FIRECRAWL_API_KEY` esta disponivel

O site NAO usa proteçoes anti-bot ou renderizaçao JS pesada - e um WordPress simples, ideal para o Firecrawl.

## O que muda

| Aspecto | Hoje (Python/ngrok) | Firecrawl (novo) |
|---------|-------------------|------------------|
| Dependencia | PC local ligado + ngrok ativo | Nenhuma - 100% cloud |
| Ponto de falha | URL ngrok muda/expira | Nenhum |
| Infraestrutura | Python + Flask + tunnel | Edge Function unica |
| Custo | Gratuito (seu PC) | Creditos Firecrawl (por pagina scrapeada) |

## Plano de Implementaçao

### Etapa 1 - Criar Edge Function `firecrawl-scrape`
Edge function generica que encapsula chamadas ao Firecrawl API. Essa funçao ja estava prevista no codigo (`src/lib/api/firecrawl.ts`) mas nunca foi criada.

### Etapa 2 - Reescrever `firecrawl-promotions-scraper`
Substituir os dados demo atuais por scraping real usando Firecrawl:

1. **Scrape da pagina de promocoes**: `passageirodeprimeira.com/categorias/promocoes/` para obter lista de artigos
2. **Scrape de cada artigo individual**: Extrair titulo, conteudo completo
3. **Parsing inteligente**: Reaproveitar as funçoes `parseMiles()` e `detectProgram()` que ja existem em `import-pdp-deals` para extrair:
   - Programa de milhas (Smiles, LATAM Pass, TudoAzul, Livelo, Esfera, etc.)
   - Quantidade de milhas/pontos
   - Origem/Destino (quando mencionado)
4. **Gravar no banco**: Inserir na tabela `scraped_promotions` com deduplicaçao via `external_hash`

### Etapa 3 - Atualizar `import-pdp-deals`
Adicionar um novo modo `firecrawl` que usa o Firecrawl internamente ao inves de depender do ngrok:
- Manter compatibilidade com o modo ngrok existente (fallback)
- Quando chamado sem `ngrok_url`, usar Firecrawl automaticamente

### Etapa 4 - Atualizar o Admin Panel
Alterar `ScraperControlSection.tsx` para:
- Remover referencia hardcoded ao ngrok URL
- Botao "Executar Scraper" usa Firecrawl diretamente
- Indicar modo "Firecrawl Cloud" no status

### Etapa 5 - Atualizar o Cron Job
O cron diario que ja existe passara a chamar a versao Firecrawl sem depender de serviço externo.

---

## Detalhes Tecnicos

### Fluxo do Scraping

```text
+---------------------------+
|  Cron Job (12h BRT)       |
|  ou Admin Manual          |
+------------+--------------+
             |
             v
+---------------------------+
|  Edge Function:           |
|  firecrawl-promotions-    |
|  scraper                  |
+------------+--------------+
             |
             v
+---------------------------+
| 1. Firecrawl Scrape       |
|    /categorias/promocoes/ |
|    -> Lista de URLs       |
+------------+--------------+
             |
             v
+---------------------------+
| 2. Firecrawl Scrape       |
|    cada artigo (max 20)   |
|    -> Markdown completo   |
+------------+--------------+
             |
             v
+---------------------------+
| 3. Parsing local          |
|    parseMiles()           |
|    detectProgram()        |
|    extrair origem/destino |
+------------+--------------+
             |
             v
+---------------------------+
| 4. Gravar em              |
|    scraped_promotions     |
|    com deduplicaçao       |
+---------------------------+
```

### Estimativa de creditos Firecrawl por execuçao
- 1 credito para pagina de listagem
- ~10-20 creditos para artigos individuais
- Total: ~15-25 creditos por execuçao diaria

### Arquivos que serao criados/modificados
- **CRIAR**: `supabase/functions/firecrawl-scrape/index.ts` (edge function generica)
- **MODIFICAR**: `supabase/functions/firecrawl-promotions-scraper/index.ts` (scraping real)
- **MODIFICAR**: `supabase/functions/import-pdp-deals/index.ts` (modo firecrawl)
- **MODIFICAR**: `src/components/admin/ScraperControlSection.tsx` (UI admin)
- **MODIFICAR**: `src/components/financial/ScrapedPromotionsList.tsx` (remover ngrok)

