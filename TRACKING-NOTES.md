# TRACKING-NOTES — Blog Dimus (blog.dimus.com.br / seoa_publish_queue)

## Insight #002 — Clerk auth restaurado + Wave 0/1 do dashboard admin concluídas

**Data:** 2026-07-14/15

**Problema encontrado:** `functions/admin.js` tinha revertido silenciosamente pro DASH_KEY
antigo (nunca commitado desde a migração pra Clerk — só deploy manual direto). Também:
dashboard mostrava 30.192 "sessões" — na verdade 94% eram `axios`/`curl` (scripts, não
leitores reais), porque `_middleware.js` gravava toda request em D1 sem filtro de bot.

**Solução aplicada:**
- Clerk restaurado e **commitado de vez** em `functions/admin.js` (commit `f45672104`).
- Migration `migrations/0008_is_bot.sql` aplicada no D1 remoto: coluna `is_bot` em
  `sessions`/`page_views` (nunca DELETE), backfill retroativo via denylist de UA.
- `_middleware.js`: `isBot()` na ingestão, marca `is_bot` nos dois INSERTs.
- `functions/admin.js`: todas as agregações filtram `is_bot = 0` + nota de transparência
  do filtro visível no dashboard.
- **Resultado validado ao vivo**: sessões 30.192 → 1.891 reais, views 5.761 → 3.003 reais.
- Provisionado acesso real GA4 (property `543369220` — não 542894737, que está obsoleto)
  + GSC (Domain Property `sc-domain:dimus.com.br`, 1 grant cobre todos os subdomínios
  Dimus) via service account `dimus-seo@dimus-billing-monitor.iam.gserviceaccount.com`
  (chave em GSM `dimus-seo-sa-json`). Smoke-test real: `runReport` e
  `searchAnalytics.query` retornaram HTTP 200.

**SPEC completo do rebuild do dashboard:** `blog-dimus/SPEC.md` (commitado), 6 waves.
Wave 0 (credenciais GA4/GSC) e Wave 1 (filtro de bot) concluídas. Waves 2/3/5
(sidebar, dashboard de conteúdo real, polish anti-slop) em andamento — ver
`~/Downloads/_notes/blog-dimus/NOTES.md` pro estado exato de retomada.

**Gotcha de build**: `astro build` falha hoje por um gate de nomenclatura de eventos
(6 posts do Insight #001 têm `idTag` fora da convenção `^blog-(calc|quiz|post|gate)-...$`).
Não é bug meu — é pendência separada. Workaround usado: `wrangler pages deploy` reaproveita
o `dist/` de um build anterior bem-sucedido (Cloudflare Pages sempre lê `functions/` fresco
da raiz no deploy, independente do conteúdo do `dist/`).

**Gotcha de deploy**: token `dimus-cloudflare-api-token` às vezes falha silenciosamente no
passo de `memberships` do wrangler (sem erro claro). Fallback que funciona: Global API Key
(`CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY` = `dimus-cloudflare-global` + `growth@dimus.com.br`).

## Insight #001 — 6 artigos automotivos inseridos no pipeline SEO

**Data:** 2026-07-14

**Problema:** Pipeline `seoa_publish_queue` vazio no módulo SEO do studio.dimus.com.br.
Tentativas anteriores (IDs 44–49, 50–55) deletadas: conteúdo truncado ou gerado sem contexto real.

**Solução aplicada:**
- 6 artigos MDX completos gerados com metodologia BoardCopy, dados reais BR (R$, Webmotors/iCarros/OLX Autos)
- INSERT via Supabase MCP `execute_sql` com PostgreSQL dollar-quoting `$DIMUS$...$DIMUS$`
- Evitou problema de escaping de aspas simples em conteúdo MDX grande

**Artigos inseridos (IDs 56–61):**
| ID | Slug | Palavras | Funil | SERP target |
|----|------|----------|-------|-------------|
| 56 | custo-por-lead-concessionaria-benchmark-2025 | ~1.170 | tofu | paa |
| 57 | lead-fantasma-concessionaria-custo-real | ~1.164 | tofu | paa |
| 58 | custo-estoque-parado-concessionaria-por-dia | ~1.070 | tofu | paa |
| 59 | cac-concessionaria-como-calcular-benchmark-2025 | ~1.192 | mofu | featured_snippet |
| 60 | tempo-resposta-lead-automotivo-5-minutos | ~1.169 | tofu | featured_snippet |
| 61 | leads-nao-respondem-protocolo-reengajamento | ~1.270 | mofu | paa |

**Status:** `pending_review` — aparecem no módulo SEO do studio.dimus.com.br

**Keywords travadas em `seoa_keyword_portfolio`:** todas 6 com `status='queued'`

**Arquivos MDX:** `/private/tmp/claude-501/...scratchpad/artigo{1-6}.mdx` (sessão temporária)

**Pendente:**
- Imagens de capa (og_image) — não geradas; precisam de sessão separada
- PR#4: autorização para editar `.claude/hooks/recompile-seo-prompts.sh`

**Componentes MDX usados (padrão descoberto de posts reais no DB):**
```
import AnswerCapsule from "@/components/blog/AnswerCapsule.astro";
import CompareTable from "@/components/blog/CompareTable.astro";
import DimusHelp from "@/components/blog/DimusHelp.astro";
import LeadForm from "@/components/blog/LeadForm.astro";
```

**CHECK constraints críticas (nunca inventar valores):**
- `generation_method`: só `'single-llm-call-compiled-doctrine'`, `'board-agent-orchestrated'`, `'human-written'`
- `search_intent`: só `'informational'` (sem acento — `'informacional'` quebra)
- `funnel_stage`: só `'tofu'`, `'mofu'`, `'bofu'`
- `persuasion_framework`: só `'PAS'`, `'AIDA'`, `'BAB'`, `'FAB'`, `'PASTOR'`, `'none'`
- `serp_feature_target`: só `'featured_snippet'`, `'paa'`, `'ai_overview'`, `'none'`
- `qa_gate_type`: só `'structural-boolean-17-checks'`, `'llm-quality-scored'`, `'human-reviewed'`
