

# Corrigir Scraper + Remover Botao "Atualizar" do Usuario

## Problemas Diagnosticados

Executei o scraper em tempo real e confirmei os seguintes problemas:

1. **O scraper encontra 0 promocoes de viagem** -- ele analisa os primeiros 10 artigos da pagina de listagem, que sao todos sobre bonus de transferencia, descontos em produtos e WhatsApp. As promocoes de viagem reais (Bariloche, Cancun, St. Martin, Nova York, Noronha) estao mais abaixo na pagina.

2. **Titulos com `![` corrompidos** -- Links de imagem no markdown geram titulos como `![Azul e C6 Bank oferecem...` que sao tratados como texto bloqueado.

3. **Regex de milhas nao detecta formatos comuns** -- Titulos como "44.500 pontos Azul Fidelidade" ou "66 mil pontos Azul" nao sao capturados porque o regex exige "milhas" ou "pontos" isolado, mas no titulo aparece "pontos Azul" (com o programa junto).

4. **Botao "Atualizar" exposto ao usuario final** -- permite que usuarios finais disparem o scraper, consumindo creditos Firecrawl desnecessariamente.

## Promocoes REAIS encontradas na pagina (verificado ao vivo)

| Destino | Milhas | Programa | Titulo |
|---------|--------|----------|--------|
| St. Martin | 67.000 | TudoAzul | Voe para St. Martin a partir de R$ 795 ou 67 mil pontos Azul |
| Nova York | 16.000 | AAdvantage | Copa do Mundo! Nova York por 16 mil milhas AAdvantage |
| Bariloche | 44.500 | TudoAzul | Voe para Bariloche a partir de R$ 646 ou 44.500 pontos Azul |
| Cancun | 66.000 | TudoAzul | Voe para Cancun a partir de R$ 778 ou 66 mil pontos Azul |
| Noronha | 8.400 | TudoAzul | Noronha a partir de R$ 161 ou 8.400 pontos Azul |

## Plano de Implementacao

### 1. Remover botao "Atualizar" da pagina do usuario

**Arquivo**: `src/components/financial/ScrapedPromotionsList.tsx`

- Remover o botao "Atualizar" e "Buscar Promocoes" da interface do usuario
- Remover a funcao `runScraper()` e o estado `refreshing`
- Remover imports nao utilizados (`RefreshCw`)
- Manter o botao apenas no painel admin (`ScraperControlSection.tsx`)
- Na tela vazia, mostrar mensagem informando que as promocoes sao atualizadas automaticamente

### 2. Reescrever logica de extracao de artigos do listing

**Arquivo**: `supabase/functions/firecrawl-promotions-scraper/index.ts`

Problemas a corrigir em `extractArticlesFromListing()`:
- **Limpar titulos**: Remover prefixo `![` e sufixo de imagem dos titulos extraidos
- **Scanear TODOS os artigos** (nao limitar a 10 inicialmente) e depois filtrar
- **Pre-filtrar por relevancia**: Priorizar artigos cujo titulo contenha palavras-chave de viagem ("voe", "milhas", "pontos", nomes de destino) antes de scraping individual
- **Deduplicar URLs**: Remover duplicatas que o site repete em seções diferentes

### 3. Corrigir regex de parsing de milhas

**Arquivo**: `supabase/functions/firecrawl-promotions-scraper/index.ts`

A funcao `parseMilesReal()` falha em detectar:
- "44.500 pontos Azul Fidelidade" (programa junto com "pontos")
- "66 mil pontos Azul" (programa junto com "pontos")  
- "16 mil milhas AAdvantage" (programa junto com "milhas")
- "8.400 pontos Azul" (numero pequeno < 10k)

Correcoes:
- Regex "X mil pontos/milhas" deve aceitar texto apos "pontos/milhas" (ex: `pontos\s+\w+`)
- Regex de numero direto deve aceitar "pontos Azul", "milhas AAdvantage" etc.
- Reduzir limite minimo de milhas de 1000 para 1000 (ja esta, mas verificar)

### 4. Melhorar estrategia de scraping: filtrar ANTES de gastar creditos

Em vez de scrape de todos os artigos (gastando creditos), a nova logica sera:

```text
1. Scrape pagina de listagem (1 credito)
2. Extrair TODOS os artigos (40+)
3. Tentar parsear cada titulo (0 creditos - so regex)
4. Separar em 2 grupos:
   a) Titulos JA com destino + milhas -> card direto (0 creditos extras)
   b) Titulos com destino MAS sem milhas -> scrape artigo para enriquecer
5. Scrape apenas grupo (b) para buscar milhas no conteudo (poucos creditos)
6. Descartar artigos sem destino (sem gastar creditos)
```

Isso reduz o consumo de creditos de ~20 para ~5-8 por execucao.

### 5. Extrair informacoes extras dos artigos (quando scrapeados)

Quando o scraper abre um artigo individual (como Bariloche), extrair:
- **Datas de viagem**: Regex para "agosto de 2025", "MAR/26", "ABR/26" etc.
- **Origem**: "Porto Alegre (POA)", "Sao Paulo (GRU)" etc.
- **Preco em reais**: "R$ 646", "R$ 778" para enriquecer descricao
- **Exemplos de emissao**: Detectar secao "Exemplos de emissao" para dados mais ricos

### 6. Adicionar "St. Martin" e "Noronha" a lista de destinos

**Arquivo**: `supabase/functions/firecrawl-promotions-scraper/index.ts`

Adicionar destinos faltantes:
- `{ name: 'St. Martin', aliases: ['st. martin', 'saint martin', 'são martinho'] }`
- `{ name: 'Fernando de Noronha', aliases: ['noronha', 'fernando de noronha'] }` (ja existe, mas verificar alias "noronha" isolado)

---

## Detalhes Tecnicos

### Novo fluxo do scraper

```text
Listing page (1 credito)
      |
      v
Extrair ~40 artigos (limpar ![, deduplicar)
      |
      v
Para cada artigo:
  titulo contem destino + milhas? --SIM--> Card direto (0 creditos)
                |
               NAO
                |
  titulo contem destino? --SIM--> Scrape artigo (1 credito)
                |                    |
               NAO                   v
                |              Extrair milhas + datas + origem
                v
           Descartar (0 creditos)
```

### Regex corrigido para milhas

```
// "66 mil pontos Azul" ou "16 mil milhas AAdvantage"
/(\d+(?:[.,]\d+)?)\s*mil\s*(milhas|pontos|miles)(?:\s+\w+)*/i

// "44.500 pontos Azul Fidelidade" ou "8.400 pontos Azul"  
/(\d{1,3}(?:[.,]\d{3})*)\s*(milhas|pontos|miles)(?:\s+\w+)*/i
```

### Arquivos modificados
- `src/components/financial/ScrapedPromotionsList.tsx` -- remover botao Atualizar
- `supabase/functions/firecrawl-promotions-scraper/index.ts` -- corrigir parsing completo

