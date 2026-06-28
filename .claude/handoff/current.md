## Active Task
GATE 7 concluído — UX sprint + 5 posts commitados. Workflow de posicionamento rodando.

## Goal
Blog editorial dark premium (Astro+CF Pages) Revista Showroom — score visual ≥85/100, tracking KROB ativo, leads para CRM blueprint. Posicionamento estratégico completo (BoardBrand+BoardCopy).

## Completed Actions (sessão GATE 7 — 2026-06-27)
- **Fonte**: Fraunces → Playfair Display (--font-fraunces CSS var preservado, zero CSS toucado)
- **About page**: rewrite completo para Showroom DS (era AstroPaper legacy com imports inválidos)
- **Prose width**: .app-prose { max-width:none } — root cause era @apply prose injetando max-width:65ch
- **Back arrow**: .sr-back-arrow em post pages → "← Todos os posts" com transição de cor
- **WA popup**: showWAPopup() em lead.ts — popup intermediário + countdown 3s antes do redirect
- **WA intent**: neutralizado "minha revenda" → "meu negócio" (remove assumption de tipo de negócio)
- **Deploy produção**: wrangler pages deploy --branch main confirmado, produção live
- **Validação**: curl blog.dimus.com.br confirmou sr-about-wrap, sr-back-arrow, Playfair Display hash
- **Newsletter**: pipeline D1→Mautic→Resend→GHL→Supabase→CAPI validado. mautic_contact_id vazio (env vars CF Pages não setadas)
- **Git commits**: 22d8c67 (UX sprint 11 arquivos), c3c1fb2 (5 posts + covers + SEO)
- **Workflow posicionamento**: wf_46c279ee-296 rodando (BoardBrand+BoardCopy, 9 agentes)

## Active State
- Files modified: nenhum (tudo commitado)
- Services: nenhum
- Branch: main (ahead 9 de origin/main)
- Deploy: https://blog.dimus.com.br (CF Pages project: blog-dimus) — PRODUÇÃO ATUAL
- Workflow: wf_46c279ee-296 rodando no background

## Blocked
- Build: NUNCA usar npm run build → node --trace-uncaught node_modules/.bin/astro build
- Deploy: gsm-get dimus-cloudflare-global + gsm-get dimus-cf-email + CLOUDFLARE_ACCOUNT_ID=52018198611f38e0520cb272a62bbfe5
- Mautic: MAUTIC_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET não setados no CF Pages env

## Key Decisions
- Playfair Display: CSS var --font-fraunces mantido → zero CSS toucado; só astro.config.ts
- max-width:none em .app-prose: seguro pois outer containers definem largura
- WA popup: countdown 3s + CTA "Ir agora" + "fechar" — registo conversão antes do redirect
- Back arrow: CSS class .sr-back-arrow no showroom.css (não inline)

## Remaining Work
- [ ] Salvar manual de posicionamento no git do blog quando workflow terminar
- [ ] Setar MAUTIC_URL/CLIENT_ID/SECRET no CF Pages para ativar Mautic pipeline
- [ ] Lighthouse audit no domínio produção blog.dimus.com.br
- [ ] Editar/personalizar os 4 posts draft (whatsapp, indicacao, preco-abaixo, tempo-resposta)
- [ ] Push para origin/main (9 commits pendentes)

## Critical Context
- Build: node --trace-uncaught node_modules/.bin/astro build
- D1 blog-tracking ID: 71f19cdf-555b-46f3-9b13-b81eb1238e96
- CF Pages: blog-dimus | CLOUDFLARE_ACCOUNT_ID: 52018198611f38e0520cb272a62bbfe5
- Git: 9 commits ahead origin/main — não pushado
- GSAP trigger: astro:page-load → re-inicializa em cada navegação ViewTransition
- Newsletter: pipeline completo exceto Mautic (env vars faltando no CF Pages)
- ogImage schema: z.string().or(image()) — strings passam sem pipeline Astro
