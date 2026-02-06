
# Plano: Integrar API "Passageiro de Primeira" ao Sistema de Milhagens

## Problema Identificado
A API Python está rodando localmente (`http://127.0.0.1:8000`), mas as Edge Functions do Lovable rodam em servidores remotos da Supabase e **nao conseguem acessar localhost**.

## Solucao Proposta: Endpoint de Importacao

Vou criar um sistema onde a API Python **envia os dados** para o Lovable, ao inves do Lovable tentar buscar dados de localhost.

```text
+---------------------+     POST /import-deals      +----------------------+
| API Python          | -------------------------> | Edge Function        |
| (localhost:8000)    |   (JSON com deals)         | import-pdp-deals     |
+---------------------+                            +----------------------+
                                                            |
                                                            v
                                                   +----------------------+
                                                   | scraped_promotions   |
                                                   | (Supabase DB)        |
                                                   +----------------------+
                                                            |
                                                            v
                                                   +----------------------+
                                                   | UI Mileage Page      |
                                                   | (Cards de promocoes) |
                                                   +----------------------+
```

---

## Arquitetura da Integracao

### Opcao A: Push da API Python (Recomendado)
A API Python envia dados diretamente para uma Edge Function publica.

### Opcao B: Deploy Publico
Deploy da API em servidor publico (Heroku, Railway, Render) ou usar ngrok para expor localhost.

**Vou implementar a Opcao A** pois e mais simples e nao requer infra adicional.

---

## Etapas de Implementacao

### 1. Criar Edge Function `import-pdp-deals`
Nova funcao para receber deals do Passageiro de Primeira:

**Arquivo**: `supabase/functions/import-pdp-deals/index.ts`

```text
- Endpoint: POST com array de deals
- Valida estrutura dos dados
- Parsea milhas do campo cost_raw (ex: "4.510 Milhas")
- Insere na tabela scraped_promotions
- Retorna contagem de sucesso/erros
```

### 2. Mapeamento de Campos

| API Python | scraped_promotions | Transformacao |
|------------|-------------------|---------------|
| origin | origem | Direto |
| destination | destino | Direto |
| cost_raw | milhas_min | Regex para extrair numero |
| source_url | link | Direto |
| full_text | titulo | Direto ou truncar |
| - | programa | Detectar (LATAM, Azul, Smiles) |
| - | fonte | "passageirodeprimeira" |
| - | data_coleta | Data atual |

### 3. Atualizar UI
- Adicionar badge "Passageiro de Primeira" com cor especifica
- Manter compatibilidade com promocoes existentes

### 4. Script de Integracao Python
Fornecer codigo para sua API Python chamar a Edge Function:

```text
POST https://[supabase-url]/functions/v1/import-pdp-deals
Content-Type: application/json
Authorization: Bearer [anon-key]

Body: { "deals": [...] }
```

---

## Detalhes Tecnicos

### Parsing do campo `cost_raw`
Exemplos a tratar:
- `"R$ 163,54 com taxas inclusas ou 4.510 Milhas + taxas"` → 4510 milhas
- `"R$ 663"` → sem milhas (valor em reais apenas)
- `"51 mil pontos Azul + taxas"` → 51000 pontos

### Deteccao de Programa
Logica no parser:
- Se contem "Smiles" → programa: "Smiles"
- Se contem "LATAM" ou "Pass" → programa: "LATAM Pass"  
- Se contem "Azul" ou "TudoAzul" → programa: "TudoAzul"
- Padrao → programa: "Diversos"

### Deduplicacao
Usar `external_hash` baseado em origem+destino+milhas+data para evitar duplicatas.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/import-pdp-deals/index.ts` | Criar |
| `src/lib/api/passageiroPrimeira.ts` | Criar (helper opcional) |
| `src/components/financial/ScrapedPromotionsList.tsx` | Atualizar cores |
| Script Python de integracao | Documentar |

---

## Como Testar

1. Apos deploy da Edge Function, rodar no terminal Python:
```python
import requests
deals = [{"origin": "Sao Paulo", "destination": "Miami", "cost_raw": "35.000 milhas", "source_url": "..."}]
response = requests.post("https://[url]/functions/v1/import-pdp-deals", json={"deals": deals})
```

2. Verificar na UI se os cards aparecem

---

## Resultado Final
- Dados do Passageiro de Primeira aparecerao nos cards de promocoes
- Sistema identifica automaticamente se usuario pode resgatar com suas milhas
- Atualizacao pode ser automatizada no script Python para rodar diariamente
