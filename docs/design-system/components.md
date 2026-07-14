# Components — blog.dimus.com.br

Catálogo completo de todos os componentes `.sr-*` do Showroom.
Referência primária: `src/styles/showroom.css`.

---

## Índice por Grupo

1. [Layout & Shell](#layout)
2. [Navegação](#navegacao)
3. [Cards](#cards)
4. [Grids](#grids)
5. [Botões & Ações](#botoes)
6. [Labels & Metadados](#labels)
7. [Prose & Artigo](#prose)
8. [Lead Capture](#lead)
9. [Motion](#motion)
10. [Pages Específicas](#pages)

---

## 1. Layout & Shell {#layout}

### `.sr-shell`
**O quê:** Container raiz do layout. Grid de 2 colunas: rail + main.
```css
display: grid;
grid-template-columns: var(--rail-w) 1fr;   /* 288px + resto */
max-width: 1560px;
margin-inline: auto;
```
**Comportamento mobile (≤900px):** colapsa para 1 coluna.

---

### `.sr-rail`
**O quê:** Sidebar esquerda sticky com navegação, brand e mini-newsletter.
```
position: sticky, top: 0, height: 100vh
padding: 30px 26px
border-right: 1px solid var(--hair)
background: linear-gradient(180deg, var(--bg-2), var(--bg))
```
**Comportamento mobile:** `position: static; height: auto; flex-direction: row; border-right: none; border-bottom: 1px solid var(--hair)`

---

### `.sr-main`
**O quê:** Container da área de conteúdo principal (à direita do rail).
```
min-width: 0  /* previne overflow em grids */
```

---

### `.sr-wrap`
**O quê:** Padding container dentro do main para conteúdo editorial.
```
padding: 48px 40px 120px
max-width: 1080px
```
**Mobile:** `padding: 24px 20px 80px`

---

### `.sr-post-shell`
**O quê:** Container de largura máxima para conteúdo de post.
```
max-width: 1280px
margin: 0 auto
padding: 0 40px
```
**Mobile:** `padding: 0 20px`

---

### `.sr-article`
**O quê:** Grid de 2 colunas para prose + TOC dentro do post.
```
display: grid
grid-template-columns: 1fr 180px
gap: 40px
padding: 40px 0 0
align-items: start
```
**Mobile:** `grid-template-columns: 1fr`

---

### `.sr-prose`
**O quê:** Container de texto do artigo. Inclui a classe `.app-prose`.
```
min-width: 0
```
Nota: `app-prose` faz override do `max-width: 65ch` injetado pelo Tailwind prose — obrigatório.

---

### `.sr-rightcol`
**O quê:** Coluna direita sticky do post (contém TOC + lead capture).
```
position: sticky, top: 90px
align-self: start
display: flex, flex-direction: column, gap: 24px
```
**Mobile:** `position: static`

---

## 2. Navegação {#navegacao}

### `.sr-brand`
**O quê:** Link de marca no topo do rail (mark + nome).
```
display: flex, align-items: center, gap: 11px
text-decoration: none, color: var(--ink)
```
**Sub-elementos:**
- `.mark` — quadrado 34px, border-radius 9px, gradient magenta, letra "D" em Fraunces
- `.name` — "dimus" em Fraunces 600 20px, letter-spacing -.02em

---

### `.sr-rail-label`
**O quê:** Label de seção dentro do rail (mono uppercase muted).
```
font-family: var(--font-mono)
font-size: 10.5px, letter-spacing: .18em, uppercase
color: var(--dim)
```

---

### `.sr-clusters`
**O quê:** Lista de links de navegação por cluster/categoria.
```
list-style: none, display: flex, flex-direction: column, gap: 2px
```
**Item `.sr-clusters li a`:**
- padding: 9px 12px, border-radius: 9px
- color: `--ink-2`, font-weight: 500, font-size: 14.5px
- hover/`[data-active]`: background `rgba(255,255,255,.04)`, color `#fff`, padding-left `18px`
- `::before`: barra magenta 3px × 16px que aparece no hover/ativo

**Sub-elemento `.ct`:** contador mono 11px em `--dim` (vira `--magenta` quando ativo).

---

### `.sr-rail-bottom`
**O quê:** Mini-bloco de newsletter no final do rail.
```
margin-top: auto
border: 1px solid var(--hair)
border-radius: 14px
padding: 18px
background: var(--surface)
```
**Contém:** título Fraunces 16px + texto muted 12.5px + form (oculto em mobile).

---

### `.sr-topbar`
**O quê:** Barra de navegação sticky no topo do main.
```
position: sticky, top: 0, z-index: 50
display: flex, justify-content: space-between, gap: 20px
padding: 14px 40px
border-bottom: 1px solid var(--hair)
backdrop-filter: blur(16px)
background: rgba(11,10,13,.78)
```
**Mobile:** `padding: 12px 20px`

---

### `.sr-topnav`
**O quê:** Links horizontais na topbar.
```
display: flex, gap: 26px
font-size: 14px, font-weight: 500, color: var(--ink-2)
```
**Item hover:** underline magenta 1.5px via `::after` (width 0 → 100%, transition .3s ease).

---

### `.sr-back-arrow`
**O quê:** Link de voltar nas páginas de post.
```
display: inline-flex, align-items: center, gap: 6px
font-family: var(--font-mono), font-size: 10.5px, letter-spacing: .08em, uppercase
color: var(--dim)
padding: 14px 40px 0
transition: color .2s var(--ease-s)
```

---

### `.sr-crumb`
**O quê:** Breadcrumb de navegação (mono 11.5px).
```
font-family: var(--font-mono), font-size: 11.5px, color: var(--muted)
display: flex, gap: 8px, align-items: center
```
**Sub-elemento `.sep`:** cor `--dim`.

---

### `.sr-adj-nav`
**O quê:** Navegação entre posts adjacentes (anterior/próximo).
```
display: flex, gap: 16px
margin-top: 56px, padding-top: 32px
border-top: 1px solid var(--hair)
```

---

### `.sr-adj-item`
**O quê:** Card de post adjacente (anterior ou próximo).
```
flex: 1, padding: 18px
border: 1px solid var(--hair), border-radius: 14px
background: var(--surface)
transition: border-color .3s var(--ease), transform .4s var(--ease)
```
**Variante `.next`:** `text-align: right`
**Sub-elementos:** `.lab` (mono uppercase muted) + `.ttl` (Fraunces 600 15.5px)

---

## 3. Cards {#cards}

### `.sr-hero`
**O quê:** Card hero da home page com cover 21:9 + corpo.
```
border-radius: 20px, overflow: hidden
border: 1px solid var(--hair)
box-shadow: var(--shadow-card)
display: grid, grid-template-rows: 1fr auto
```
**Sub-elementos:**
- `.cover` — aspect-ratio 21:9, overflow hidden
- `.cover img` — scale(1.05) → scale(1.1) em hover, saturate(1.03), transition 1.1s
- `.cover::after` — gradient escuro sobre a imagem
- `.body` — padding 30px 38px 34px, background var(--surface)

---

### `.sr-card`
**O quê:** Card de artigo padrão.
```
border: 1px solid rgba(255,255,255,0.11)
border-radius: 16px, overflow: hidden
background: #18141f
box-shadow: var(--shadow-card)
display: block, text-decoration: none, color: var(--ink)
transition: transform .5s var(--ease), box-shadow .45s var(--ease)
```
**Hover:** `transform: translateY(-5px)`, `box-shadow: 0 30px 70px rgba(0,0,0,.6)`

**Sub-elementos:**
- `.thumb` — aspect-ratio 16:10, overflow hidden
- `.thumb img` — scale(1.0) → scale(1.06) em hover, saturate(1.02), transition .8s
- `.thumb::after` — gradient `transparent 42% → rgba(11,10,13,.88)` no bottom
- `.ov` — overlay absoluto bottom-left para título/kicker sobre a imagem

**Variante `.tall`:**
```
display: flex
.thumb → aspect-ratio auto, flex: 1, min-height: 240px
h3 → font-size: 19px (vs 22px padrão)
```

**Sub-elementos de conteúdo:**
- `h3` — Fraunces 600 22px, lh 1.12, letter-spacing -.02em
- `.sr-kicker` — mono 10.5px uppercase --muted
- `.sr-datastrip` — mono 11px --muted (data, tempo de leitura)

---

### `.sr-cutcard`
**O quê:** CutoutCard — variante premium com badge recortado via SVG. Componente exclusivo do blog.
```
background: #18141f
border: 1px solid rgba(255,255,255,0.11)
border-radius: 24px, overflow: hidden
box-shadow: var(--shadow-card)
display: block, text-decoration: none, color: var(--ink)
transition: transform .5s var(--ease), box-shadow .45s var(--ease), border-color .4s
```
**Hover:** `transform: translateY(-5px)`, border-color `rgba(255,255,255,.2)`

**Anatomia completa:**

```
sr-cutcard
├── sr-cutcard__media
│   ├── img (object-fit cover, scale hover, saturate)
│   ├── sr-cutcard__noise (grid diagonal 4%, decorativo)
│   ├── sr-cutcard__overlay (gradient escuro)
│   ├── sr-cutcard__inset (label bottom-left com canto côncavo)
│   │   ├── sr-cc sr-cc--inset-t (SVG canto côncavo acima)
│   │   └── sr-cc sr-cc--inset-r (SVG canto côncavo direita)
│   └── sr-cutcard__pin (badge top-right magenta)
│       ├── sr-cc sr-cc--pin-l (SVG canto côncavo esquerda)
│       └── sr-cc sr-cc--pin-b (SVG canto côncavo abaixo)
└── sr-cutcard__body
    ├── .sr-kicker
    ├── .sr-cutcard__title (Fraunces 600 19px)
    └── sr-cutcard__footer
        ├── .sr-datastrip
        └── .sr-cutcard__cta (pill magenta "Ler →")
```

**Variante `--tall`:** `display: flex` (horizontal).

**CutoutCorner SVGs (`.sr-cc`):**
```
.sr-cc--inset-t  → top: -31px, left: -1px, rotate(90deg)
.sr-cc--inset-r  → right: -31px, bottom: -1px, rotate(90deg)
.sr-cc--pin-l    → top: 0, left: -23px, rotate(-90deg)
.sr-cc--pin-b    → right: 0, bottom: -23px, rotate(-90deg)
```
O SVG tem `currentColor` para herdar a cor do container pai.

---

### `.sr-list-card`
**O quê:** Card horizontal para listas de posts (archive, /posts/).
```
display: grid, grid-template-columns: 220px 1fr
border-radius: 14px, overflow: hidden
border: 1px solid rgba(255,255,255,.07)
background: #18141f
margin-bottom: 14px
transition: border-color .35s, transform .4s var(--ease), box-shadow .4s var(--ease)
```
**Hover:** `border-color rgba(255,255,255,.18)`, `transform: translateX(4px)` (move para a direita, sutil)

**Sub-elementos:**
- `.sr-list-thumb` — min-height 160px, overflow hidden + scale(1.07) em hover + overlay lateral
- `.sr-list-body` — padding 24px 28px, flex column, gap 6px
- `.sr-list-title` — Fraunces 600 19px, letter-spacing -.02em
- `.sr-list-desc` — 14px `--muted`, -webkit-line-clamp 2
- `.sr-list-date` — mono 10.5px uppercase `--dim`

---

### `.sr-tag-card`
**O quê:** Card de categoria/tag na página /tags.
```
border-radius: 16px
border: 1px solid rgba(255,255,255,.08)
min-height: 130px
display: flex, flex-direction: column, justify-content: flex-end
padding: 24px 22px
transition: border-color .3s, transform .4s, box-shadow .4s
```
**Hover:** `transform: translateY(-4px)`, `box-shadow: 0 16px 48px rgba(0,0,0,.55)`

**Sub-elementos:**
- `.sr-tag-name` — Fraunces 600 20px, letter-spacing -.02em, capitalize
- `.sr-tag-count` — mono 10.5px uppercase `rgba(255,255,255,.5)`

---

## 4. Grids {#grids}

### `.sr-grid-asym`
**O quê:** Grid assimétrico 2:1 para seção featured (post principal + sidebar card).
```
display: grid
grid-template-columns: 2fr 1fr
gap: 22px
```
**Mobile:** `grid-template-columns: 1fr`

---

### `.sr-row3`
**O quê:** Grid de 3 colunas para row de cards similares.
```
display: grid
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))
gap: 22px, margin-top: 22px
```
Overrides de card dentro do row3:
- `.thumb` → aspect-ratio 16:11
- `.pad` → padding 16px 18px 20px
- `h3` / `.sr-cutcard__title` → font-size 17px

---

### `.sr-list-grid`
**O quê:** Container de lista de posts (flex column, gap 2px).
```
display: flex, flex-direction: column, gap: 2px
```

---

### `.sr-tag-grid`
**O quê:** Grid de cards de tags.
```
display: grid
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))
gap: 16px
```

---

## 5. Botões & Ações {#botoes}

### `.sr-btn`
**O quê:** Botão CTA primário (magenta, arredondado).
```
display: inline-flex, align-items: center, gap: 8px
background: var(--magenta), color: #fff
font-family: var(--font-display), font-weight: 600, font-size: 14px
padding: 10px 22px, border-radius: 72px, border: 0
box-shadow: 0 8px 22px rgba(178,30,151,.34)
transition: transform .35s var(--ease), box-shadow .35s var(--ease), filter .3s
```
**Hover:** `transform: translateY(-2px)`, `filter: brightness(1.07)`, shadow maior

---

### `.sr-btn-wa`
**O quê:** Variante WhatsApp do botão primário.
```
background: #15803d   /* WCAG AA 5.3:1 vs #fff em 13px */
box-shadow: 0 8px 22px rgba(21,128,61,.35)
```

---

### `.sr-btn-mini`
**O quê:** Botão menor (usado no rail-bottom newsletter).
```
background: var(--magenta), border: 0, color: #fff
font-family: var(--font-display), font-weight: 600, font-size: 13px
padding: 10px 16px, border-radius: 10px
transition: filter .3s, transform .3s var(--ease)
```

---

### `.sr-field`
**O quê:** Container de input de formulário.
```
display: flex
background: var(--bg)
border: 1px solid var(--hair), border-radius: 10px
overflow: hidden
transition: border-color .25s
```
**Focus within:** `border-color: var(--hair-strong)`

**Input interno:**
```
flex: 1, background: none, border: 0, outline: none
color: var(--ink), font-family: var(--font-body), font-size: 13px
padding: 10px 12px
```
**Placeholder:** `color: var(--dim)`

---

## 6. Labels & Metadados {#labels}

### `.sr-eyebrow`
**O quê:** Label mono uppercase com regra horizontal magenta antes de seção.
```
display: inline-flex, align-items: center, gap: 14px
font-family: var(--font-mono), font-size: 11px, letter-spacing: .18em, uppercase
color: var(--magenta)
::before → width: 30px, height: 1px, background: var(--magenta), opacity: .6
```

---

### `.sr-tag`
**O quê:** Pill de categoria/tag clicável.
```
display: inline-flex, align-items: center, gap: 7px
font-family: var(--font-mono), font-size: 11px, letter-spacing: .08em, uppercase
color: var(--muted)
border: 1px solid var(--hair), border-radius: 72px, padding: 5px 12px
transition: border-color .25s, color .25s
```
**Hover:** `border-color: var(--hair-strong)`, `color: var(--magenta)`
**`b` dentro:** `color: var(--magenta)`, font-weight: 500 (para o dot/separador)

---

### `.sr-kicker`
**O quê:** Label mono acima do título em cards.
```
font-family: var(--font-mono), font-size: 10.5px
letter-spacing: .12em, uppercase
color: var(--muted)
```

---

### `.sr-datastrip`
**O quê:** Linha de metadados (data + tempo de leitura).
```
font-family: var(--font-mono), font-size: 11px, color: var(--muted)
margin-top: 10px, display: flex, gap: 8px, align-items: center
```
**`b` dentro:** `color: var(--ink)`, font-weight: 500

---

### `.sr-post-meta`
**O quê:** Barra de metadados do post (autor + data + leitura).
```
display: flex, align-items: center, gap: 14px, flex-wrap: wrap
padding: 26px 0 28px
border-bottom: 1px solid var(--hair)
font-family: var(--font-mono), font-size: 12.5px, color: var(--dim)
```
**Sub-elementos:**
- `.who` — flex, gap 10px, color `--ink-2` (nome do autor)
- `.sec` — color `--muted`

---

### `.sr-avatar`
**O quê:** Avatar circular do autor.
```
width: 34px, height: 34px, border-radius: 50%
background: linear-gradient(135deg, var(--magenta), var(--magenta-deep))
display: grid, place-items: center
font-family: var(--font-display), font-weight: 700, font-size: 13px, color: #fff
```

---

### `.sr-dotsep`
**O quê:** Separador visual (ponto) entre metadados.
```
width: 3px, height: 3px, border-radius: 50%
background: var(--dim)
```

---

### `.sr-cover-credit`
**O quê:** Crédito da imagem de capa (align right, abaixo do cover).
```
display: flex, justify-content: flex-end
padding: 7px 48px 0
max-width: 1280px, margin: 0 auto
```
**`.sr-cover-credit-inner`:** mono 10.5px, letter-spacing .06em, `--muted`, opacity .7

---

### `.sr-section-head`
**O quê:** Header de seção na home (título + link "ver tudo →").
```
display: flex, align-items: flex-end, justify-content: space-between
margin: 88px 0 26px
```
**`h2` dentro:** Fraunces 600 28px, `'opsz' 72`, letter-spacing -.02em
**`a` dentro:** mono 12px `--muted` + arrow com gap animado em hover

---

## 7. Prose & Artigo {#prose}

### `.sr-post-cover`
**O quê:** Cover fullscreen de post com parallax.
```
position: relative, height: 60vh, min-height: 430px, overflow: hidden
```
**`img` dentro:** `width: 100%, height: 120%` (para parallax), object-fit cover, `will-change: transform`
**`::after`:** gradient `rgba(11,10,13,.3) → .5 → var(--bg)` no bottom

---

### `.sr-cover-cap`
**O quê:** Sobreposição de texto (título/kicker) sobre a cover.
```
position: absolute, left: 0, right: 0, bottom: 0, z-index: 3
padding: 0 40px 44px
```
**`.inner`:** max-width 1120px, margin-inline auto
**Mobile:** `padding: 0 20px 30px`

---

### `.sr-post-h1`
Ver [typography.md](./typography.md) — seção H1.

---

### `.sr-dek-lead`
**O quê:** Parágrafo de abertura do artigo (Fraunces italic 23px).
Ver [typography.md](./typography.md) — seção dek-lead.

---

### `.sr-tldr`
**O quê:** Caixa de resumo do artigo (3–5 bullets).
```
border: 1px solid var(--hair), border-radius: 14px
padding: 22px 26px
background: var(--surface)
margin-bottom: 36px
box-shadow: var(--shadow-card)
```
**`h4`:** mono uppercase magenta 11px, letter-spacing .16em
**`li`:** 15.5px `--ink-2`, padding-left 22px, bullet magenta 5px círculo

---

### `.sr-toc`
**O quê:** Tabela de conteúdo (sticky no rightcol).
**`.lab`:** mono uppercase `--dim`
**`ul`:** border-left 1px `--hair`
**`a`:** padding 7px 16px, margin-left -1px, 13px `--muted`, border-left transparente
**`a.active`:** `color: var(--magenta)`, `border-left-color: var(--magenta)`
**`a:hover`:** `color: var(--ink-2)`

---

### `.sr-pull`
**O quê:** Pull quote com borda magenta.
Ver [typography.md](./typography.md) — seção pull quote.

---

### `.sr-callout`
**O quê:** Caixa de destaque/nota dentro do artigo.
```
border: 1px solid var(--hair), border-radius: 13px
padding: 18px 22px, margin: 0 0 24px
background: var(--surface)
display: flex, gap: 14px, align-items: flex-start
```
**`.ic`:** ícone 30px × 30px, border-radius 8px, bg `rgba(225,55,158,.12)`, border `--hair-mag`, color `--magenta`
**`p` dentro:** 15.5px `--ink-2`
**`.src`:** mono 10.5px `--dim` (fonte/atribuição)

---

### `.sr-dimus-help`
**O quê:** Bloco CTA inline de alto impacto (gate de conversão dentro do artigo).
```
margin: 46px 0, border: 1px solid var(--hair-mag)
border-radius: 18px, padding: 30px 32px
background: linear-gradient(180deg, rgba(225,55,158,.06), var(--surface))
box-shadow: var(--shadow-card)
```
**Estrutura:**
- `.b` — mono uppercase magenta (eyebrow)
- `h3` — Fraunces 600 24px, letter-spacing -.02em
- `> p` — 15.5px `--ink-2`, max-width 60ch
- `ul` — grid 1fr 1fr, gap 12px 26px, itens com `→` magenta
- `.sr-cta-row` — flex, gap 12px (botão + `small` mono muted)

---

### `.sr-cu`
**O quê:** Content upgrade inline (captura de lead no meio do artigo).
```
margin: 38px 0, border: 1px solid var(--hair)
border-left: 2px solid var(--magenta)  /* marca editorial */
border-radius: 13px, padding: 24px 26px
background: var(--surface)
```
**Contém:** eyebrow + título Fraunces 600 21px + texto + form (sr-field + sr-btn-mini)

---

## 8. Lead Capture {#lead}

### `.sr-solve`
**O quê:** Card de lead capture no sidebar TOC.
```
border: 1px solid var(--hair-mag)
border-radius: 14px, padding: 20px
background: var(--surface)
box-shadow: var(--shadow-card)
```
**Sub-elementos:** `.b` (mono uppercase magenta) + `h4` (Fraunces 600 18px) + `p` (13px muted) + form

---

### `.sr-news-fold`
**O quê:** Seção de newsletter no final da home.
```
margin-top: 120px, border-top: 1px solid var(--hair)
padding-top: 56px, text-align: center
display: flex, flex-direction: column, align-items: center
```
**Sub-elementos:** sr-eyebrow + h2 display + p + form (sr-field + sr-btn)

---

### `.sr-proof`
**O quê:** Social proof abaixo do form de newsletter.
```
margin-top: 16px
font-family: var(--font-mono), font-size: 11.5px, color: var(--dim)
display: flex, gap: 14px, align-items: center, justify-content: center
```
**`b` dentro:** `color: var(--ink-2)`, font-weight: 500

---

### `.sr-rail-bottom`
**O quê:** Mini-newsletter no fundo do rail.
Ver seção [Navegação](#navegacao).

---

## 9. Motion {#motion}

### `.sr-progress`
**O quê:** Barra de progresso de leitura (topo fixo).
```
position: fixed, top: 0, left: 0
height: 2px, z-index: 9999
width: 0 (JS controla), background: var(--magenta)
transition: none  /* JS atualiza continuamente — não transicionar */
pointer-events: none
```

---

### `.sr-reveal`
**O quê:** Classe de animação de entrada por scroll.
```
opacity: 0, transform: translateY(16px)
transition: opacity .7s var(--ease), transform .7s var(--ease)
```
**`.sr-visible`** (adicionada pelo JS): `opacity: 1`, `transform: translateY(0)`

**OBRIGATÓRIO — override de reduced motion (já implementado):**
```css
@media (prefers-reduced-motion: reduce) {
  .sr-reveal { opacity: 1 !important; transform: none !important; }
}
```

---

### Orb (seletor `body .orb`)
**O quê:** Elemento de luz ambiente magenta (fixo, decorativo).
```
position: fixed, top: -8%, left: 6%
width: 480px, height: 480px, border-radius: 50%
filter: blur(90px), pointer-events: none, z-index: 0
opacity: .28
background: radial-gradient(circle, rgba(225,55,158,.4), transparent 68%)
```
**Regra:** 1 único orb por página. Nunca duplicar.

---

### Grain (seletor `body::after`)
**O quê:** Textura de ruído fractal global.
```
content: '', position: fixed, inset: 0
z-index: 9998, pointer-events: none, opacity: .035
background-image: url("data:image/svg+xml,... feTurbulence fractalNoise ...")
```
**Regra:** opacidade máxima 0.05. Abaixo disso é sutil (correto). Acima, vira ruído visual.

---

## 10. Pages Específicas {#pages}

### `.sr-archive-title`
**O quê:** Título de páginas de archive (/posts, /tags/[tag]).
```
font-family: var(--font-display), font-weight: 500, 'opsz' 72
font-size: clamp(32px, 4vw, 52px), letter-spacing: -.03em, line-height: 1.05
margin: 18px 0 48px, color: var(--ink)
```

---

### `.sr-tags-desc`
**O quê:** Texto de descrição na página /tags.
```
font-size: 15px, color: var(--muted)
margin: -30px 0 48px, max-width: 56ch, line-height: 1.55
```

---

## Regras Gerais de Componentes

### Do
- Use `.sr-*` classes APENAS com os elementos HTML corretos (semântica primeiro)
- Mantenha a anatomia de sub-elementos (`.ov`, `.thumb`, `.body`) — o CSS depende dela
- Para variantes, use modificadores BEM: `.sr-cutcard--tall`, `.sr-card.tall`
- Focus rings em todo elemento interativo (ver [index.md § WCAG](#wcag))

### Don't
- Nunca misture `.sr-card` e `.sr-cutcard` no mesmo container — escolha um padrão por seção
- Nunca adicione `color: var(--dim)` em `p` ou `li` — falha WCAG AA
- Nunca crie novo componente `.sr-*` sem documentar aqui e no [index.md](./index.md)
- Nunca remova o `min-width: 0` do `.sr-prose` — quebra o layout do artigo

### Adicionando Novo Componente

1. Defina o nome no padrão `.sr-[nome]` (kebab-case)
2. Adicione ao final de `showroom.css` com header de comentário
3. Documente neste arquivo com: o quê, CSS, sub-elementos, variantes, regras
4. Adicione ao checklist de qualidade se tiver regras específicas
