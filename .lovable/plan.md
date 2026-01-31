
# Plano: Agente Inteligente de Promoções de Milhas com Firecrawl

## Visao Geral do Projeto

Este projeto cria um sistema automatizado que:
1. Coleta promoções de passagens pagas com milhas de fontes públicas usando Firecrawl
2. Armazena as promoções de forma estruturada no banco de dados
3. Cruza promoções com o saldo de milhas dos usuários
4. Gera sugestões personalizadas de viagens
5. Exibe no frontend como cards interativos

---

## Arquitetura do Sistema

```text
+-------------------+     +------------------------+     +------------------+
|  Edge Function    |---->|  Firecrawl API        |---->|  Páginas Alvo    |
|  firecrawl-       |     |  (Scrape/Search)       |     |  - Melhores Dest |
|  promotions-      |     +------------------------+     |  - Passageiro    |
|  scraper          |                                    |  - Smiles, LATAM |
+-------------------+                                    +------------------+
         |
         v
+-------------------+     +------------------------+
|  Tabela           |<----|  Validação &           |
|  scraped_         |     |  Normalização          |
|  promotions       |     +------------------------+
+-------------------+
         |
         v
+-------------------+     +------------------------+     +------------------+
|  Edge Function    |---->|  Cruzamento com        |---->|  Tabela          |
|  match-user-      |     |  Saldo do Usuário      |     |  user_travel_    |
|  promotions       |     +------------------------+     |  suggestions     |
+-------------------+                                    +------------------+
         |
         v
+-------------------+
|  Frontend         |
|  TravelSuggestions|
|  Cards            |
+-------------------+
```

---

## Fase 1: Infraestrutura de Banco de Dados

### 1.1 Nova Tabela: `scraped_promotions`
Armazena promoções coletadas via Firecrawl.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| programa | text | Programa de milhas (Smiles, LATAM Pass, etc) |
| origem | text | Cidade/Aeroporto de origem (nullable) |
| destino | text | Cidade/Aeroporto de destino |
| milhas_min | integer | Quantidade mínima de milhas |
| link | text | URL da promoção original |
| titulo | text | Título da promoção |
| descricao | text | Descrição extraída |
| data_coleta | date | Data da coleta |
| fonte | text | Site de origem (melhores_destinos, passageiro_primeira, etc) |
| is_active | boolean | Se a promoção ainda está ativa |
| expires_at | date | Data de expiração (nullable) |
| created_at | timestamptz | Timestamp de criação |
| external_hash | text | Hash único para evitar duplicatas |

### 1.2 Nova Tabela: `user_travel_suggestions`
Armazena sugestões personalizadas por usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| user_id | uuid | Referência ao usuário |
| promotion_id | uuid | Referência à promoção |
| saldo_usuario | integer | Saldo no momento do match |
| programa_usuario | text | Programa de origem do saldo |
| mensagem | text | Mensagem personalizada gerada |
| is_viewed | boolean | Se o usuário já visualizou |
| created_at | timestamptz | Timestamp de criação |

### 1.3 Tabela de Log: `scraping_jobs`
Controle de execuções do scraper.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| started_at | timestamptz | Início da execução |
| completed_at | timestamptz | Fim da execução |
| status | text | pending, running, completed, failed |
| pages_scraped | integer | Quantidade de páginas processadas |
| promotions_found | integer | Promoções encontradas |
| errors | jsonb | Log de erros |

---

## Fase 2: Edge Function - Scraper de Promoções

### 2.1 `supabase/functions/firecrawl-promotions-scraper/index.ts`

**Responsabilidades:**
- Acessar páginas específicas das fontes autorizadas
- Filtrar apenas páginas com conteúdo de milhas
- Extrair dados estruturados
- Normalizar e salvar no banco

**Fontes e URLs-Alvo:**

```typescript
const SOURCES = [
  {
    name: 'melhores_destinos',
    baseUrl: 'https://www.melhoresdestinos.com.br',
    targetPaths: [
      '/promocao-passagens-milhas',
      '/passagens-com-milhas',
      '/milhas-aereas'
    ]
  },
  {
    name: 'passageiro_primeira',
    baseUrl: 'https://passageirodeprimeira.com',
    targetPaths: [
      '/categoria/promocoes-milhas',
      '/tag/milhas'
    ]
  },
  {
    name: 'smiles',
    baseUrl: 'https://www.smiles.com.br',
    targetPaths: [
      '/promocoes',
      '/passagens-aereas'
    ]
  },
  {
    name: 'latam_pass',
    baseUrl: 'https://latampass.latam.com',
    targetPaths: [
      '/pt_br/descubra-o-programa/promocoes'
    ]
  },
  {
    name: 'tudoazul',
    baseUrl: 'https://www.voeazul.com.br/tudoazul',
    targetPaths: [
      '/promocoes',
      '/resgates-especiais'
    ]
  }
];
```

**Detector de Página de Milhas:**

```typescript
const MILEAGE_KEYWORDS = [
  'milhas', 'pontos', 'resgate', 'programa de fidelidade',
  'passagem com milhas', 'promoção de milhas', 'destino por milhas'
];

function isValidMileagePage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const matchCount = MILEAGE_KEYWORDS.filter(kw => 
    lowerContent.includes(kw)
  ).length;
  return matchCount >= 2; // Mínimo 2 termos
}
```

**Extração com Firecrawl JSON Schema:**

```typescript
const extractionSchema = {
  type: 'object',
  properties: {
    promotions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          programa: { type: 'string' },
          origem: { type: 'string' },
          destino: { type: 'string' },
          milhas_min: { type: 'number' },
          titulo: { type: 'string' },
          descricao: { type: 'string' },
          data_expiracao: { type: 'string' }
        }
      }
    }
  }
};
```

---

## Fase 3: Edge Function - Match de Usuários

### 3.1 `supabase/functions/match-user-promotions/index.ts`

**Lógica de Cruzamento:**

```typescript
// Para cada usuário com saldo de milhas
// 1. Buscar saldo de card_mileage_rules (existing_miles)
// 2. Buscar saldo de mileage_programs (balance_miles)
// 3. Comparar com promoções ativas
// 4. Se saldo >= milhas_min, criar sugestão

function generatePersonalizedMessage(
  destino: string,
  milhas_min: number,
  programa: string,
  saldo_usuario: number
): string {
  return `Você pode viajar para ${destino} usando ${milhas_min.toLocaleString()} ` +
    `milhas do programa ${programa}. Você possui ` +
    `${saldo_usuario.toLocaleString()} milhas disponíveis.`;
}
```

---

## Fase 4: Componentes Frontend

### 4.1 `src/components/financial/TravelSuggestionsSection.tsx`

**Features:**
- Carrega sugestões personalizadas do usuário
- Exibe cards com: destino, programa, milhas necessárias, saldo do usuário, link
- Filtros por programa e destino
- Marca como visualizado ao clicar
- Atualização automática quando novas sugestões chegam

**Estrutura do Card:**

```text
+----------------------------------------------+
|  [Logo Programa]  DESTINO                    |
|                                              |
|  Programa: LATAM Pass                        |
|  Milhas necessárias: 28.000                  |
|  Seu saldo: 41.200 milhas                    |
|  Economia: R$ 2.800                          |
|                                              |
|  [Ver Oferta]  [Marcar como Favorito]        |
+----------------------------------------------+
```

### 4.2 Integração com `MileagePage.tsx`

Adicionar nova seção entre `PromotionsSection` e `SmartAlertsSection`:

```typescript
<TravelSuggestionsSection 
  userId={user.id}
  onPromotionClick={handlePromotionClick}
/>
```

---

## Fase 5: Automação - Cron Job Diário

### 5.1 Agendamento via pg_cron

```sql
-- Executa scraper diariamente às 6h (horário de Brasília)
SELECT cron.schedule(
  'daily-promotions-scrape',
  '0 9 * * *', -- 9h UTC = 6h BRT
  $$
  SELECT net.http_post(
    url := 'https://elxttabdtddlavhseipz.supabase.co/functions/v1/firecrawl-promotions-scraper',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Executa match de usuários após scraping (6:30h)
SELECT cron.schedule(
  'daily-user-match',
  '30 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://elxttabdtddlavhseipz.supabase.co/functions/v1/match-user-promotions',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);
```

---

## Fase 6: Hooks e Utilitários

### 6.1 `src/hooks/useTravelSuggestions.ts`

```typescript
export function useTravelSuggestions() {
  // Carrega sugestões do usuário
  // Permite marcar como favorito
  // Permite ocultar sugestões
  // Subscrição em tempo real para novas sugestões
}
```

### 6.2 `src/lib/api/firecrawl.ts`

Cliente para comunicação com edge functions Firecrawl (já documentado no contexto).

---

## Sequência de Implementação

| Etapa | Descrição | Prioridade |
|-------|-----------|------------|
| 1 | Criar migrações de banco de dados | Alta |
| 2 | Implementar `firecrawl-promotions-scraper` | Alta |
| 3 | Implementar `match-user-promotions` | Alta |
| 4 | Criar `TravelSuggestionsSection.tsx` | Alta |
| 5 | Criar `useTravelSuggestions` hook | Alta |
| 6 | Integrar na `MileagePage` | Alta |
| 7 | Configurar cron jobs | Média |
| 8 | Adicionar RLS policies | Alta |
| 9 | Testes e ajustes | Alta |

---

## Detalhes Técnicos

### Políticas RLS

```sql
-- scraped_promotions: Leitura pública (promoções são públicas)
CREATE POLICY "Anyone can read active promotions"
  ON scraped_promotions FOR SELECT
  USING (is_active = true);

-- user_travel_suggestions: Apenas próprio usuário
CREATE POLICY "Users can read own suggestions"
  ON user_travel_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON user_travel_suggestions FOR UPDATE
  USING (auth.uid() = user_id);
```

### Tratamento de Erros

- Retry automático em caso de falha de conexão
- Log detalhado de páginas que falharam
- Notificação ao admin se scraping falhar completamente
- Cache de páginas já processadas para evitar duplicatas

### Limites e Segurança

- Máximo de 50 páginas por execução
- Rate limiting: 2 requests por segundo
- Timeout de 30s por página
- Apenas leitura de conteúdo público
- Sem simulação de compra ou login

---

## Resultado Final

O usuário terá acesso a:

1. **Cards de Sugestões Personalizadas** na página de Milhagem
2. **Notificações Automáticas** quando novas promoções compatíveis surgirem
3. **Histórico de Promoções** visualizadas e favoritas
4. **Atualização Diária** automática de novas ofertas
5. **Links Diretos** para as ofertas nos sites oficiais
