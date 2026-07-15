# SPEC — Reconstrução do Dashboard Admin blog.dimus.com.br (Content + Analytics)

> Status: **DRAFT — aguardando aprovação humana**
> Data: 2026-07-14
> Repo: `~/Downloads/blog-dimus` | Stack atual: Astro estático + Cloudflare Pages Functions (`functions/admin.js`, `functions/tracker.js`) + D1 `blog-tracking` (id `71f19cdf-555b-46f3-9b13-b81eb1238e96`) + Clerk auth
> Workflow: WAVES obrigatório (`SPEC.md` → code → `NOTES.md` antes de cada `/compact`)

---

## 1. Resumo Executivo

O admin atual de blog.dimus.com.br mostra números que são **94% mentira**: das 29.855 sessions no D1, ~25.430 vieram de `axios/1.13.2` e ~1.955 de `curl/8.7.1` — sobram ~1.692 sessions reais. O spike de 2026-07-05 (13.327 sessions num dia com padrão normal de 500–1.000) é integralmente bot. Nenhuma query do dashboard filtra isso hoje, então qualquer decisão editorial tomada em cima dele é decisão em cima de lixo.

Estado desejado: um dashboard de **conteúdo e conversão** (modelo HubSpot/Ghost, não Plausible/Vercel) que amarra cada post a leads e origem, sobre dados limpos, com identidade visual do blog (dark `#0b0a0d`, magenta `#e1379e`, Fraunces + JetBrains Mono) em vez do layout genérico atual.

Dois bloqueadores foram identificados: (a) a poluição de bot precisa ser corrigida na ingestão E nas queries antes de qualquer UI nova — senão a UI nova exibe o mesmo lixo bonito (segue bloqueador real, ver Wave 1); (b) ~~não existe credencial para GA4/GSC hoje~~ **RESOLVIDO 2026-07-14** — SA `dimus-seo@dimus-billing-monitor.iam.gserviceaccount.com` criada, chave salva no GSM (`dimus-seo-sa-json`), concedida como Leitor na conta GA4 "Dimus" e como Restrita na Domain Property GSC `sc-domain:dimus.com.br`. Validado com smoke-test real: `runReport` (GA4) e `searchAnalytics.query` (GSC) retornaram HTTP 200 com dados reais. **Property ID correto da GA4 é `543369220`** (não 542894737 — esse era um ID antigo/stale de antes da property passar pela lixeira e ser restaurada; measurement ID `G-Y7PSFTCZJL` permanece o mesmo). Wave 0 **desbloqueada** — Wave 4 pode prosseguir sem depender de ação humana adicional.

---

## 2. Métricas Finais do Dashboard

### 2.1 Disponíveis hoje no D1 (pós-filtro de bot) — núcleo do dashboard

| # | Métrica | Fonte | Observação |
|---|---|---|---|
| M1 | Page views (reais) | `page_views` filtrado `is_bot = 0` | baseline atual ~5.655 bruto |
| M2 | Sessions reais | `sessions` filtrado `is_bot = 0` | ~1.692 estimadas de 29.855 |
| M3 | Leads totais | `leads` | 2 hoje — número pequeno é informação, não vergonha; exibir sem inflar |
| M4 | Conversão por post (view → lead) | `page_views` × `leads` por `post_slug` | métrica central de ROI por peça (padrão HubSpot/Ghost: coluna na tabela de posts, não gráfico separado) |
| M5 | Downloads por lead magnet | `magnet_downloads` × catálogo `admin_catalog` | biblioteca finita de magnets |
| M6 | Origem/UTM por lead e por session | `sessions.utm_source` (first-touch lock-in) | "de onde veio a conversão", não só o tráfego |
| M7 | Posts distintos com tráfego | `page_views.post_slug` | 35 hoje |
| M8 | Série temporal sessions/views por dia | agregação por `created_at` | com marcador visual nos dias com bot filtrado (transparência do filtro) |
| M9 | % de tráfego bot descartado | `sessions` `is_bot = 1` vs total | métrica de saúde do próprio tracking — exibida na seção Sistema, não no overview |

### 2.2 Fase GA4 (Wave 4 — depende da Wave 0)

| # | Métrica | Fonte |
|---|---|---|
| M10 | Sessions GA4 + engaged sessions (engagement rate — substituto moderno de bounce rate) | GA4 Data API `runReport`: `sessions`, `engagedSessions` |
| M11 | Canal de aquisição (`sessionDefaultChannelGroup`) por dia | GA4 Data API |
| M12 | `generate_lead` (evento canônico, já emitindo client-side) — cruzamento com leads do D1 | GA4 Data API |

### 2.3 Fase GSC (Wave 4 — depende da Wave 0)

| # | Métrica | Fonte |
|---|---|---|
| M13 | Clicks, impressions, CTR orgânico por página/query | GSC `searchAnalytics.query` |
| M14 | Posição média **ponderada por impressions** (nunca média simples entre linhas) | GSC `searchAnalytics.query` |

### 2.4 Explicitamente FORA (ver §7)

Scroll depth, dwell time, atribuição multi-touch, revenue attribution, retention por cluster de leitor — exigem instrumentação client-side nova ou CRM integrado que não existem neste escopo.

---

## 3. Arquitetura

### 3.1 Stack (sem mudança de plataforma)

Mantém-se: Cloudflare Pages Functions + D1 binding `env.DB` + Clerk. Nada de framework novo, nada de SPA — o admin continua server-rendered pelo Pages Function, com HTML/CSS/JS vanilla inline (padrão atual do `functions/admin.js`), possivelmente quebrado em módulos (`functions/admin/*.js` — já existe `functions/admin/ds.js`).

### 3.2 Navegação — sidebar persistente colapsável

Padrão vencedor da pesquisa para produto com profundidade analítica por post (HubSpot/Umami), descartando single-page (não escala para as seções abaixo) e top-tabs (quebra com drill-down por post):

```
┌──────────────┬────────────────────────────────────────┐
│ SIDEBAR      │  KPI strip (4-6 cards): sessions reais │
│ 240px, cola- │  · views · leads · conversão média     │
│ psável p/    ├────────────────────────────────────────┤
│ ícones       │  Conteúdo da seção ativa               │
│              │                                        │
│ ▸ Overview   │                                        │
│ ▸ Posts      │  (tabela densa, drill-down por post)   │
│ ▸ Leads      │                                        │
│ ▸ Origens    │                                        │
│ ▸ Magnets    │                                        │
│ ▸ Busca*     │  * GA4/GSC — Wave 4                    │
│ ▸ Sistema    │  (saúde tracking, % bot, newsletter)   │
└──────────────┴────────────────────────────────────────┘
```

- **Overview**: KPI strip + série temporal (M8) + top 5 posts.
- **Posts**: tabela densa (padrão HubSpot/Ghost) com colunas views · sessions · leads · conversão % — o "funil" é coluna na tabela, não gráfico de funil dedicado.
- **Leads**: lista de leads com post de origem, magnet, UTM (M6).
- **Origens**: breakdown utm_source/medium/campaign.
- **Magnets**: downloads por magnet (M5) vs. catálogo ativo.
- **Busca (GA4/GSC)**: renderizada como painel "aguardando credencial" (empty state honesto) enquanto Wave 0 não concluir. **Não assumir que dá pra implementar sem a credencial** — a seção nasce com feature-flag `GSC_GA4_ENABLED` desligada.
- **Sistema**: % bot descartado (M9), última ingestão, status newsletter/GHL.

### 3.3 Onde GA4/GSC entram (quando entrarem)

Padrão técnico validado na pesquisa (sem SDK Google — não roda em Workers):

1. Pages Function assina JWT RS256 via `crypto.subtle` (chave PKCS8 da SA `dimus-seo`, escopos `analytics.readonly` + `webmasters.readonly`) → troca por access token no endpoint OAuth2 (`jwt-bearer` grant).
2. Chamadas REST puras: `analyticsdata.googleapis.com/v1beta/properties/543369220:runReport` e `webmasters/v3/sites/sc-domain%3Adimus.com.br/searchAnalytics/query`.
3. **Nunca 1 chamada Google por request de usuário**: Cron Trigger diário pré-agrega e grava em tabelas D1 (`ga4_daily`, `gsc_daily`); o admin lê só do D1. Token cacheado ~55 min em KV. Respeita quotas (GA4: 200k tokens/dia property padrão; GSC: ~1.200 QPM/site) com backoff em 429.
4. Chave privada da SA: **GSM `dimus-seo-sa-json`** (já criada e validada) → injetar como secret do Pages project via wrangler antes da Wave 4. Nunca em arquivo do repo, nunca em `wrangler.toml`.

Wave 0 desbloqueada — Wave 4 pode implementar direto usando as credenciais já provisionadas.

---

## 4. Plano de Filtro de Bot

Cenário mais fácil possível: os bots **não se disfarçam** (`axios/1.13.2`, `curl/8.7.1` literais no header UA). Não precisa de TLS fingerprint custom, honeypot (inútil contra hit direto de API) nem challenge JS. Três camadas, nesta ordem:

### 4.1 Ingestão (correção estrutural — no `functions/tracker.js`)

- Bloquear na borda, **antes de gravar no D1**, requests cujo UA case com denylist: usar a lib `isbot` (npm, mantida ativamente — mesma do Umami) ou, se o bundle pesar, regex mínima `/curl|wget|axios|python-requests|python-urllib|go-http-client|scrapy|headlesschrome|\bbot\b|spider|crawler|postman|insomnia/i`.
- Responder `204` normal ao bot (padrão Umami: não sinalizar o bloqueio) e descartar.
- Camada extra gratuita: ler `request.cf.botManagement` / `verifiedBotCategory` quando disponível no plano — aditivo, não bloqueador desta wave.
- **Por que na ingestão e não só na query**: filtrar só na agregação deixa lixo permanente no D1 e qualquer query nova que esqueça o `WHERE` volta a exibir dado sujo.

### 4.2 Histórico (sem quebrar nada — migration `0008_is_bot.sql`)

- **Nunca DELETE.** Adicionar coluna `is_bot INTEGER NOT NULL DEFAULT 0` em `sessions` e `page_views`.
- Backfill retroativo: `UPDATE sessions SET is_bot = 1 WHERE user_agent LIKE 'axios/%' OR user_agent LIKE 'curl/%' OR <demais padrões da denylist>`; propagar para `page_views` via join por `session_id`.
- Raw preservado para auditoria; o spike de 2026-07-05 continua visível em queries `is_bot = 1`.

### 4.3 Queries do admin (`functions/admin.js`)

- Todas as agregações existentes (linhas ~163–198: totais, top posts, origens) passam a filtrar `is_bot = 0`.
- Números-alvo de sanidade após o filtro: sessions reais na ordem de **~1.692** (não 29.855); dia 2026-07-05 volta ao patamar de 500–1.000.
- Rate limit por IP fica como camada secundária futura (não resolve o problema atual, que é 100% identificável por UA) — registrado, não implementado.

---

## 5. Direção de Design (anti-slop, concreta)

Compromisso com UMA direção: **editorial dark denso** — herdando a identidade já aprovada no login do blog. Regras binárias, verificáveis em code review:

1. **Fundo**: `#0b0a0d` (o near-black com tint do blog — nunca `#000` puro, nunca navy genérico). Profundidade via escada de superfícies (2–3 níveis de luminosidade) + bordas hairline 1px; **zero** `box-shadow` decorativo, zero glow.
2. **Accent único**: magenta `#e1379e`, usado como lanterna — estado ativo da sidebar, deltas relevantes, links. Proibido: card colorido "pra ficar bonito", gradiente indigo→roxo, borda gradiente de um lado só, glassmorphism/blur.
3. **Tipografia**: Fraunces (serif) só em títulos de seção, peso ≤600; JetBrains Mono para **todos os números e tabelas** com `font-feature-settings: 'tnum'` (alinhamento tabular). Proibido: headline com gradiente de texto, Inter genérica.
4. **Densidade como virtude**: tabelas densas escaneáveis (padding 8–12px), grid rígido de 8px (8/16/24/32). O dashboard tem poucos dados hoje (2 leads, 35 posts) — exibir com honestidade e densidade, não esconder atrás de white space e 3 cards fofos.
5. **Ícones**: Lucide/Phosphor thin, monocromáticos, tamanho do texto ao redor. Nada ilustrativo/3D.
6. **Gráficos**: linha/área simples (série temporal) + barras horizontais (rankings) — os dois únicos tipos que a pesquisa de benchmarking confirmou como padrão em todos os 5 produtos analisados. Sem donut, sem mapa, sem funil visual.
7. Checagem final via skill `impeccable` / `w-audit-anti-slop` na Wave 5.

---

## 6. WAVES

Cada wave termina com `NOTES.md` atualizado antes de `/compact`. Critérios são binários (comando exit 0 / query retorna X / arquivo existe).

### Wave 0 — Provisionar acesso GA4/GSC (SA `dimus-seo`) — ✅ **CONCLUÍDA 2026-07-14**

**Objetivo**: existir credencial funcional para ler GA4 (property `543369220`, measurement ID `G-Y7PSFTCZJL`) e a property GSC que cobre blog.dimus.com.br.

**Achado (ultra research 2026-07-14, com fontes):**
- DNS de `dimus.com.br` já tem `google-site-verification=biS0jmcrqohqO2xywFnkPiiE6455UqjlXvm5BgZJJP8` no domínio raiz — evidência forte de que uma **Domain Property já existe** no GSC para `dimus.com.br` (esse método de verificação — DNS TXT — é específico de Domain properties; URL-prefix properties normalmente usam HTML tag/arquivo/GA/GTM).
- Confirmado oficialmente ([Search Console Help](https://support.google.com/webmasters/answer/10431861?hl=en)): uma Domain Property agrega **todos os subdomínios e protocolos automaticamente** — cobre blog., usa., blueprint., justnotepad. e qualquer subdomínio futuro (ex: meta.) sem nova verificação.
- **Simplificação de escopo**: em vez de repetir o grant por subdomínio (abordagem antiga do script `gsc_ga4_setup.js`, que lista URL-prefix properties uma a uma), basta **1 concessão de acesso na Domain Property** (`sc-domain:dimus.com.br`) — cobre tudo de uma vez, presente e futuro. Ganho real de escopo: Wave 0 deixa de crescer a cada novo subdomínio.
- Trade-off documentado (fonte secundária, não oficial): dados de uma Domain Property vêm agregados — se precisar de relatório isolado por subdomínio no futuro, URL-prefix properties específicas podem coexistir sem conflito (verificação já herdada do domínio verificado).
- **Achado adicional (não estava no escopo original, usuário validou como necessário)**: Google lançou em 07/07/2026 **"Platform Properties"** no Search Console — permite conectar contas de Instagram/TikTok/X/YouTube (verificação via login da própria plataforma, não DNS) e ver cliques/impressões/CTR/posição de como os posts performam na Busca/Discover do Google. Fonte: [Search Central Blog](https://developers.google.com/search/blog/2026/07/search-console-social-video-platforms). Relevante para @guilhermeribeiro.me / @guilhermeribeiro.ai (Instagram) — **adicionar como item da Wave 0**, mas é setup independente da property de domínio (login social próprio, não GSC user-management).

**Entregáveis (todos concluídos):**
- ✅ SA `dimus-seo@dimus-billing-monitor.iam.gserviceaccount.com` criada no projeto GCP `dimus-billing-monitor`.
- ✅ Chave JSON gerada, salva no GSM como `dimus-seo-sa-json`, arquivo local apagado imediatamente após upload.
- ✅ SA adicionada como **Leitor** na conta GA4 "Dimus" (nível conta — herda todas as properties, incluindo `543369220`/Dimus Blog).
- ✅ SA adicionada como **Restrita** na Domain Property GSC `sc-domain:dimus.com.br` (1 grant cobre blog/usa/blueprint/justnotepad/meta e qualquer subdomínio futuro).
- ⏳ **Pendente, não bloqueante**: conectar Platform Properties do Instagram (@guilhermeribeiro.me, @guilhermeribeiro.ai) no Search Console — feature ainda em rollout gradual, avaliar disponibilidade quando formos tratar de analytics social.
- Automação de apoio usada como referência: `_IA-Skills/skillcontentosdimus-seo-agency/tools/researchseo/gsc_ga4_setup.js`.

**Critério de conclusão (binário) — PASSOU:**
- `runReport` GA4 (`properties/543369220:runReport`, métrica `sessions`, 7 dias) → **HTTP 200**, retornou `12` sessions.
- `searchAnalytics.query` GSC (`sc-domain:dimus.com.br`, 2026-07-01 a 2026-07-14) → **HTTP 200**, retornou queries reais (ex: "dimus", 42 impressions, posição média 3.67).
- `sites.list` GSC confirmou `permissionLevel: siteRestrictedUser` pra `sc-domain:dimus.com.br`.

**Gotcha registrado**: o Property ID GA4 usado inicialmente (`542894737`, de memória/documentação anterior) estava **stale** — a property passou por lixeira/restauração em algum momento e o ID numérico mudou para `543369220`, mantendo o mesmo measurement ID `G-Y7PSFTCZJL`. Sempre confirmar o Property ID atual via URL do GA4 (`#/a{account}p{property}/...`) antes de hardcodar em código de produção.

### Wave 1 — Filtro de bot (dados primeiro, zero UI nova) — ✅ **CONCLUÍDA 2026-07-14**

**Resultado validado ao vivo**: sessões 30.192 → **1.891** reais (94% descartado, bate com a estimativa). Views 5.761 → **3.003** reais. Migration `0008_is_bot.sql` aplicada no D1 remoto (6 statements, todos `success:true`). `_middleware.js` agora marca `is_bot` na ingestão (denylist axios/curl/python-requests/etc + UA vazio); `admin.js` filtra `is_bot = 0` em todas as agregações de sessions/page_views + mostra nota de transparência do filtro no dashboard.

**Objetivo**: ingestão bloqueia bot; histórico marcado; queries existentes limpas.
**Entregáveis**: denylist UA em `functions/tracker.js`; migration `migrations/0008_is_bot.sql` (coluna + backfill); `WHERE is_bot = 0` em todas as agregações de `functions/admin.js`.
**Critérios de conclusão (todos binários)**:
1. Migration aplicada no D1 remoto: `wrangler d1 execute blog-tracking --remote --command "SELECT COUNT(*) FROM sessions WHERE is_bot = 1"` retorna ≥ 25.000.
2. `SELECT COUNT(*) FROM sessions WHERE is_bot = 0` retorna entre 1.400 e 2.100 (sanidade vs. estimativa 1.692).
3. `curl -A "axios/1.13.2" <endpoint tracker>` em preview → nenhuma linha nova com `is_bot = 0` gravada (query antes/depois idêntica).
4. `curl` com UA de Chrome real → linha gravada com `is_bot = 0`.
5. Admin em preview exibe totais filtrados (sessions ≈ 1.7k, não 29.8k).

### Wave 2 — Sidebar + reestruturação de navegação

**Objetivo**: admin deixa de ser página única e ganha o shell sidebar (§3.2), com as 7 seções roteadas (Busca como empty state atrás de flag).
**Entregáveis**: shell de layout (sidebar colapsável 240px, KPI strip) em `functions/admin.js` (ou módulos `functions/admin/*.js`); roteamento por seção (`/admin?s=posts` ou hash); dados atuais (já limpos pela Wave 1) redistribuídos nas seções.
**Critérios de conclusão**:
1. As 7 rotas de seção respondem 200 autenticado (script de smoke com session Clerk ou verificação manual documentada por seção).
2. Sidebar colapsa/expande e o estado persiste (localStorage) — verificado em preview.
3. Seção Busca renderiza empty state "aguardando credencial GA4/GSC" quando `GSC_GA4_ENABLED` ausente.
4. Nenhuma métrica exibida difere do valor da query D1 correspondente (spot-check de 3 números documentado em NOTES.md).

### Wave 3 — Dashboard de conteúdo real (M1–M9)

**Objetivo**: todas as métricas D1 do §2.1 implementadas nas seções.
**Entregáveis**: tabela de posts com colunas views/sessions/leads/conversão %; série temporal diária; breakdown de origens; magnets vs. catálogo; seção Sistema com % bot (M9).
**Critérios de conclusão**:
1. Tabela de posts lista os 35 slugs distintos com conversão calculada; soma da coluna leads == `SELECT COUNT(*) FROM leads` (== 2 hoje).
2. Série temporal do intervalo contendo 2026-07-05 mostra o dia no patamar filtrado (≤ 1.100 sessions), com os ≥ 13k bots ausentes do gráfico e contabilizados em M9.
3. Seção Sistema exibe % bot ≥ 90% no acumulado histórico.
4. Todas as 9 métricas M1–M9 visíveis em preview (checklist 9/9 em NOTES.md).

### Wave 4 — Integração GA4/GSC (DEPENDE de Wave 0 desbloqueada)

**Objetivo**: seção Busca viva com M10–M14, servida do D1 pré-agregado.
**Entregáveis**: módulo de auth JWT/`crypto.subtle` + troca de token; Cron Trigger diário populando `ga4_daily` e `gsc_daily` (migration `0009`); token cache em KV; seção Busca lendo do D1; flag `GSC_GA4_ENABLED` ligada.
**Critérios de conclusão**:
1. Cron executado (manual trigger) grava ≥ 1 linha em `ga4_daily` e ≥ 1 em `gsc_daily` no D1 remoto.
2. Seção Busca renderiza clicks/impressions/CTR/posição (posição ponderada por impressions — validado contra o valor da UI do GSC com tolerância de arredondamento).
3. Nenhuma request de página do admin dispara chamada a `googleapis.com` (verificado nos logs do Pages: só o cron chama).
4. Secret da SA ausente do repo: `rg -i "private_key" --glob '!node_modules'` no repo retorna 0 matches.

### Wave 5 — Polish de design (anti-slop)

**Objetivo**: aplicar §5 integralmente; dashboard indistinguível de produto desenhado à mão.
**Entregáveis**: tokens CSS consolidados (cores, tipos, espaçamento 8px) num bloco/arquivo único; refino de todas as seções; auditoria via `impeccable`/`w-audit-anti-slop`.
**Critérios de conclusão**:
1. Auditoria anti-slop passa sem violação das 7 regras do §5 (checklist binário por regra em NOTES.md).
2. `rg "linear-gradient" functions/` sobre o código do admin retorna 0 usos decorativos (exceções justificadas por escrito).
3. Todos os valores numéricos renderizam em JetBrains Mono com `tnum` (inspeção de computed style em 3 amostras).
4. Screenshot desktop + mobile (sidebar colapsada) anexados; aprovação visual humana registrada.

---

## 7. Riscos e Não-Escopo

### Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Wave 0 nunca desbloqueia (grant humano não acontece) | Sem GA4/GSC | Dashboard D1 é completo sozinho; Busca fica em empty state honesto indefinidamente |
| Bots passam a forjar UA de browser | Filtro UA vaza | Registrado: próxima camada é `request.cf.botManagement` + rate limit; fora deste escopo |
| Backfill classificar humano como bot (falso positivo) | Perda de dado real | Denylist conservadora (só padrões literais de tooling); raw preservado, `is_bot` é reversível por UPDATE |
| Quota GA4/GSC estourada | Seção Busca sem dado fresco | Cron 1×/dia + cache KV + backoff; dados GSC já têm defasagem 2–3 dias, staleness é aceitável |
| Refatorar `admin.js` (20.5K) quebrar rotas existentes (newsletter, catálogo) | Regressão | Wave 2 mantém contrato de dados da Wave 1; smoke por seção antes de concluir |
| Volume real minúsculo (2 leads) gerar leitura estatística indevida | Decisão errada | UI exibe N absoluto junto de qualquer %; sem extrapolação |

### Não-Escopo (este SPEC NÃO cobre)

- **Instrumentação client-side nova**: scroll depth, dwell time, honeypot, challenge JS, Turnstile.
- **Atribuição multi-touch / revenue attribution / pipeline influenciado** — exige CRM integrado ao blog; fica para SPEC futuro.
- **Deletar dados históricos do D1** — proibido por design (só marcação `is_bot`).
- **Mudança de plataforma** (Next, SPA, Workers migration) — stack Pages Functions permanece.
- **Rate limiting e TLS fingerprinting** — registrados como camadas futuras, não implementados.
- **Tracking de outras propriedades Dimus** (usa.dimus, blueprint) — só blog.dimus.com.br.
- **Newsletter/GHL/WA webhook** (`newsletter.js`, `wa-webhook.js`) — intocados exceto exibição read-only na seção Sistema.

---

## Aprovação

- [ ] Aprovado por Guilherme — data: ______
- [ ] Wave 0 desbloqueada (grant GA4/GSC feito) — data: ______
