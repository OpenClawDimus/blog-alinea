## Active Task
CutoutCard aplicado e commitado. Posicionamento finalizado (PUV + empathy map + hooks).

## Goal
Blog editorial dark premium (Astro+CF Pages) Revista Showroom — score visual ≥85/100, tracking KROB ativo, leads para CRM blueprint. Posicionamento estratégico completo (BoardBrand+BoardCopy).

## Completed Actions (sessão 2026-06-28)

### Posicionamento
- **LLM Council**: análise "carro vendido" vs atribuição — verdict: manter "carro vendido" como missão, mecanismo é atribuição UTM→CRM
- **PUV Hormozi+Brunson**: Hormozi → dream = "saber para onde cortar sem medo"; Brunson → Big Domino: quebrar "leads são métrica"
- **BoardCopy hook vencedor**: "Sua agência manda relatório de lead toda semana. / Relatório de venda por canal — alguém te mandou alguma vez?"
- **Tagline final**: "Marketing automotivo medido em carro vendido — no seu CRM, não no painel deles"
- **Empathy map**: `docs/posicionamento-empathy-map.md` (585 linhas, 10 quadrantes)
- **Pendência registrada**: Task #11 — case study SMAFF (cadeia completa marketing→carro vendido)
- **Task #12**: Fechar PUV final + atualizar posicionamento-blog-v3.md

### CutoutCard Component (commit d48d73d)
- `src/components/blog/CutoutCard.astro` — port puro Astro do React CutoutCard (sem React)
- Técnica: CSS radial-gradient para cantos côncavos (inset label + pin badge)
- Props: href, gradient, tag, title, date, ogImage?, tall?, pinLabel?
- `src/styles/showroom.css` — bloco `.sr-cutcard` completo (hover, tall variant, responsive)
- `src/pages/index.astro` — substituído `.sr-card` simples por CutoutCard em grid-asym e row3
- Build verde: 33 páginas em 3.22s
- DOM verificado: 5 cutcards + 1 hero no DOM com dimensões corretas

## Active State
- Files modified: nenhum (tudo commitado — d48d73d)
- Branch: main (ahead 15 de origin/main — nenhum push feito)
- Deploy pendente: produção em blog.dimus.com.br ainda na versão anterior
- Dev server: rodando em :4321 (PID 15210)

## Blocked
- Build: NUNCA usar npm run build → `node --trace-uncaught node_modules/.bin/astro build`
- Deploy: `gsm-get dimus-cloudflare-global` + `gsm-get dimus-cf-email` + `CLOUDFLARE_ACCOUNT_ID=52018198611f38e0520cb272a62bbfe5`
- Mautic: MAUTIC_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET não setados no CF Pages env

## Key Decisions
- CutoutCard sem React: radial-gradient CSS substitui SVG CutoutCorner do original
- Tagline "não no painel deles": ataque direto à agência (posicionamento de oposição, mais agressivo)
- Blog sr-reveal: opacity:0 por default — elementos precisam de IntersectionObserver para aparecer

## Pending User Asks
- Validar empathy map com llm-council + BoardAdvisory (interrompido por contexto)
- Task #12: fechar PUV + atualizar posicionamento-blog-v3.md

## Remaining Work
- [ ] Push para origin/main (15 commits pendentes)
- [ ] Deploy produção com CutoutCards
- [ ] Validar empathy map com llm-council + BoardAdvisory
- [ ] Fechar Task #12: posicionamento-blog-v3.md com tagline + PUV definitivo
- [ ] Setar MAUTIC_URL/CLIENT_ID/SECRET no CF Pages
- [ ] Editar 4 posts draft (whatsapp, indicacao, preco-abaixo, tempo-resposta)
- [ ] Lighthouse audit blog.dimus.com.br

## Critical Context
- Build: `node --trace-uncaught node_modules/.bin/astro build`
- D1 blog-tracking ID: 71f19cdf-555b-46f3-9b13-b81eb1238e96
- CF Pages: blog-dimus | CLOUDFLARE_ACCOUNT_ID: 52018198611f38e0520cb272a62bbfe5
- sr-reveal: opacity:0 animado — IntersectionObserver re-inicializa em astro:page-load
- CutoutCard cantos côncavos: pseudo-elements ::before/::after com radial-gradient
- 15 commits ahead origin/main — nunca pushado
