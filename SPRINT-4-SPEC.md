# SPRINT 4 — SEO Performance Intelligence
### Baseline: tag `blog-dimus/v1.5.0-gate3-fixes` · 2026-07-12
### Metodologia: WAVES (spec → código → audit adversarial por wave)

> **Princípio-mestre:** "marketing que mede carro vendido, não lead" — só adicionamos métricas que informam UMA decisão executável (o que escrever, o que promover, o que consertar).

---

## Contexto e Motivação

### Estado atual do sistema
- **Pipeline SEO autônomo:** 11+ artigos publicados, 45 keywords em portfolio, cron Mon/Wed/Fri 9am gera + publica
- **GA4:** G-Q6KH427C70 configurado, `generate_lead` como key event
- **GSC:** sitemap submetido, `gsc-keyword-feeder` extrai striking-distance → Supabase `seoa_seed_keywords`
- **D1 `blog-tracking`:** 7 migrations aplicadas — sessions, leads, page_views, magnet_downloads, newsletter, GHL IDs
- **Admin `/admin`:** painel com leads/magnet_downloads/page_views, protegido por HMAC token

### O que falta (gap analítico identificado)
| Pergunta executável | Dados hoje | Dados faltando |
|---|---|---|
| Qual artigo está gerando tráfego orgânico? | ❌ | GSC clicks/impressions por página |
| Qual keyword estamos no top 10 e subindo? | ❌ | DataForSEO posição semanal |
| Os leitores chegam ao CTA? | ❌ | Scroll depth ≥75%, clique no CTA |
| Qual artigo gerou o 1º contato do lead? | parcial (UTM) | Attribution first-touch por post_slug |
| O que escrever semana que vem? | ❌ | GSC queries sem artigo dedicado |

---

## Embasamento (pesquisa ultra — verificado em fontes primárias)

### GSC como fonte de verdade primária
- **Lag de dados:** 2–3 dias. Janela ideal: `date BETWEEN today-4 AND today-2`.
- **Limitação de combinação de dimensões:** GSC descarta linhas ao combinar `page + query` em uma call. Solução: duas calls separadas — uma por `query`, outra por `page`.
- **Dado mais valioso para blog < 6 meses:** `impressions` (prova de indexação e crawl), não `clicks`. Blog novo tem impressões antes de cliques.
- **O que triggers:** CTR < 3% com impressões > 200 = problema de title/meta → ação imediata.

### DataForSEO: endpoint correto e custo real
- **Endpoint:** `serp/google/organic` (Standard, não Live). NOT `dataforseo_labs` — esse é atualizado semanalmente no banco, não real-time.
- **Custo verificado:** $0.0006/keyword/check × 45 keywords × 52 semanas = **$1.40/ano**.
- **Cadência ótima:** semanal. Posições variam ±2–3/dia (ruído de personalização). Semanal tem sinal.
- **Alert thresholds comprovados:** queda ≥5 posições em uma semana = critical; saída do top 3 → top 10 = high; saída do top 10 = warning.
- **`stop_crawl_on_match=true`** economiza 30–50% de depth custo.

### Engajamento e conversão B2B
- Touchpoints médios B2B antes de conversão: **6–8** (Avid Demand 2025). Multi-touch é necessário desde o MVP.
- **Sinal #1 de intenção:** visita de retorno (mesmo visitor_id, 2ª sessão em 7 dias) — correlaciona com purchase intent mais que scroll depth.
- **Scroll ≥75%** = artigo foi lido (não bounced após intro). GA4 nativo dispara apenas em 90%. Precisa de beacon custom.
- **Attribution model:** Linear como operacional (implementável em SQL puro); First-touch como secundário ("qual artigo trouxe o lead?").

### Prioridade 80/20 (dev budget 5 dias)
| Prioridade | Item | Valor | Esforço |
|---|---|---|---|
| P0 | GSC daily → D1 | mais alto | 0.5 dia (estende worker existente) |
| P0 | Weekly content rollup + dashboard | mais alto | 0.5 dia |
| P1 | DataForSEO weekly rank → D1 | alto | 1 dia |
| P1 | Scroll + CTA beacon → D1 | alto | 1 dia |
| P2 | Alert system Tier 1 (Slack) | médio | 0.5 dia |
| P3 | Attribution touchpoints | médio | 1 dia |
| P3 | Content gap query no admin | médio | 0.5 dia |

---

## Schema D1 — Migration 0008

5 novas tabelas. Nenhuma altera tabelas existentes (additive only).

```sql
-- 1. GSC daily: impressions/clicks/CTR/position por query e por page
CREATE TABLE IF NOT EXISTS gsc_daily (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  row_type    TEXT NOT NULL CHECK (row_type IN ('query','page')),
  dimension   TEXT NOT NULL,   -- query string OU page URL
  clicks      INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr         REAL,
  position    REAL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE(date, row_type, dimension)
);
CREATE INDEX IF NOT EXISTS idx_gsc_date     ON gsc_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_type_dim ON gsc_daily(row_type, dimension);

-- 2. Rank snapshots: DataForSEO posição semanal por keyword
CREATE TABLE IF NOT EXISTS rank_snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at    TEXT NOT NULL,   -- 'YYYY-MM-DD' (domingo da semana)
  keyword       TEXT NOT NULL,
  position      INTEGER,         -- NULL = não está no top 100
  page_url      TEXT,
  serp_features TEXT,            -- JSON: ["featured_snippet","paa"]
  prev_position INTEGER,
  delta         INTEGER,         -- positivo = piorou, negativo = melhorou
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE(checked_at, keyword)
);
CREATE INDEX IF NOT EXISTS idx_rank_keyword  ON rank_snapshots(keyword, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_position ON rank_snapshots(position);

-- 3. Page events: scroll depth + CTA cliques + engagement (beacon JS)
CREATE TABLE IF NOT EXISTS page_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  visitor_id  TEXT,              -- cookie persistente (return visit detection)
  page_slug   TEXT NOT NULL,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'scroll_25','scroll_50','scroll_75','scroll_90',
    'cta_click','exit_to_contact','return_visit','time_on_page'
  )),
  cta_label   TEXT,
  value_int   INTEGER,           -- segundos p/ time_on_page
  referrer    TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_pe_session   ON page_events(session_id);
CREATE INDEX IF NOT EXISTS idx_pe_slug_type ON page_events(page_slug, event_type);
CREATE INDEX IF NOT EXISTS idx_pe_date      ON page_events(occurred_at DESC);

-- 4. Attribution touchpoints: multi-touch lead attribution
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_ref    TEXT NOT NULL,     -- mesmo lead_ref da tabela leads
  session_id  TEXT NOT NULL,
  page_slug   TEXT NOT NULL,
  touch_order INTEGER NOT NULL,  -- 1=first touch, N=last touch
  touch_type  TEXT NOT NULL CHECK (touch_type IN (
    'organic_blog','direct','paid','social','email','referral'
  )),
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attr_lead ON attribution_touchpoints(lead_ref, touch_order);
CREATE INDEX IF NOT EXISTS idx_attr_slug ON attribution_touchpoints(page_slug);

-- 5. Content weekly rollup: precomputado toda segunda 8h
CREATE TABLE IF NOT EXISTS content_weekly (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start          TEXT NOT NULL,   -- 'YYYY-MM-DD' (segunda-feira)
  page_slug           TEXT NOT NULL,
  gsc_clicks          INTEGER DEFAULT 0,
  gsc_impressions     INTEGER DEFAULT 0,
  gsc_ctr             REAL,
  gsc_position        REAL,
  best_query          TEXT,            -- query com mais impressões essa semana
  rank_position       INTEGER,
  rank_delta          INTEGER,
  total_pageviews     INTEGER DEFAULT 0,
  scroll_75_rate      REAL,
  cta_click_rate      REAL,
  avg_time_on_page    INTEGER,
  return_visitor_rate REAL,
  first_touch_leads   INTEGER DEFAULT 0,
  linear_credit       REAL DEFAULT 0,
  action_signal       TEXT CHECK (action_signal IN (
    'promote','optimize_title','update_content','monitor','new_needed'
  )),
  UNIQUE(week_start, page_slug)
);
CREATE INDEX IF NOT EXISTS idx_cw_week   ON content_weekly(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_cw_signal ON content_weekly(action_signal, week_start DESC);
```

**Logic de `action_signal` (calculada no rollup cron):**
```
impressions > 200 AND ctr < 0.03                        → 'optimize_title'
rank_delta > 5 AND rank_position <= 20                  → 'update_content'
scroll_75_rate > 0.6 AND cta_click_rate > 0.03          → 'promote'
first_touch_leads > 0                                   → 'promote'
ELSE                                                    → 'monitor'
```

---

## WAVES de Implementação

### WAVE 1 — Schema + Foundation
**Critério binário:** `sqlite_master` mostra as 5 novas tabelas + todos os índices; zero erro no `wrangler d1 execute`.

**Entregáveis:**
- `migrations/0008_analytics_intelligence.sql` com as 5 tabelas
- Migration aplicada no D1 remoto `71f19cdf-555b-46f3-9b13-b81eb1238e96`
- Commit + tag `blog-dimus/v2.0.0-sprint4-w1`

**Out of scope:** nenhum dado ainda, só schema.

---

### WAVE 2 — GSC Daily Ingestion (P0)
**Critério binário:** `SELECT COUNT(*), MIN(date), MAX(date) FROM gsc_daily` retorna ≥2 rows com datas cobrindo pelo menos `today - 4` a `today - 2`.

**Implementação:**
1. Extend `gsc-keyword-feeder` worker (`~/Downloads/seo-agency-cron/` ou repo ia-skills):
   - Adicionar binding D1 `BLOG_ANALYTICS` apontando para `71f19cdf`
   - Adicionar função `pullGscDaily(env, accessToken)`:
     - Call 1: `dimensions: ["query"]` → insere `row_type='query'` em `gsc_daily`
     - Call 2: `dimensions: ["page"]` → insere `row_type='page'` em `gsc_daily`
     - Janela: `today - 4` até `today - 2` (respeita lag de 2–3 dias)
     - `ON CONFLICT(date, row_type, dimension) DO UPDATE` (upsert idempotente)
   - Manter comportamento atual (seed `seoa_seed_keywords`) intacto
2. Cron: já existente (`0 4 * * 1` → mudar para `0 6 * * *` daily)
3. Trigger manual `/trigger` p/ smoke

**Arquivos:**
- `gsc-keyword-feeder/src/index.js` (extend existing)
- `gsc-keyword-feeder/wrangler.toml` (adicionar D1 binding + cron update)

**Commit + tag `blog-dimus/v2.1.0-sprint4-gsc`**

---

### WAVE 3 — DataForSEO Weekly Rank Tracking (P1)
**Critério binário:** `SELECT COUNT(*), MIN(position), MAX(position) FROM rank_snapshots` retorna ≥45 rows com posições reais (não todas NULL).

**Implementação:**
1. Novo Worker `rank-tracker` (ou nova rota em `seo-agency-cron`):
   - Lê keywords de Supabase `seoa_keyword_portfolio` (as mesmas 45 keywords)
   - Para cada keyword: call DataForSEO `serp/google/organic` Standard
     - `keyword`, `language_code: "pt"`, `location_name: "Brazil"`, `depth: 10`, `stop_crawl_on_match: true`
   - Busca `prev_position` do último snapshot dessa keyword
   - Calcula `delta = position - prev_position`
   - Inserta em `rank_snapshots`
2. Cron: `0 7 * * 0` (domingo 7am — semanal)
3. Alert Tier 1: se `delta > 5 OR position > 10 AND prev_position <= 10`:
   - POST para `SLACK_WEBHOOK_URL` (env var) com mensagem: keyword, posição anterior → nova, delta
4. Trigger manual `/trigger?action=rank` p/ smoke

**Secrets necessários (CF Pages secret put):**
- `DATAFORSEO_AUTH_B64` (existente no GSM `dimus-dataforseo-auth-b64`)
- `SLACK_WEBHOOK_URL` (criar webhook no canal #seo-alerts)

**Commit + tag `blog-dimus/v2.2.0-sprint4-rank`**

---

### WAVE 4 — Scroll + CTA Beacon (P1)
**Critério binário:** Após visitar um post e chegar ao CTA, `SELECT event_type, COUNT(*) FROM page_events GROUP BY event_type` mostra `scroll_75 ≥ 1` e `cta_click ≥ 1`.

**Implementação (2 partes):**

**Parte A — Blog JS beacon (`src/scripts/analytics.ts`):**
```typescript
// ~25 linhas — dispara eventos sem bloquear interação
const SLUG = document.body.dataset.postSlug ?? ''
const SESSION = localStorage.getItem('session_id') ?? crypto.randomUUID()
const VISITOR = localStorage.getItem('visitor_id') ?? (
  () => { const id = crypto.randomUUID(); localStorage.setItem('visitor_id', id); return id }
)()
localStorage.setItem('session_id', SESSION)

function beacon(type: string, extra?: Record<string,unknown>) {
  navigator.sendBeacon('/analytics', JSON.stringify({ type, slug: SLUG, session_id: SESSION, visitor_id: VISITOR, referrer: document.referrer, ...extra }))
}

// Scroll depth milestones
let fired = new Set<string>()
addEventListener('scroll', () => {
  const pct = (scrollY / (document.body.scrollHeight - innerHeight)) * 100
  for (const t of [25,50,75,90]) {
    if (pct >= t && !fired.has(`s${t}`)) { fired.add(`s${t}`); beacon(`scroll_${t}`) }
  }
}, { passive: true })

// CTA clicks
document.querySelectorAll('[data-cta]').forEach(el =>
  el.addEventListener('click', () => beacon('cta_click', { cta_label: (el as HTMLElement).dataset.cta }))
)

// Time on page (beforeunload)
const entered = Date.now()
addEventListener('beforeunload', () => beacon('time_on_page', { value_int: Math.round((Date.now() - entered) / 1000) }))
```

**Parte B — CF Worker endpoint `/analytics` em `functions/analytics.js`:**
- Parse body JSON
- Valida `event_type` contra allowlist
- Inserta em D1 `page_events` (binding `BLOG_ANALYTICS` ← mesma DB do worker, mas aqui nas CF Pages Functions)
- Retorna 204 (sem corpo — é beacon)

**Parte C — Attribution first-touch:**
- Em `src/scripts/lead.ts` (já existente): ao preparar o payload do form, incluir:
  - `first_touch_slug`: primeiro slug visto na sessão (read de localStorage `touchpoints` JSON array)
  - `page_slugs`: array de slugs visitados na sessão (máx 10)
- Em `functions/tracker.js`: após INSERT em leads, inserir attribution_touchpoints rows:
  - `touch_order=1` para first_touch_slug, `touch_type` inferido do referrer/UTM

**Adicionar `data-cta` aos componentes existentes:**
- `LeadForm.astro`: botão submit → `data-cta="lead_form_{slug}"`
- `DimusHelp.astro`: link → `data-cta="help_{variant}"`
- `Calculator*.astro`: botão → `data-cta="calc_{type}"`

**Commit + tag `blog-dimus/v2.3.0-sprint4-beacon`**

---

### WAVE 5 — Weekly Rollup + Dashboard Upgrade (P0)
**Critério binário:** Após rodar o cron manualmente, `/admin` mostra tabela `content_weekly` com coluna `action_signal` preenchida. Query de content gap retorna resultados.

**Implementação (3 partes):**

**Parte A — Cron rollup (`functions/analytics-rollup.js`):**
Cron: `0 8 * * 1` (segunda-feira 8am)

```sql
-- Para cada page_slug com dados na semana:
INSERT OR REPLACE INTO content_weekly (week_start, page_slug, gsc_clicks, gsc_impressions, ...)
SELECT
  date('now', 'weekday 1', '-7 days') as week_start,
  -- GSC data (last 7 days from gsc_daily where row_type='page' and dimension like blog URL)
  -- page_events: scroll_75_rate, cta_click_rate, avg_time_on_page
  -- rank_snapshots: rank_position, rank_delta
  -- attribution_touchpoints: first_touch_leads, linear_credit
  -- action_signal: CASE logic
```

**Parte B — `/admin` estendido:**
- Nova seção "Performance Semanal" acima dos leads:
  - Tabela `content_weekly` ordenada por action_signal (promote → optimize_title → update_content → monitor)
  - Colunas: artigo | clicks | posição GSC | posição DataForSEO | scroll_75% | CTA% | leads | action_signal
  - Badge colorido por action_signal (verde=promote, amarelo=optimize, vermelho=update_content, cinza=monitor)

- Nova seção "Content Gap (próximos artigos)":
  ```sql
  SELECT dimension as query, SUM(impressions) as total_impressions, MIN(position) as best_pos
  FROM gsc_daily WHERE row_type='query'
    AND dimension NOT IN (SELECT DISTINCT best_query FROM content_weekly WHERE week_start >= date('now','-30 days'))
    AND date >= date('now','-30 days')
  GROUP BY dimension HAVING total_impressions > 30
  ORDER BY total_impressions DESC LIMIT 10
  ```

**Parte C — Wrangler binding:**
- Adicionar `[[d1_databases]] binding = "BLOG_ANALYTICS"` em `wrangler.toml` das CF Pages Functions apontando para DB `71f19cdf`

**Commit + tag `blog-dimus/v2.4.0-sprint4-dashboard`**

---

### WAVE 6 — Gate Adversarial + Audit (obrigatório por metodologia)
**Critério binário:** gate audit workflow retorna PASS ou lista de must-fix aplicados. Build verde. Zero `eval`/`innerHTML` nos novos arquivos.

**Checklist mínimo:**
- [ ] `analytics.js` endpoint: validar `event_type` contra allowlist (já no schema CHECK, reforçar no código)
- [ ] `analytics.ts` beacon: não expor dados PII (visitor_id é UUID opaco, sem email/phone)
- [ ] attribution: `page_slugs` truncado em 10 itens (evitar overflow de payload)
- [ ] D1 writes no `analytics.js`: `ctx.waitUntil()` (não bloquear 204 response)
- [ ] Rate limiting: `/analytics` endpoint exposto sem auth → adicionar CF Rate Limiting (3/10s por IP, mesmo padrão do /tracker)
- [ ] `content_weekly` rollup: rollup idempotente (`INSERT OR REPLACE`), pode rerun sem duplicar

---

## Critério de Conclusão do Sprint

Sprint 4 está completo quando:

1. ✅ `sqlite_master` mostra 5 novas tabelas (Wave 1)
2. ✅ `gsc_daily` tem dados de ≥2 datas distintas (Wave 2)
3. ✅ `rank_snapshots` tem ≥45 rows com posições (Wave 3)
4. ✅ `page_events` tem scroll_75 + cta_click de smoke real no site (Wave 4)
5. ✅ `/admin` exibe `content_weekly` + content gap list (Wave 5)
6. ✅ Gate adversarial: PASS ou must-fix aplicados (Wave 6)

---

## O Que Este Sprint NÃO Faz (escopo negativo)

- ❌ Não migra dados históricos (page_views existente continua separado)
- ❌ Não integra GA4 Data API (GA4 fica como cross-check manual, não source of truth)
- ❌ Não implementa email alerts (só Slack webhook)
- ❌ Não cria novo blog posts (esse é o job do seo-agency-cron)
- ❌ Não indexa no Algolia/Search (post-Sprint 5)

---

## Decisões Travadas (não mudar sem novo ADR)

1. **D1 como store de analytics** (não Supabase): latência edge, custo zero, não cruza dados PII do CRM.
2. **Beacon via `sendBeacon` + `/analytics` CF Pages Function**: mesma infraestrutura existente, zero cold start.
3. **Attribution model: Linear (default) + First-touch (secondary)**: implementável em SQL puro sem ML.
4. **DataForSEO SERP Standard** (não Labs): controle de cadência real, $1.40/ano.
5. **Alert via Slack webhook**: simplicidade > dashboards complexos para solo founder.

---

## Referências de pesquisa (fontes primárias verificadas)

- GSC API docs: `developers.google.com/webmaster-tools/v1/how-tos/all-your-data`
- DataForSEO SERP pricing: `dataforseo.com/apis/serp-api/pricing` ($0.0006/keyword)
- DataForSEO Labs refresh: semanal (não real-time) — confirmar antes de usar para tracking
- D1 json_group_array: suportado (docs.cloudflare.com/d1/sql-api/query-json/)
- B2B touchpoints: 6–8 (Avid Demand 2025)
- Scroll GA4 nativo: dispara apenas 90% (Analytics Mania, GTM custom threshold para 75%)
- Surface Labs B2B Lead Benchmarks 2025: blog pós converte 0.3–0.8% (vs. 5–15% demo page)
