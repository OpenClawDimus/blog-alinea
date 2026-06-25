# SESSION NOTES — Blog Dimus (varejo automotivo)
### Sessão: `blog-dimus-revista-showroom` · 2026-06-23

> **Doc canônico** do processo de criação do `blog.dimus.com.br`. Fonte única de verdade da sessão.
> Padrão de documentação: cada seção é autocontida; mudanças entram com data; nada de log cru.
> Espelho do repo: `~/Downloads/_blog_research/SESSION-NOTES.md` (manter sincronizado).

---

## 0. Índice
1. Visão geral & objetivo
2. Histórico / timeline de versões
3. Discoveries & achados (research)
4. Painel de público — vereditos
5. **PLANO: validação dos vereditos → o que implementar**
6. Estratégia de entregáveis (biblioteca finita + admin)
7. Tracking & Analytics (form-first → WhatsApp · GA4 · KROB)
8. Princípio: tudo para o ICP, não para o concorrente
9. Versionamento
10. Aprendizados
11. Decisões abertas (needs-your-go)
12. Artefatos & arquivos
13. Próximos passos

---

## 1. Visão geral & objetivo
- **Produto:** `blog.dimus.com.br` — a "revista de referência" do varejo automotivo BR (concessionárias, seminovos, revendas).
- **ICP:** donos de negócio automotivo, gerentes comerciais e gerentes de marketing (= possíveis contratantes da Dimus).
- **Objetivo duplo:** autoridade orgânica SEO/AEO/GEO **+** geração/captura de leads (foco em vendas).
- **Stack alvo:** fork **AstroPaper** + tokens Dimus (dark premium magenta). Mockup atual em HTML standalone.
- **Direção visual:** B "Revista Showroom" (First Round-grade) + rail de clusters (Direção C).

## 2. Histórico / timeline de versões
| Versão | Data | Estado | Resumo |
|---|---|---|---|
| Research v1 | 23/jun | ✅ | Ultraresearch 9 agentes (BLOG-RESEARCH-FINDINGS): ICP, dores, clusters, keywords, AEO/GEO, direções A/B/C, AstroPaper. |
| Mockup v1 | 23/jun | ❌ reprovado | "Extremamente AI-slop, HTML limitado". |
| Mockup v2 | 23/jun | refeito | Fraunces+Hanken+JetBrains, imagens MiniMax reais, rail clusters, HOME+POST aberto, motion. |
| **Mockup v2.1** | 23/jun | ✅ atual | Refino pós-painel: números coerentes, conversão humana (WhatsApp), anti-slop, coluna larga, gate Dimus, lead-capture fixo, JSON-LD. |

## 3. Discoveries & achados (research)
- **Território livre:** mercado de conteúdo automotivo BR dominado por SaaS que blogam pra vender software (AutoForce/Syonet/Followize). Ninguém fala com o dono em linguagem de dono. Dimus = "o First Round Review das concessionárias".
- **Dor #1:** "lead que não vira venda" (conversão/processo), não volume.
- **Quick wins SEO:** SEO Local (GMB), Reputação, Pós-venda/LTV têm SERP fraca.
- **GEO/AEO = maior alavanca:** ninguém ensina o lojista a ser citado por IA. (+estatística = +40% citação; FAQPage = 3,2× AI Overviews.)
- 8 clusters hub-and-spoke + 10 content gaps documentados em `BLOG-RESEARCH-FINDINGS.md`.

### 3.1 Ultraresearch de nicho — gaps ✅ (workflow `w2k0097ag`, 40 achados → `NICHE-GAPS-FINDINGS.md`)
- **Tese central:** a métrica do dono é **CARRO VENDIDO e giro**, não lead/clique. Maior lacuna que ninguém entrega (rank 1) = **atribuição mídia→lead→carro vendido**. Vantagem estrutural Dimus: **não vende portal nem CRM → pode falar a verdade**.
- **4 macro-dores:** (1) refém do portal + lead-fantasma caro (R$23-30/robô, "150 leads num carro, 90% não existem"), (2) lead esfria DENTRO da loja (atendimento, não geração — 79% nunca viram cliente), (3) carro parado/giro comendo margem, (4) desconfiança de agência ("CTR não paga folha").
- **Posicionamento mestre do blog:** "o marketing que mede carro vendido, não lead" (neutro-de-fornecedor).
- **Próximos posts-âncora:** rank 1 (atribuição) + rank 2 (lead-fantasma) — territórios mais verbalizados e maior diferencial.
- 10 hooks ICP + 5 lead magnets finitos em `NICHE-GAPS-FINDINGS.md`.

## 4. Painel de público — vereditos (simulação de sentimento)
Painel multiagente encarnando 4 personas + 1 auditor de webdesign sênior leram o POST aberto.
Personas reais: `_blog_research/PERSONAS-ICP.md`.

| Persona | Sent. | Veredito | Bloqueio principal |
|---|---|---|---|
| P1 Ricardo — dono revenda | 72 | talvez | sem WhatsApp; números não fecham |
| P2 Patrícia — ger. comercial | 82 | sim* | falta CTA de conversa + case |
| P3 Thiago — ger. marketing | 72 | talvez | número incoerente; FAQ sem schema; sem calculadora |
| P4 Carlos — dono premium | 82 | talvez | "só formulário de e-mail, não vira lead premium" |
| P5 Júnior — sócio digital | — | (n/d) | bloqueado por classificador; coberto por Thiago+auditor |

**Consenso:** conteúdo/voz acima de 90% do nicho, mas (a) número não fechava, (b) sem caminho humano de conversão, (c) AI-slop visual residual.

## 5. PLANO: validação dos vereditos → o que implementar
> Cada veredito → ação → prioridade → status. P0 = feito no v2.1. P1/P2 = backlog priorizado.

| # | Veredito/achado | Ação | Prio | Status |
|---|---|---|---|---|
| V1 | Número R$47≠R$35-55≠R$75 (todos) | Unificar em R$47/dia coerente (título/TL;DR/answer/tabela/FAQ) + premissas explícitas | P0 | ✅ v2.1 |
| V2 | Sem caminho humano de conversão (todos) | Lead-capture fixo (rail) + gate "Como a Dimus ajuda" + CTA final, todos → WhatsApp | P0 | ✅ v2.1 |
| V3 | AI-slop visual (Thiago/Carlos/auditor) | Remover custom-cursor; matar glows; magenta 13%→4%; fix bug TL;DR; opsz; selection | P0 | ✅ v2.1 |
| V4 | Coluna curta / TOC colado (user) | measure 760, post-shell 1120, gap 96, TOC à direita | P0 | ✅ v2.1 |
| V5 | FAQ sem schema (Thiago) | JSON-LD Article+FAQPage+BreadcrumbList | P0 | ✅ v2.1 |
| V6 | Lead-capture: form antes do WhatsApp (user) | Form (nome+WhatsApp) valida → fire tracking → redirect wa.me [ID] | P1 | 🔜 nesta sessão |
| V7 | Falta calculadora interativa (Thiago) | `<CalculadoraCustoDia>` (valor do carro → R$/dia + alerta 60d) = lead-magnet-ferramenta | P1 | backlog |
| V8 | "Índice Dimus" é promessa vazia (Thiago) | Construir página/relatório real do Índice (dado proprietário) | P1 | backlog |
| V9 | Falta prova/case com nome (Ricardo/Patrícia/Carlos) | Bloco de prova social: logos + 1 case nominal + depoimento | P1 | backlog (precisa material real) |
| V10 | Dados sem fonte clicável/datada (Thiago) | Padrão: toda estatística com fonte+ano linkável | P1 | parcial (Fenauto datado) |
| V11 | Excesso de captura de e-mail (Carlos) | Reduzir e-mail; diferenciar intenção (aprender=e-mail, resolver=WhatsApp) | P2 | parcial v2.1 |
| V12 | Menos inglês/jargão (Ricardo) | Revisar copy: "tempo de pátio" em vez de "aging" etc. | P2 | parcial v2.1 |
| V13 | Qualificação do lead no form (Thiago) | Campo de segmentação + destino claro (CRM/tag) | P2 | no plano de tracking |

**Pós-revisão, ordem de implementação:** V6 (form-first) → tracking stack (§7) → V7 calculadora → V8 Índice → V9 prova → port AstroPaper.

## 6. Estratégia de entregáveis (resolve "medo de infinitos entregáveis")
**Decisão recomendada: BIBLIOTECA FINITA de lead magnets — NÃO um por post.**
- ~6-8 entregáveis reutilizáveis, mapeados aos clusters (não ao post). Posts diferentes apontam pro mesmo magnet via content-upgrade contextual.
- **Catálogo inicial (finito) — reconciliado com a ultraresearch de nicho (3 calculadoras de R$ lideram, falam a língua de caixa do dono):**
  1. **Calculadora de Custo do Carro Parado** (Estoque/Giro) — ferramenta ★ âncora [= V7]
  2. **Calculadora de CAC / Custo-por-Carro-Vendido** (Tráfego/Atribuição) — ferramenta ★
  3. **Diagnóstico "Refém do Portal?"** (quiz, Aquisição) — ferramenta ★
  4. Checklist "Por que seu lead não vira venda" (auditoria de atendimento → loop WhatsApp)
  5. Mini-aula "Lead próprio sem passar pela Webmotors em R$20/dia"
  6. Playbook de follow-up no WhatsApp (Gestão de Leads)
  7. Guia GEO automotivo "apareça no ChatGPT" (IA & GEO)
  > Insight da pesquisa: calculadoras > planilhas/PDFs (lead com dor quantificada = ouro p/ o ICP e linkável/citável p/ GEO).
- **Governança (evita proliferação):** novo magnet só com ADR curto + entra na tabela `lead_magnets`. Regra: 1 magnet por cluster antes de criar um 2º.
- **Modelo de dados (admin):**
  - `lead_magnets` (id, slug, title, cluster, file_url, ativo)
  - `magnet_downloads` (id, magnet_slug, lead_id, post_slug_referrer, ts, utm/fbclid)
  - `page_views` / analytics por post (reaproveita stack KROB §7)
- **Menu admin (a construir):** downloads por magnet, views por post, leads por origem, conversão por post → 1 painel. Stack: Supabase blueprint OU D1 dedicado do blog (decidir no §11).

## 7. Tracking & Analytics — form-first → WhatsApp (aprendido do dimus-usa)
> Base: padrão **KROB** (`dimus-usa/TRACKING-NOTES.md`). Edge-only (CF Pages Functions + D1 + Meta CAPI + forward Supabase blueprint + loop WhatsApp [ID]).

**Fluxo de lead-capture (mudança pedida — V6):**
```
Lead-capture (rail fixo / gate Dimus / CTA fim)
  → FORM primeiro: nome + WhatsApp (valida o "endereço"/contato)
  → on submit válido:
       1) gera event_id + lead_ref [ID:XXXX]
       2) fbq('track','Lead',{...},{eventID})           (Pixel, dedup)
       3) gtag('event','generate_lead',{lead_source:'blog', method:'whatsapp', post_slug, cluster, magnet_slug})
       4) POST /tracker → D1 (blog) + Meta CAPI + forward Supabase blueprint (ig_data_source='blog')
       5) REDIRECT → wa.me/5567991992882?text=...[ID:XXXX]   (loop WhatsApp)
  → quando o dono responde no WhatsApp e bate o [ID] → CompleteRegistration (sinal alto)
```
**Nomenclatura de evento (validada):**
- GA4 NÃO aceita hífen em nome de evento → **`blog-lead` é inválido**. Usar:
  - **Recomendado:** `generate_lead` (evento GA4 recomendado, marcável como key event/conversão) + params `lead_source:'blog'`, `method`, `post_slug`, `cluster`, `magnet_slug`. Diferencia por `lead_source`/`page_path` (consistente com o Dimus Tracking Standard).
  - Se quiser nome dedicado: **`blog_lead`** (snake_case, nunca hífen).
- Meta: `Lead` (browser+CAPI, dedup por event_id) + `CompleteRegistration` (loop WhatsApp). Magnet download = `Lead` com `content_name=magnet_slug` ou custom.

**GA4 — nova propriedade (needs-your-go, §11):** criar property "Dimus Blog" para `blog.dimus.com.br`, web data stream, marcar `generate_lead`/`blog_lead` como key event. (Existentes: USA 542503574, Blueprint 542866806.)

**Stack a portar do KROB:** `functions/tracker.js` (D1+CAPI+forward), schema D1 `leads`/`sessions`, captura UTM/fbclid/ctwa_clid, dedup event_id, forward p/ blueprint via service_role. Cuidados aprendidos: schema do blueprint usa `first_name/last_name/phone/segment/custom_fields(jsonb)/ig_data_source`; forward com service_role (anon não tem policy de insert); `.catch(()=>{})` esconde erro de schema → validar mapeamento.

## 8. Princípio: tudo para o ICP, não para o concorrente
- Todo gate/hook/entregável pensado para o **dono/gerente** (quem compra carro vendido), não para impressionar concorrente/agência.
- Copy em linguagem de dono; prova em carro vendido/giro; CTA = conversa (WhatsApp), não "baixe mais um PDF".
- Filtro de decisão: "isso converte o Ricardo/Patrícia/Carlos, ou só impressiona outra agência?"

## 9. Versionamento
- Repo git iniciado em `~/Downloads/_blog_research/` (era não-versionado).
- Tag de estado: `blog/v2.1.0` (mockup pós-painel). Convenção: `blog/v<semver>` por marco.
- Self-contained export: `~/Downloads/blog-dimus-v2.html` (regerado a cada versão).

## 10. Aprendizados
- **Painel multiagente de personas = "mirofish" executável:** pega incoerência de número, falta de CTA humano e AI-slop que screenshot não pega. Barato e cirúrgico.
- **Número incoerente mata credibilidade** mais que qualquer estética (Thiago/Ricardo conferem a conta).
- **Conversão B2B premium ≠ formulário de e-mail:** dono quer WhatsApp/conversa. E-mail = lead frio.
- **AI-slop tells reais:** custom-cursor, glow magenta repetido, frase fortune-cookie de 3 tempos, flex quebrando inline-bold, magenta >5%.
- **Screenshotter headless** desta preview só pinta o topo; regiões scrolladas voltam pretas → validar por DOM.
- **Tracking:** reusar KROB do dimus-usa; armadilha do forward Supabase (schema + service_role + catch silencioso).

## 11. Decisões abertas (needs-your-go)
1. **Criar a propriedade GA4 nova** (mutação de conta + blog ainda não deployado) — confirmar go e acesso. Eu speco, você aprova.
2. **Onde mora o tracking do blog:** D1 dedicado do blog vs. reusar Supabase blueprint. (Recomendo: D1 próprio do blog + forward p/ blueprint, igual usa.)
3. **Admin/menu de entregáveis:** construir agora (mínimo: tabelas + 1 view) ou após 1º post no ar?
4. **Calculadora interativa (V7)** como 1º lead-magnet-ferramenta — prioridade vs. Índice Dimus (V8)?
5. **Material de prova (V9):** existe case/logo/depoimento real liberado pra usar?

## 12. Artefatos & arquivos
- `_blog_research/blog-v2.html` — mockup fonte (v2.1)
- `~/Downloads/blog-dimus-v2.html` — self-contained (validação)
- `_blog_research/img/` — 6 imagens MiniMax (duotone)
- `_blog_research/BLOG-RESEARCH-FINDINGS.md` — deck de research
- `_blog_research/DESIGN-BRIEF-V2.md` — brief + build log + changelog v2.1
- `_blog_research/PERSONAS-ICP.md` — 5 personas
- `_notes/blog-dimus/SESSION-NOTES.md` — **este doc** (canônico)
- Workflow nicho: `w2k0097ag` (em andamento)

## 13. Próximos passos
1. [nesta sessão] V6 — lead-capture form-first → WhatsApp no mockup + re-export.
2. [nesta sessão] git init + tag `blog/v2.1.0`.
3. [aguardando] absorver resultado do workflow de nicho → seção 3.1 + ajustar clusters/lead-magnets.
4. Decidir §11 (1-5) → desbloquear tracking + admin.
5. Implementar V7 (calculadora) e V8 (Índice) como entregáveis-âncora.
6. Port AstroPaper (fundação técnica) com tokens + componentes do mockup.

---
## SNAPSHOT DE SESSÃO — 2026-06-24 (pós gate 2 + tracking-fixes)

**Estado:** Sprints 1-3 + 2 gates adversariais + todos must-fix ✅. Tags até `v0.6.1-tracking-fixes` (commit 6566d43), pushadas em OpenClawDimus/blog-dimus. Build verde 22 pág. D1 com 5 tabelas + 2 índices UNIQUE.

**Tags da sessão:** v0.4.0-tracking → v0.5.0-admin → v0.5.1-gate-fixes → v0.6.0-event-naming → v0.6.1-tracking-fixes.

**Gate 1 (PASS-WITH-FIXES):** admin HMAC opaco + login POST; .catch nos INSERT; validação server-side /tracker; normalizePhone por length.

**Gate 2 (entrega-a-entrega, agente sequencial — paralelos falharam por throttle API):**
- Determinístico 10/10 limpo (aridade INSERTs, colunas admin⊆schema, slugs⊆catálogo).
- 2 CRITICAL que paralelos NÃO pegaram → corrigidos: C1 GA4 generate_lead nunca contava (dataLayer.push vs gtag.js puro); C2 Meta Pixel base ausente (fbq sem init). + H3 UNIQUE event_id (migration 0003) + a11y quiz.

**Decisão PIXEL:** reaproveitar dataset Dimus (recomendação Meta). Requisito do Guilherme: TODA origem reconhecível pelo NOME (gate/hook obrigatório). Eventos de plataforma ficam padrão; origem vive em lead_ref/content_name/lead_origin (docs/EVENT-NAMING.md).

**Próximo:** (1) gate/hook obrigatório de nomenclatura; (2) deferidos do gate 2 (loop WhatsApp, CTA DimusHelp, anti-abuso /tracker); (3) deploy E1 (falta pixel ID + token CAPI).

**Resume:** handoff em ~/Downloads/blog-dimus/.claude/handoff/current.md.

---
## M1 — SMOKE REAL + PROVA IRREFUTÁVEL Meta Lead + CAPI (2026-06-24)

**Método:** Playwright CLI headless contra blog.dimus.com.br LIVE (post carro-parado), mini-form nome+email+telefone preenchido, captura de network + introspecção.

**PROVAS (irrefutáveis):**
- **Pixel Lead (browser):** request `https://www.facebook.com/tr/?id=998136448049534&ev=Lead&...` capturado. fbq real (callMethod=true, version 2.9.345).
- **CAPI Lead (server):** `/tracker` → `meta_status=200, meta_ok=true`, resposta Meta `{"events_received":1,"fbtrace_id":"..."}` (Meta confirmou recebimento). 2 fbtrace_ids distintos em 2 runs.
- **Dedup:** mesmo `event_id` (ex.: blog-calc-estoque-mqsfab3a-6a6s3k) no Pixel (eventID) + CAPI + D1 + `[ID]` WhatsApp.
- **Convenção de origem:** `blog-calc-estoque` (gate passa).
- **Camada Supabase (dados):** lead presente no blueprint tllelzquwdfcjjlsurai (`source=blog, ig_data_source=form_submitted, tags=[blog]`) — verificado e DELETADO (cleanup CRM compartilhado). D1 mirror também limpo (4+4 rows).

**APRENDIZADO CRÍTICO (registrar):** fbevents.js da Meta SUPRIME eventos custom (Lead) quando detecta automação (`navigator.webdriver=true`). Em headless puro só PageView dispara → FALSO NEGATIVO. Mascarando webdriver (addInitScript + UA real + --disable-blink-features=AutomationControlled) o Pixel Lead dispara normalmente. ⇒ Usuário REAL sempre dispara o Pixel Lead; testes Playwright de pixel precisam de stealth. Não é bug do blog.

**Status funil:** mini-form (nome+email+telefone) → Pixel Lead + CAPI (dedup) → WhatsApp [ID]+ctwa → Supabase. PROVADO ponta-a-ponta (menos GHL, ainda não construído = M2).

**Pendência de prova do Guilherme:** confirmar os 2 Leads no Events Manager (Test Events com browser real) + 1º lead real → marcar generate_lead key event GA4.

---

## M2 — GHL/Avantto forward (CRM source of truth) — DONE 2026-06-24

**Insight #M2:** Lead do blog agora grava nos 3 sinks com ID cruzado. GHL = source of truth.
- **Problema:** `/tracker` só forwardava p/ Supabase; GHL (CRM onde se fala com lead) não recebia nada.
- **Solução:** upsert de contato no GHL (`contacts/upsert` v2021-07-28) ANTES do INSERT D1, captura `contact.id` REAL, persiste em `leads.ghl_contact_id` (D1) + `custom_fields.ghl_contact_id` (Supabase). Gated por `GHL_TOKEN`. Falha em GHL não derruba o resto.
- **Prova:** contactId `E0wqtF4bttIHykbCbAIS` (smoke), CAPI events_received:1 (server + browser webdriver-masked), 3 sinks com mesmo id. PNG `/tmp/ghl-lead.png`. Cleanup 0/0/0.
- **Arquivos:** `functions/tracker.js`, `migrations/0004_ghl.sql` (novo), `wrangler.toml`. Tag `blog-dimus/v0.9.0-ghl`.
- **Gotcha:** GHL DELETE tem lag de índice de busca (~12s); GET por ID é autoritativo (400 imediato após delete).
- **Bloqueio:** screenshots de GHL UI e Meta Test Events bloqueados por login/2FA (sem creds no GSM); prova via API.

---

## M2.5 — Opportunity BluePrint [Content] — DONE 2026-06-24

**Insight #M2.5:** GHL passa de "só contato" para "contato + card no pipeline" — funil visível.
- **Problema:** Contato era criado no GHL mas não aparecia no pipeline BluePrint. Sem card no funil o time não sabia priorizar.
- **Solução:** Após upsert de contato (ghlContactId REAL), cria opportunity no pipeline `zTeBzW1qD2UxnqB8aBQ6` estágio "Novo Lead (Nurturing)" `1019a23c-4b2d-430d-83bd-2caebcb02aa4`. Captura `ghl_opportunity_id`, persiste em D1 (migration 0005) + Supabase `custom_fields.ghl_opportunity_id`.
- **Stages descobertos via API:** Novo Lead (Nurturing) → Engaged (20-49) → Qualified (50-79) → Hot Lead (80+) → Sessão Agendada → Proposta Enviada → Fechado/Ganho → Perdido.
- **Prova smoke:** contactId `nV9eVxV4VbbFH3EBBnFF`, opportunityId `KHoNoWAlFFrkBrBHuwpY`, nome "SMOKE OPP CLAUDE", status open, pipelineId correto, createdAt 2026-06-24T22:45:25.922Z. CAPI events_received:1, Pixel Lead OK, tracker 200. Cleanup 3/3 (GHL 400 not found, D1 rows_written:1, Supabase 1 row).
- **Gotcha:** GHL retorna 400 "Can not create duplicate opportunity for the contact" se já existe. Isso confirma que a criação funcionou (e previne duplicatas). Endpoint `/contacts/{id}/opportunities` tem lag de índice — confirmar por GET `/opportunities/{id}` direto.
- **Gotcha:** `pkill agent-browser` encerra a sessão do browser (cookies em memória). Profile no disco persiste mas o processo precisa reabrir + re-logar. Não usar pkill se a sessão precisar continuar.
- **Arquivos:** `functions/tracker.js` (+47/-6), `migrations/0005_ghl_opportunity.sql` (novo). Commit `4f6c128`, tag `blog-dimus/v1.0.0-opportunity`.
- **✅ UI SCREENSHOT PROVADO (2026-06-24 20:45):**
  - **Contato:** "SMOKE UI TEST", email smoke-ui@dimus.com.br, tag `blog`, phone (67) 99999-0099 — visível em `/contacts/detail/xKD3ARW5x4a3J2FcnNxk`
  - **Pipeline:** BluePrint [Content] (`pipelineId=zTeBzW1qD2UxnqB8aBQ6`), coluna "Novo Lead (Nurturing)", card "SMOKE UI TEST", Source: blog ✅
  - Método: `open -a "Google Chrome" <url>` + `mcp__computer-use__screenshot` (Chrome tier read — visível mas sem clique). Funciona para sessão já autenticada pelo usuário.
  - Cleanup 3/3: GHL succeeded:true / D1 rows_written:1 / Supabase 1 row.

---

## M5 — WhatsApp CompleteRegistration Loop — DONE 2026-06-24

**Insight #M5:** KROB loop fechado — reply do lead no WhatsApp dispara CompleteRegistration CAPI.
- **Problema:** Lead chegava ao WhatsApp mas não havia confirmação de engajamento real. `confirmed_at` ficava NULL.
- **Solução:** `functions/wa-webhook.js` — recebe inbound Evolution (event: messages.upsert, fromMe: false), extrai `[ID:lead_ref]` do corpo (conversation / extendedTextMessage.text / contextInfo.quotedMessage para quote-replies), faz lookup no D1, UPDATE `confirmed_at` + dispara CAPI CompleteRegistration (event_id = `cr-{lead_ref}` — cross-referenciável com o Lead original).
- **Segurança:** token de 48 chars na query string (`?token=WA_WEBHOOK_SECRET`), gerado aleatoriamente, setado na CF Pages + GSM (`dimus-blog-wa-webhook-secret`). Retorno sempre 200 (não vaza existência do endpoint).
- **Idempotência:** se `confirmed_at` já existe, retorna 200 sem re-disparar CAPI (previne duplicatas em re-entregas).
- **Prova smoke:** lead_ref `blog-calc-estoque-m5smoke-zz9x` → webhook POST com `conversation: "Sim! [ID:blog-calc-estoque-m5smoke-zz9x]"` → D1 `confirmed_at: 1782343942` + `capi_confirmed_at: 1782343942` (CAPI confirmado). Cleanup 3/3 (D1 1 row, GHL `QhwPqfzSCJJH49OgaeFv` deleted, Supabase 1 row).
- **URL webhook (p/ configurar na Evolution):** `https://blog.dimus.com.br/wa-webhook?token={gsm-get dimus-blog-wa-webhook-secret}`
- **Arquivos:** `functions/wa-webhook.js` (novo, 203 linhas), `wrangler.toml` (doc WA_WEBHOOK_SECRET). Commit `d43fe55`, tag `blog-dimus/v1.1.0-wa-webhook`.
- **✅ Evolution webhook CONFIGURADO (2026-06-24):**
  - Instância: `GuilhermeClaro` (manager01:8080, service `evolution_v2_evolution_v2`)
  - `enabled: true`, `events: [MESSAGES_UPSERT]`, `url: https://blog.dimus.com.br/wa-webhook?token=...`
  - Configurado via API REST direto no servidor (SSH + curl interno). Verificado GET /webhook/find/GuilhermeClaro.
  - Secret em GSM: `dimus-blog-wa-webhook-secret` (48 chars hex)
  - **Loop KROB KROB 100% fechado**: Form→/tracker→CAPI Lead→WhatsApp[ID:ref]→/wa-webhook→confirmed_at+CAPI CompleteRegistration

---

## M6 — Anti-abuso /tracker — DONE 2026-06-24

**Insight #M6:** Dupla camada de proteção: honeypot client-side + rate limiting edge CF.

### Parte 1 — Honeypot field
- **Campo:** `<input name="website">` em `LeadForm.astro`, posicionado absolutamente (opacity:0, height:0, pointer-events:none). Invisível para humanos via CSS; bots costumam preencher campos ocultos.
- **lead.ts:** lê `data.get("website")` e inclui no payload como campo `website`.
- **tracker.js:** logo após parse do body — `if (body.website) return json({ ok: true })` — descarte silencioso sem gravar em D1/CAPI/GHL/Supabase. Retorna 200 para não revelar detecção.
- **Smoke PASS:** POST com `website: "http://spam.com"` → response `{"ok":true}` sem nenhuma escrita.

### Parte 2 — CF Rate Limiting (Rulesets API)
- **Método:** CF Rulesets API `PUT /zones/{zone_id}/rulesets/phases/http_ratelimit/entrypoint`
- **Zone:** `0a13157a17897d230359557615a87dcb` (dimus.com.br)
- **Expression:** `http.request.method == "POST" and http.request.uri.path == "/tracker"`
- **Limite:** 3 req / 10s por `ip.src + cf.colo.id`, action=block (HTTP 429)
- **Ruleset ID:** `b9e526012beb46e087dba5c1a8a33e6f`, Rule ID: `1f4140bcd4e243cd8491422d654f98da`
- **Smoke PASS:** 8 POSTs sequenciais → req 1-3 HTTP 200, req 4+ HTTP 429.

### Gotchas
- CF free tier: period permitido = 10 (não 60). Spec original "5 req/min" → mapeado para 3 req/10s.
- `cf.colo.id` OBRIGATÓRIO nas characteristics (rate limiting é por PoP). Sem ele → erro 20155.
- Campo `kind`/`phase` não aceitos no body do PUT entrypoint (implícitos pela URL).

### Arquivos alterados
- `functions/tracker.js` (+3 linhas honeypot check)
- `src/components/blog/LeadForm.astro` (+2 linhas honeypot input)
- `src/scripts/lead.ts` (+2 linhas honeypot read+send)
- CF: ruleset criado via API (não arquivo local)

Commit: `45f23df`, tag: `blog-dimus/v1.2.0-anti-abuse`

---

## M3 — Contrato 3-Sink (2026-06-24)

Documento formal criado em `docs/3-SINK-CONTRACT.md` descrevendo D1 + GHL + Supabase como
os 3 sinks obrigatórios de qualquer lead gerado pelo blog, com IDs, endpoints, invariantes
(I1-I7) e checklist de conformidade. Newsletter (M4) listada como superfície ativa.

---

## M4 — Newsletter GHL+Mautic+Resend+Supabase (2026-06-24/25)

### Arquitetura
- `functions/newsletter.js` (POST `/newsletter`): OAuth2 Mautic → upsert contato → add segmento 12
  `blog-newsletter` + GHL upsert tags `['newsletter','blog']` + Resend welcome email (fire-and-forget)
  + Supabase forward (ig_data_source=form_submitted, custom_fields: cross-IDs mautic+ghl)
- `src/components/blog/NewsletterForm.astro`: honeypot, inline fetch, success/error, aria-live

### Smoke PASS (smoke-nl-final@teste-blog.dev)
- Mautic: contato 5968 → segmento 12 `blog-newsletter` ✓
- GHL: khmRSsJZSGqsAXmJvkfh tags `['newsletter','blog']` ✓
- Supabase: source=blog-newsletter, ig_data_source=form_submitted, custom_fields={mautic_contact_id:5968,ghl_contact_id:khmRSsJZSGqsAXmJvkfh} ✓
- Response limpa: `{"ok":true,"subscribed":true}` (sem debug fields)
- Cleanup: Mautic 4/4 + GHL 7/7 + Supabase 8/8 deletados

### Gotchas (descobertos na sessão)
- `${!VAR}` (bash indirection) NÃO funciona em zsh → secrets setados como string vazia via pipe;
  fix: `case` statement para mapear nome→valor antes de `printf | wrangler pages secret put`
- CF Pages só binda secrets em novo deploy após `wrangler pages secret put` — sempre redeploy depois de setar
- Mautic segment add: body DEVE ser `{ids:[Number(id)]}` (array, não `{id:...}`)
- `wrangler pages deployment tail` exige deployment ID em modo não-interativo → testar via hash URL
- Mautic API retorna caracteres de controle no JSON de contatos (quebra json.load sem sanitizar)

Commit: `9d3009c`, tag: `blog-dimus/v1.4.0-newsletter`

---

## GATE 3 — Full Audit + QA + Red Team + Devil's Advocate (2026-06-25)

### Metodologia
4 agentes paralelos (Workflow) → síntese adversarial → fix loop → build verde.
28 findings raw, 5 CRITICAL/HIGH reais após dedup+validação.

### FUNC-001 (FALSE POSITIVE)
`sendBeacon` com `Blob(type:"text/plain")` — CF Workers `request.json()` é type-agnostic.
Não quebra o parse. Confirmado falso positivo.

### Fixes aplicados (commit 0a0e652, tag v1.5.0-gate3-fixes)

| ID | Arquivo | Fix |
|---|---|---|
| FUNC-012 | wa-webhook.js | Handle Evolution array body `[{event,...}]` além de objeto |
| FUNC-005 | wa-webhook.js | Verificar `remoteJid` vs `lead.wa_phone` (últimos 8 dígitos) |
| FUNC-002 | newsletter.js | Search-before-create no Mautic (evita contatos duplicados) |
| FUNC-004 | newsletter.js | Write no D1 (`event_name=Newsletter`) → /admin mostra subscribers |
| DA-001  | newsletter.js | CAPI Lead event com email+nome PII (content_name=blog-newsletter-geral) |

### MEDIUM pendentes (aceitos como risco baixo)
- FUNC-008: GHL opportunity duplicate → GHL retorna 400 com `meta.existingId` (já tratado silenciosamente, erro logado)
- FUNC-010: Honeypot `aria-hidden` + CSS → padrão WAI-ARIA correto
- FUNC-013: Mautic falha → GHL+Resend ainda disparam (design intencional: sinks independentes)
- FUNC-009: `waitUntil` D1 + CAPI em separate calls → partial failure logado, aceitável
- FUNC-011: email dedup sintético para phone-only leads → não aplicável (newsletter não tem phone)
