# NOTES.md — Rebuild blog.dimus.com.br/admin (WAVES)

## 001 — Contexto do pedido

Dashboard admin mostrava números "de mentira" (30.192 sessões, 5.761 views —
94% eram scripts/bots). Pedido: reconstruir com dados reais, sidebar, design
system anti-slop (impeccable), GA4+GSC conectados, benchmarking de mercado.
SPEC completo em [SPEC.md](SPEC.md), 6 waves (0-5).

## 002 — Wave 0 concluída (credenciais GA4/GSC)

Service account `dimus-seo@dimus-billing-monitor.iam.gserviceaccount.com`
criada, chave em GSM `dimus-seo-sa-json`. Grants: GA4 property `543369220`
(Viewer) + GSC Domain Property `sc-domain:dimus.com.br` (1 grant cobre todos
os subdomínios). Smoke-test manual (JWT RS256 assinado à mão em Python) contra
`runReport` e `searchAnalytics.query` — ambos HTTP 200. **Gotcha**: property ID
correto é `543369220`, não `542894737` (obsoleto, não usar).

## 003 — Wave 1 concluída (filtro de bot)

Root cause: `functions/_middleware.js` gravava toda request em D1 sem checar
User-Agent. Fix: migration `0008_is_bot.sql` (coluna aditiva, nunca DELETE) +
`isBot()` na ingestão + todas as queries do `admin.js` filtrando `is_bot = 0`.
Deploy via `wrangler pages deploy` (Global API Key, não o token padrão — ver
gotcha abaixo). Validado ao vivo via `agent-browser`: sessões 30.192 → 1.891
reais, views 5.761 → 3.003. Commit `c1c808d`.

**Gotcha de deploy**: `dimus-cloudflare-api-token` falha silenciosamente no
passo `memberships` do wrangler. Usar `CLOUDFLARE_EMAIL=growth@dimus.com.br` +
`CLOUDFLARE_API_KEY=$(gsm-get dimus-cloudflare-global)` (Global API Key) —
funciona direto.

**Gotcha de build**: `astro build` falha por gate de nomenclatura de eventos
em 6 posts pré-existentes (idTag fora do padrão, ver TRACKING-NOTES #001 —
não é meu bug, fora de escopo). Workaround: `wrangler pages deploy` reaproveita
o `dist/` de um build anterior válido — `functions/` é lido fresco da raiz do
repo pelo Cloudflare Pages independente da idade do `dist/`.

## Re-âncora pós-compact

**Última ação**: Wave 0 e Wave 1 implementadas, deployadas e validadas ao vivo
com screenshot real (agent-browser). Notas salvas (TRACKING-NOTES.md +
NOTES.md), prestes a fazer commit de snapshot antes de partir pras waves 2-5.

**Estado atual**: Wave 0 ✅ | Wave 1 ✅ | Wave 2 (sidebar) pendente | Wave 3
(dashboard completo M1-M9) pendente | Wave 4 (GA4/GSC no dashboard, já tem
credenciais prontas da Wave 0) pendente | Wave 5 (polish anti-slop) pendente.

**Próximo passo exato**: Implementar Wave 2 (sidebar 240px colapsável + shell
com 7 seções) em `functions/admin.js` do repo `blog-dimus`, seguido de Wave 3
(métricas reais M1-M9), Wave 4 (GA4/GSC), Wave 5 (design polish) — tudo
conforme `SPEC.md`. Deploy incremental com `wrangler pages deploy` (Global API
Key) e validação via `agent-browser` a cada wave.

**Prompt de retomada pronto**: "Leia o NOTES.md do blog-dimus e retome de onde
paramos — implementar Waves 2 a 5 do SPEC.md."
