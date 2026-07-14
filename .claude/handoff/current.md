# Handoff — blog-dimus (2026-07-14)

## Active Task
Criar Design System ultra-completo do blog em `docs/design-system/` + página `/admin` com DS preview visual.

## Goal
DS canônico para blog.dimus.com.br: tokens validados, gates visuais (imagem, tipografia, OG), regras de espaçamento, componentes (cards, views), acessibilidade — garantindo consistência em qualquer blog futuro criado pela Dimus.

## Completed Actions (sessão anterior — posicionamento)
- LLM Council + MiroFish 10 ICPs → validou posicionamento, tagline "no seu pátio, não no painel deles"
- BoardBrand → `docs/posicionamento-blog-v3.md`
- BoardCopy → `docs/copy-assets.md`
- MiroFish → `docs/mirofish-validation-2026-06-28.md`
- Bing WMT meta tag → commit 38923fa (Sprint 4 SEO)

## Active State
- Files modified: nenhum (tudo commitado — last: 38923fa)
- Branch: main (CI/CD ativo — CF Pages publica automaticamente)
- `docs/design-system/` → não existe ainda (criar)
- `/admin` DS preview → não existe ainda

## Tokens Existentes (para o DS — NÃO reinventar)
```
Paleta dark-first (única, sem light mode):
--bg: #0b0a0d | --surface: #131017 | --surface-2: #181420
--ink: #f4f1f5 | --ink-2: #cbc4d2 | --muted: #9a8fa3 | --dim: #6e6678
--magenta: #e1379e | --magenta-deep: #b21e97 | --pink: #ff53c8
--hair: rgba(255,255,255,0.07) | --shadow-card: [ver theme.css]

Tipografia:
--font-app/body: Hanken Grotesk
--font-display: Fraunces (serif editorial, titulos h1/h2)
--font-mono: JetBrains Mono

Layout:
--rail-w: 288px | --measure: 760px
--ease: cubic-bezier(0.16,1,0.3,1)
```

## Referência Base
Studio DS: `/Users/guilhermeribeiro/Downloads/content-os-studio/docs/DESIGN-SYSTEM-STANDARD.md` (36KB, 9 seções)

## Blocked
Nenhum.

## Key Decisions
- Blog é dark-only (lightAndDarkMode=OFF) — sem dual theme no DS
- Magenta é evento, não ambiente (<5% da tela) — regra de uso no DS
- SEO ativo (Sprint 4) — DS deve incluir SEO rules para H1-H4, OG image specs, image alt
- `/admin` usa DASH_KEY existente (ver functions/admin.js) — manter mesmo gate

## Remaining Work
- [ ] Ler Studio DS + showroom.css completo para audit de tokens existentes
- [ ] Criar `docs/design-system/index.md` — documento mestre ultra-completo
- [ ] Criar `docs/design-system/image-gates.md` — regras de imagem (capa, OG, inline, SEO)
- [ ] Criar `docs/design-system/typography.md` — H1→H6 + body + mono + display rules
- [ ] Criar `docs/design-system/components.md` — CutoutCard, grid-asym, kicker, etc.
- [ ] Criar `src/pages/admin/ds-preview.astro` — página visual do DS (protegida por DASH_KEY)
- [ ] Rodar build verde + commit

## Critical Context
- Build: NUNCA usar npm run build → `node --trace-uncaught node_modules/.bin/astro build`
- D1: 71f19cdf-555b-46f3-9b13-b81eb1238e96 (blog-tracking)
- CF Pages: CLOUDFLARE_ACCOUNT_ID 52018198611f38e0520cb272a62bbfe5 | projeto blog-dimus
- Admin existente: functions/admin.js protegido por DASH_KEY env var
- Sprint 4 SEO em andamento — não quebrar pipeline (cron publica 3 artigos a cada 30min)
- 19 artigos publicados, ~24 na fila seoa_publish_queue com status approved_live
