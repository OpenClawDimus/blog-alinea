# NOTES — Sessão 2026-07-12: Pipeline SEO live + Sprint 4 Spec

## Goal
Ativar pipeline SEO completo para `blog.dimus.com.br` gerando tráfego orgânico Google/Bing, e criar spec do Sprint 4 (analytics intelligence).

## Decisões tomadas

1. **PUBLISH_BRANCH = main** (não `auto-publish`) — worker já deployado publica direto em main → CI/CD dispara imediatamente
2. **triggers paralelos causam race condition** — ids 30/31 falharam com 409/422. Nunca chamar /trigger mais de 1x simultâneo. Cron é safe (1 instância).
3. **gsc-keyword-feeder usa SUPABASE_URL/KEY** para seed, mas NÃO escreve em D1 — isso é Sprint 4 W2
4. **DataForSEO SERP Standard** (não Labs) para rank tracking — Labs tem refresh semanal, sem controle de cadência
5. **Attribution: Linear operacional + First-touch secundário** — SQL puro, sem ML, cobre B2B 6–8 touchpoints

## Avanços desta sessão

### SEO Pipeline
- **19 artigos publicados** em blog.dimus.com.br (confirmado via GitHub commits)
- **24 restantes** em `approved_live` → cron publica 3 a cada 30min, ~4h para zerar
- **45 keywords** no `seoa_keyword_portfolio` (43 `not_started`)
- **Cron generateContent**: Mon/Wed/Fri 9am — gera 1 artigo novo por disparo via zai→minimax→anthropic chain
- **Bing WMT verificado**: meta tag `msvalidate.01` em Layout.astro commit `38923fa`
- **GSC sitemap**: `sc-domain:dimus.com.br` submetido

### Queue state (2026-07-12 ~3am BRT)
```
approved_live: 24  (serão publicados pelo cron)
published:     11  (já live no repo)
failed:         6  (4 antigos + ids 30/31 resetados p/ approved_live)
```

### Sprint 4 Spec
- `SPRINT-4-SPEC.md` criado em `~/Downloads/blog-dimus/`
- Synced para `~/Downloads/_notes/blog-dimus/`
- `SDD-SPRINT-PLAN.md` atualizado com seção Sprint 4
- Ultra research realizado: 15 fontes verificadas, embasamento sólido

## Arquivos afetados (esta sessão)

| Arquivo | O que mudou |
|---|---|
| `blog-dimus/src/layouts/Layout.astro` | Bing WMT meta tag adicionada (commit `38923fa`) |
| `blog-dimus/SPRINT-4-SPEC.md` | NOVO — spec completa Sprint 4 (6 waves) |
| `blog-dimus/SDD-SPRINT-PLAN.md` | Sprint 4 entry + status deploy ✅ |
| `_notes/blog-dimus/SPRINT-4-SPEC.md` | sync |
| `_notes/blog-dimus/SDD-SPRINT-PLAN.md` | sync |
| Supabase `seoa_publish_queue` | 30 itens → approved_live; ids 4/5 → failed; ids 30/31 reset |
| Supabase `seoa_keyword_portfolio` | 45 keywords inseridos (DataForSEO + fanout) |

## Aprendizados / Gotchas

1. **Worker cron viu 0 itens às 11pm**: cron disparou ANTES de setarmos os itens como approved_live. Não foi bug — foi timing.
2. **`gh api /repos/...` com `?` e `&`**: zsh trata como glob/special chars. Usar `-F per_page=N` flag ou aspas duplas em toda a URL.
3. **D1 `approved_at` não existe**: tabela usa `updated_at` não `approved_at`. Erro SQL silencioso.
4. **`execute_sql` multi-statement retorna só o último resultado**: usar queries separadas.
5. **GSC data lag 2–3 dias**: janela ideal `today-4` até `today-2` no pull diário.
6. **DataForSEO `location_code: 1001767` inválido**: usar `location_name: "Brazil"` em vez de location_code.
7. **Fanout gerou 400 keywords únicas** de 4 seeds — arquivo em `/tmp/p1.json`, `/tmp/p2.json`, `/tmp/p3.json`, `/tmp/p4.json`.

## Estado de débito técnico

| Item | Status | Ação |
|---|---|---|
| ids 4 e 5 (MDX com `<think>` tags) | failed | Regenerar via POST /generate ou manual pick |
| ids 30/31 (race condition) | resetados → approved_live | Cron retenta next run |
| Rate limiting no /analytics (Sprint 4 W6) | não existe ainda | Implementar no Sprint 4 Wave 6 |
| `gsc-keyword-feeder` só seeds Supabase, não D1 | design atual | Sprint 4 W2 |

## Próximos passos (Sprint 4 — ordem WAVES)

```
W1: migration 0008 (5 tabelas) → wrangler d1 execute
W2: extend gsc-keyword-feeder → pull daily query + page → gsc_daily D1
W3: rank-tracker worker → DataForSEO SERP Standard semanal → rank_snapshots
W4: analytics.ts beacon (scroll/CTA) + /analytics CF Function + attribution first-touch
W5: analytics-rollup.js (segunda 8am) + /admin upgrade (action_signal + content gap)
W6: gate adversarial (workflow audit + red team)
```

**Para retomar:** `/pickup` → ler este NOTES + `SPRINT-4-SPEC.md` + verificar `seoa_publish_queue` status.

## Marcos

- ✅ `blog.dimus.com.br` live com CI/CD
- ✅ Bing WMT verificado
- ✅ GSC sitemap submetido
- ✅ Pipeline SEO autônomo rodando (cron gera + publica)
- ✅ 45 keywords seeded no portfolio
- ✅ Sprint 4 spec com ultra research pronta
- ⏳ Sprint 4 implementação pendente
