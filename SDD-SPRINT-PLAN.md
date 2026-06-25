# SDD SPRINT PLAN — blog.dimus.com.br
### Baseline: `blog/v2.1.1` · 2026-06-23 · modo: autônomo, validação por incremento

> Metodologia: SDD (spec→baseline→incremento validado). Cada item tem **critério binário**. Cada sprint termina com **audit (anti-slop + sdd-audit) → fix loop**. Paralelização via /workflows quando independente.
> Princípio-mestre (da ultraresearch): **"marketing que mede carro vendido, não lead"**, tudo para o ICP.

## Épicos & dependências
```
A. Foundation (AstroPaper port)  ── bloqueia C,D,E
B. Lead Magnets & Tools          ── B1 paralelo a A; B2/B3 após A
C. Tracking (CF + KROB + GA4)     ── precisa A + GA4 property
D. Admin & Leads Analytics        ── precisa C (eventos)
E. Deploy real blog.dimus.com.br ── precisa A; tracking ligado em C
```

## Sprints (ordem + paralelização)
### SPRINT 1 — Fundação + 1ª ferramenta  ◀ EM EXECUÇÃO
- **A1** Scaffold Astro 5 + Tailwind (fork AstroPaper) em projeto novo `~/Downloads/blog-dimus/` + git. ✔ build verde.
- **A2** Plugar tokens Dimus + portar componentes do mockup (Layout, Rail clusters, Home, Post, AnswerCapsule, CompareTable, Toc, LeadForm, DimusHelp). ✔ paridade visual com mockup v2.1.
- **A3** Schema por postType (Article/FAQPage/BreadcrumbList) + `llms.txt` + robots (libera GPTBot/PerplexityBot/ClaudeBot/Google-Extended). ✔ JSON-LD válido.
- **B1** **Calculadora de Custo do Carro Parado** (componente) — input valor+dias → R$/dia + perda 60d + form-first→WhatsApp com número no [ID]. ✔ cálculo correto + lead dispara. ⟵ **entregue neste turno no mockup**
- *Paralelo:* A1–A3 (foundation) ∥ B1 (componente standalone).
- **Audit S1:** anti-slop (taste/impeccable) + Lighthouse SEO/A11y ≥95 + sdd-audit → fix.

### SPRINT 2 — Tracking + mais ferramentas
- **C1** GA4: criar propriedade "Dimus Blog" + data stream blog.dimus.com.br → Measurement ID. Evento `generate_lead` (key event). ⟵ **tentando criar neste turno**
- **C2** CF: D1 `blog-tracking` (sessions, leads, magnet_downloads) + `functions/tracker.js` (KROB: D1+Meta CAPI+forward Supabase blueprint `ig_data_source='blog'`). ✔ lead de teste em D1 + CAPI 200.
- **C3** Wire form-first→tracker + gtag `generate_lead` + [ID] WhatsApp loop (CompleteRegistration). ✔ evento no GA4 DebugView.
- **B2** Calculadora de CAC / Custo-por-Carro-Vendido. **B3** Diagnóstico "Refém do Portal?" (quiz).
- *Paralelo:* C2 (edge fn) ∥ B2/B3 (componentes). Audit S2.

### SPRINT 3 — Admin + Deploy
- **D1** Admin: tabelas `lead_magnets`+`magnet_downloads`+`page_views`; view de analytics (downloads/magnet, views/post, leads/origem, conversão/post).
- **D2** Painel admin (rota protegida) lendo os eventos. ✔ números reais.
- **E1** CF Pages project `blog-dimus` + domínio blog.dimus.com.br + deploy wrangler (padrão dimus-usa). ✔ live + tracking firing + Lighthouse verde.
- **E2** 3 posts-âncora no ar (carro parado ✔ + atribuição + lead-fantasma). Audit final + fix.

## Biblioteca FINITA de lead magnets (decisão travada — anti-proliferação)
3 calculadoras ★ + 2 checklists/mini-aula (1 por cluster antes do 2º). Detalhe em SESSION-NOTES §6 + NICHE-GAPS-FINDINGS.

## O que precisa da SUA direção (resto é autônomo)
1. **Repo do blog:** crio GitHub `OpenClawDimus/blog-dimus`? (default: projeto local + git agora, push quando você liberar o remote).
2. **GA4 via browser:** se a sessão Google do agent-browser não estiver logada, preciso de 1 confirmação/login. (Tento agora.)
3. **Forward de lead real → CRM blueprint:** ligar agora (com `ig_data_source='blog'`) ou só após 1º lead real? (NUNCA injeto lead de teste no CRM compartilhado.)
4. **Material de prova (V9):** existe case/logo/depoimento liberado?

## Status incremental (log)
- 2026-06-23 — Sprint 1 iniciado.
- ✅ **B1 Calculadora V7** entregue + validada no mockup (tag `blog/v2.2.0`). R$60k→R$47/dia coerente; badge saudável/atenção/crítico; lead leva número computado pro WhatsApp.
- ✅ **C1 GA4** FEITO 2026-06-23 (via agent-browser, sessão logada): propriedade **Dimus Blog `542894737`** + stream `blog.dimus.com.br` → **Measurement ID `G-Q6KH427C70`** (stream `15138890074`). GMT-03 SP, R$, Enhanced Measurement ON. Key events do objetivo "leads" pré-criados (`close_convert_lead`/`qualify_lead`/`purchase`); `generate_lead` será marcado como key event após 1º disparo (UI não pré-cria por nome). Detalhe: `_blog_research/GA4-CONFIG.md`. ⚠️ `blog-lead` (hífen) inválido → usamos `generate_lead`.
- ✅ **A1 Foundation** (tag `blog-dimus/v0.1.0-foundation`): AstroPaper (Astro 6.4 + Tailwind 4 + MDX + sitemap + RSS + Pagefind + Satori) scaffold em `~/Downloads/blog-dimus/`; rebrand Revista Showroom dark-first (tokens, fontes Fraunces/Hanken/JetBrains via Astro Fonts API); config Blog Dimus/pt-BR/SP/dark-only; GA4 gtag G-Q6KH427C70 no Layout. Build verde. **Fixes:** overrides `vite@7.3.5` (dual-vite Astro6/Tailwind), satori font woff2→non-woff2, i18n pt-BR, `dynamicOgImage:false` (A3 redesign).
- ✅ **A2 Componentes** (tag `blog-dimus/v0.2.0-components`): Fraunces nos títulos; `src/components/blog/` = AnswerCapsule, CompareTable, Calculator (V7), LeadForm (form-first→WhatsApp+GA4 generate_lead+Pixel [ID], `src/scripts/lead.ts`), DimusHelp (gate, 4 variantes). Post âncora MDX `carro-parado-quanto-custa` com tudo. Verificado no browser (R$47/dia coerente, gate magenta, Showroom premium).
- ✅ **A3 AEO/GEO** (tag `blog-dimus/v0.3.0-aeo`): JSON-LD @graph (BlogPosting+publisher Dimus+BreadcrumbList+FAQPage 3Q); schema `faq[]` no frontmatter; `llms.txt` dinâmico; robots libera GPTBot/PerplexityBot/ClaudeBot/Google-Extended/etc.
- ✅ **Audit S1** (tag `blog-dimus/v0.3.1-audit`): removidos leaks AstroPaper/Mingalaba/SatNaing (home hero + about reescritos Dimus); i18n pt-BR.ts (Featured→Em destaque); data-theme=dark baked (zero-flash); footer Dimus. Re-audit: 0 leaks, 0 english, H1=1, JSON-LD/canonical/og/sitemap OK. **Lighthouse runtime fica p/ Sprint 3 (pré-deploy).**
- 🟡 **Sprint 2 — EM EXECUÇÃO (2026-06-23)** — código completo + D1 provisionado + build verde; falta smoke D1 (classifier instável) + commit/tag + deploy(Sprint 3).
  - ✅ **C2 Schema D1**: `migrations/0001_blog_tracking.sql` (greenfield consolidado) = `sessions`(28col) + `leads`(36col, dimensões blog `post_slug/cluster/magnet_slug`) + `magnet_downloads` (biblioteca FINITA, downloads/magnet). **D1 `blog-tracking` criado** na conta Dimus via CF MCP → id `71f19cdf-555b-46f3-9b13-b81eb1238e96`, region ENAM. Migration aplicada remota (3 tabelas + 8 índices verificados em sqlite_master).
  - ✅ **C2 Functions** (clone KROB live-verified do dimus-usa): `functions/_middleware.js` (session capture, first-touch lock-in, sem os HTML-patches InfoFast) + `functions/tracker.js` (Meta CAPI v25 + D1 + forward blueprint). Adaptações blog: **normalizePhone BR** (prefixa DDI 55 em 10-11 díg), **forward respeita CHECK** `ig_data_source='form_submitted'` + `tags:['blog']` + `source:'blog'` (a "tag blog" NÃO vai no enum — bug #4 do usa evitado), CORS `blog.dimus.com.br`+localhost, EMQ external_id array, custom_data{content_name,content_category,content_ids}, grava `magnet_downloads` quando há `magnet_slug`.
  - ✅ **C3 Wire**: `src/scripts/lead.ts` → `navigator.sendBeacon('/tracker', …)` (fallback fetch keepalive); mesmo `ref` em dataLayer generate_lead + fbq eventID + body event_id (dedup tríplice). `LeadForm` ganhou prop `intent` (abertura da msg WhatsApp por contexto). `window.__calc` generalizado p/ `{summary}`.
  - ✅ **B2 CalculatorCAC** (`custo-por-carro-vendido` vs custo-por-lead — a calculadora-tese) + **B3 QuizPortal** ("Refém do Portal?", 6 perguntas → score → veredito). Ambos escrevem `__calc.summary`, embed LeadForm, magnet_slug dedicado.
  - ✅ **Posts-âncora** (adianta E2): `lead-fantasma-quanto-custa.mdx` (cluster atribuição, usa CalculatorCAC) + `refem-do-portal.mdx` (cluster portal, usa QuizPortal). Build = 22 páginas, 3 posts no ar, **astro check 0 errors**.
  - ⏳ **Pendente**: smoke INSERT no D1 (valida 36-col leads vs schema live — classifier MCP instável no momento), commit + tag `blog-dimus/v0.4.0-tracking`, e (Sprint 3) deploy CF Pages + setar secrets (META_*, BLUEPRINT_SUPABASE_KEY) + smoke /tracker live + CAPI 200.
  - 📌 **Gotcha herdado (#17 usa)**: CF Pages só binda secret em NOVO deploy (não runtime). Após `secret put` → rebuild+redeploy.
  - 📌 **Generate_lead key event** no GA4 DebugView: só após 1º disparo real (pós-deploy).

## DECISÕES DO GUILHERME (2026-06-23) — protocolo de resume
1. **GA4 unblock = login no agent-browser:** Guilherme loga no Google na sessão do agent-browser (já aberta em analytics.google.com); na retomada eu dirijo a criação da propriedade "Dimus Blog" + data stream blog.dimus.com.br → pego Measurement ID → plugo gtag + `generate_lead`.
2. **Contexto = /compact antes do AstroPaper.** Resume via SESSION-NOTES + este SDD-SPRINT-PLAN + git tag `blog/v2.2.0`.

### Sessão agent-browser p/ GA4 (persistente — reconectar com ESTES params)
```
export PATH="$HOME/.npm-global/bin:$PATH"
agent-browser --headed --profile "$HOME/.agent-browser/profiles/dimus-ga4" --session dimus snapshot -i
```
Login do Guilherme persiste no profile. Conta GA4 admin: ribeirofguilherme@gmail.com. Criar propriedade "Dimus Blog" + data stream web `blog.dimus.com.br` → Measurement ID `G-XXXXXXX` → marcar `generate_lead` como key event. Se Google bloquear automação ("browser may not be secure"): fallback `--profile Default` (reusa Chrome real) ou `--auto-connect`.

### Ao retomar (/pickup), fazer nesta ordem:
1. Confirmar login GA4 (`agent-browser --session dimus --profile ... snapshot -i`) → criar propriedade + data stream → Measurement ID → plugar no mockup/Astro.
2. Sprint 1 A1-A3: scaffold AstroPaper em `~/Downloads/blog-dimus/` + tokens + portar componentes (incl. Calculadora V7 já pronta no mockup) + schema/llms.txt.
3. Audit S1 (anti-slop + Lighthouse) → fix.
4. Defaults autônomos: repo local + git agora (push GitHub quando liberado); forward CRM blueprint só com lead REAL (nunca teste).

- ✅ **Sprint 3 ADMIN** (tag `blog-dimus/v0.5.0-admin`, commit `ae362ff`, pushado): `functions/admin.js` painel `/admin` protegido por `DASH_KEY` (downloads/magnet via JOIN catálogo finito, conversão/post = leads÷views, leads/origem, leads recentes c/ PII telefone mascarada + noindex + esc() anti-XSS); `_middleware.js` agora grava `page_views` (post_slug derivado de /posts/<slug>/, device, country, só em content-type HTML); migration `0002_admin_catalog.sql` (lead_magnets + page_views + 2 índices) APLICADA no D1 remoto via wrangler global; seed catálogo FINITO 3 magnets (calc-carro-parado/estoque-giro, calc-cac-carro-vendido/atribuicao, quiz-refem-portal/portal) verificado. Build verde 22 páginas.
- 🔁 **Gate adversarial Sprint 2+3** (workflow `wf_93a45f49-f30`): full audit + QA + red team + devil's advocate → verify adversarial por finding → synthesis null-safe. Rodando. (Anterior `wf_ee91c76d` falhou: limite semanal + bug `gate.verdict` em null.)
- 🔜 **E1 Deploy** (pós-gate): CF Pages `blog-dimus` + secrets (META_PIXEL_ID/META_ACCESS_TOKEN/BLUEPRINT_SUPABASE_KEY/DASH_KEY) + domínio + smoke /tracker CAPI 200 + /admin + Lighthouse ≥95.

## GATE ADVERSARIAL Sprint 2+3 — wf_93a45f49-f30 (2026-06-24)
**Veredito: PASS-WITH-FIXES** · 48 findings → 43 confirmadas (verify adversarial) → 5 refutadas.
Base sólida: SQL 100% parametrizado, secrets server-side, PII hasheada no CAPI, XSS coberto por esc(), zero exploit direto.

### Must-fix APLICADOS (tag v0.5.1-gate-fixes, commit 54aab63):
1. [HIGH] admin.js: DASH_KEY saiu do cookie → token HMAC opaco (exp.sig), TTL 12h, validado server-side.
2. [MED] admin.js: login via POST (não ?key= GET) + PRG 303 + logout ?logout=1.
3. [MED] tracker.js + _middleware.js: .catch(console.error) em todo waitUntil de INSERT (leads/magnet/page_views/sessions).
4. [MED] tracker.js: validação server-side (nome>=2, whatsapp 10-13 díg) antes de CAPI/D1/forward.
5. [LOW] tracker.js: normalizePhone prefixa 55 por LENGTH não prefixo (corrige DDD 55/RS).
Verificado: syntax-check 3 functions, token roundtrip (opaco/aceita/rejeita forjado+expirado), build verde 22 pág.

### DEFERIDO p/ deploy-time (E1, infra não-código):
- [MED] CF Rate Limiting ruleset por cf-connecting-ip no /tracker (dashboard/wrangler) — endpoint público gravável.
- Após `pages secret put`: rebuild+redeploy (CF Pages só binda secret em novo deploy) + lead teste c/ META_TEST_EVENT_CODE confirmando no Events Manager.

### NICE-TO-HAVE pós-deploy (não bloqueiam):
BLUEPRINT_SUPABASE_KEY → role INSERT-only least-priv; event_id→crypto.randomUUID; content_name Pixel("blog_lead")vs CAPI("blog") alinhar; UNIQUE(event_id)+ON CONFLICT anti-replay; _krob_sid/_eid HttpOnly; LGPD consent cookies 400d (jurídico); Selic 15%/deprec 0,8% hardcoded → parametrizar+fact-check; FK magnet_slug→catálogo; DRY CSS .calc-*.

## GATE 2 — VALIDAÇÃO ENTREGA-A-ENTREGA (2026-06-24)
Fan-out paralelo (workflows) bateu em throttle transitório da API (não-limite-de-conta) 2×. Pivot: (a) furos DETERMINÍSTICOS validados inline 10/10 limpo (aridade INSERTs, colunas admin⊆schema, slugs⊆catálogo); (b) 4 lentes de julgamento via 1 AGENTE SEQUENCIAL (resiste a throttle de concorrência).

### 2 CRITICAL que os gates paralelos NÃO pegaram (corrigidos — tag v0.6.1-tracking-fixes):
1. [CRITICAL] GA4 generate_lead nunca registrava — lead.ts fazia dataLayer.push({event}) (formato GTM) mas Layout usa gtag.js puro → ignorado. Fix: window.gtag('event','generate_lead',{...}).
2. [CRITICAL] Meta Pixel base ausente — fbq chamado mas nunca init'd → Lead do browser nunca disparava → CAPI sem par dedup. Fix: base pixel no Layout via PUBLIC_META_PIXEL_ID (público) + <Fragment set:html>.
3. [HIGH] sem UNIQUE event_id — migration 0003 (UNIQUE leads.event_id + magnet_downloads.lead_ref) aplicada no D1 + ON CONFLICT DO NOTHING.
4. [a11y] quiz-result role=status aria-live.

### DEFERIDO (novas features / decisões — próximos itens):
- [HIGH] Loop WhatsApp CompleteRegistration: colunas confirmed_at/capi_confirmed_at existem mas ninguém escreve; falta webhook inbound Evolution que casa [ID:ref]. Padrão KROB Dimus mandatório. = próximo sprint.
- [MED] Rastrear CTA do DimusHelp: hoje vai direto pro wa.me com [ID:GATE-slug] ESTÁTICO, sem POST /tracker → CTA de maior alcance do blog é cego (maior buraco de atribuição).
- [MED] Anti-abuso /tracker: rate-limit por IP + honeypot/Turnstile (deploy-time infra). Protege CRM blueprint compartilhado.
- Latentes: FK magnet_slug→catálogo; post_slug do page_views só pega slug flat (posts atuais OK).

### OPORTUNIDADES NÃO MAPEADAS (ranqueadas):
1. Rastrear clique DimusHelp (CTA mais frequente, hoje cego). 2. Anti-abuso /tracker. 3. OG dinâmico por post (CTR share + sinal AEO). 4. Scroll-depth 50/90% como sinal de intenção. 5. Cluster 'atendimento' tem variante no gate mas SEM post (gap editorial). 6. Schema HowTo/Question nas calculadoras (citação GEO).

### VEREDITO: backbone server-side production-grade; browser-tracking estava morto (corrigido). Go-live OK após v0.6.1; loop WhatsApp + rastreio CTA DimusHelp = próximas prioridades.

## DEPLOY E1 LIVE — 2026-06-24
CF Pages blog-dimus, 2 deploys direct-upload. LIVE https://blog-dimus.pages.dev (Functions+D1 OK). 6 secrets via GSM. Pixel 998136448049534 (BM_MotherShip) baked prod + CAPI. Forward CRM blueprint LIGADO. Smoke PASS (home/tracker/admin-HMAC-D1/robots/llms). Custom domain blog.dimus.com.br pending→active (CNAME proxied). Funil: mini-form nome+email+telefone → CAPI → WhatsApp+CTWA (tag v0.8.0). Pendente: confirmar domínio, loop WhatsApp webhook, anti-abuso /tracker, key event GA4.
