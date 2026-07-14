# Design System — blog.dimus.com.br
**Versão:** 1.0.0 · 2026-07-14
**Caminho:** `blog-dimus/docs/design-system/`
**Referência base:** [Studio DS](../../content-os-studio/docs/DESIGN-SYSTEM-STANDARD.md)
**Preview visual:** [/admin/ds](https://blog.dimus.com.br/admin/ds)

---

## Índice

1. [Filosofia e Axiomas](#filosofia)
2. [Tokens de Cor](#tokens-cor)
3. [Tipografia](#tipografia)
4. [Layout e Grid](#layout)
5. [Movimento](#movimento)
6. [Espaçamento](#espacamento)
7. [Raio de Borda](#raio)
8. [Status e Dataviz](#status)
9. [Acessibilidade WCAG 2.1 AA](#wcag)
10. [Gates de Qualidade](#gates)
11. [Checklist de Publicação](#checklist)
12. [Glossário](#glossario)

---

## 1. Filosofia e Axiomas {#filosofia}

### Os 3 Axiomas Invioláveis

**A1 — Dark-only.**
O blog.dimus.com.br é escuro por decisão editorial. `lightAndDarkMode=OFF`. Nenhum componente, nenhuma imagem, nenhuma OG image pode ser criada para fundo claro. O background é `#0b0a0d` e o usuário não controla isso.

**A2 — Magenta é evento, não ambiente.**
`--magenta: #e1379e` é a cor de ação e atenção. Regra dura: **menos de 5% da área visual por viewport** pode ser magenta. Magenta em excesso = ruído. Magenta cirúrgico = sinal.

**A3 — Motion é editorial, não decorativo.**
Toda animação serve ao conteúdo. Scroll reveal existe para criar ritmo de leitura. Parallax na cover existe para criar profundidade. Se remover a animação e o conteúdo não perder nada, remova.

### Divergências do Studio DS

| Dimensão | Studio DS | Blog Dimus |
|---|---|---|
| Tema | Dual (light/dark) | Dark-only permanente |
| Magenta | Acento Dimus genérico | Proprietário, regra dos 5% |
| Tipografia | Hanken Grotesk | Hanken + Fraunces (editorial) |
| Textura | Sem grão | Grão fractal global (3.5% opacity) |
| Orb | Sem | 1 orb magenta fixo top-left |
| Cards | Padrão | CutoutCard com SVG corners (exclusivo) |

---

## 2. Tokens de Cor {#tokens-cor}

**Arquivo:** `src/styles/theme.css`

### Paleta Principal (existentes — não alterar sem PR de infra)

| Token | Valor Hex | WCAG vs --surface | Uso primário |
|---|---|---|---|
| `--bg` | `#0b0a0d` | — | Background de página |
| `--bg-2` | `#0e0c11` | — | Background do rail (gradient) |
| `--surface` | `#131017` | — | Cards, painéis, modais |
| `--surface-2` | `#181420` | — | Superfície elevada |
| `--hair` | `rgba(255,255,255,0.07)` | — | Bordas sutis |
| `--hair-mag` | `rgba(225,55,158,0.16)` | — | Bordas com acento magenta |
| `--hair-strong` | `rgba(225,55,158,0.30)` | — | Bordas magenta em hover/focus |
| `--ink` | `#f4f1f5` | ✅ AAA 14.4:1 | Texto primário, títulos |
| `--ink-2` | `#cbc4d2` | ✅ AAA 9.8:1 | Texto secundário, subtítulos |
| `--muted` | `#9a8fa3` | ✅ AA 4.8:1 | Texto terciário, placeholders |
| `--dim` | `#6e6678` | ❌ FALHA 3.0:1 | Somente labels mono uppercase |
| `--magenta` | `#e1379e` | ✅ AA 4.6:1 vs --bg | Ação, destaque, CTA |
| `--magenta-deep` | `#b21e97` | — | Gradiente (escuro) |
| `--pink` | `#ff53c8` | — | Hover/glow — nunca texto |
| `--shadow-card` | (ver theme.css) | — | Sombra de card |

> ⚠️ **`--dim` WCAG FAILURE** — ratio 3.0:1 vs `--surface` falha WCAG AA para texto normal.
> **Regra:** use `--dim` SOMENTE em labels mono uppercase (kicker, rail-label, toc.lab, post-meta datas).
> Para texto corrido, use `--muted` (4.8:1 ✅).

### Fix para `--dim` em text body

```css
/* ANTES (falha AA): */
.sr-post-meta .sec { color: var(--dim); }

/* DEPOIS (corrigido): */
.sr-post-meta .sec { color: var(--muted); }

/* --dim permanece válido em: */
.sr-rail-label { color: var(--dim); }          /* mono uppercase — OK por contexto */
.sr-kicker { color: var(--muted); }            /* mínimo --muted em kickers */
```

### Tokens de Cor Ausentes (adicionar na próxima sprint de infra — T1)

```css
/* src/styles/theme.css — seção a adicionar */
:root {
  /* Status */
  --pos:  #1faf54;    /* sucesso / positivo */
  --neg:  #ff5252;    /* erro / negativo */
  --warn: #e1b33a;    /* aviso */
  --info: #4fa8d5;    /* informativo */

  /* Dataviz (para posts com dados e /admin/ds) */
  --chart-1: var(--magenta);   /* #e1379e */
  --chart-2: #4fa8d5;
  --chart-3: #1faf54;
  --chart-4: #e1b33a;
  --chart-5: #9b59b6;
  --chart-6: var(--pink);      /* #ff53c8 */
  --chart-7: #4ecdc4;
}
```

---

## 3. Tipografia {#tipografia}

→ Especificação completa em [typography.md](./typography.md)

### Resumo do Stack

| Token | Família | Pesos | Papel |
|---|---|---|---|
| `--font-display` | Fraunces | 300–700 + italic | H1, H2 editorial, display, pull quote |
| `--font-body` / `--font-app` | Hanken Grotesk | 300–700 | Corpo de texto, UI |
| `--font-mono` | JetBrains Mono | 400–600 | Kickers, labels, metadados, código |

### Escala Tipográfica (tokens ausentes — recomendados)

```css
:root {
  --text-xs:    10.5px;
  --text-sm:    12.5px;
  --text-base:  14.5px;
  --text-md:    16.5px;              /* corpo de artigo */
  --text-lg:    19px;
  --text-xl:    22px;                /* H2 de artigo */
  --text-2xl:   27px;
  --text-3xl:   clamp(26px,3.4vw,40px);
  --text-hero:  clamp(32px,5vw,58px);  /* post H1 */

  --lh-tight:   1.06;
  --lh-snug:    1.15;
  --lh-normal:  1.45;
  --lh-relaxed: 1.72;   /* corpo de artigo — inviolável */

  --weight-light:    300;
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
}
```

---

## 4. Layout e Grid {#layout}

### Tokens de Layout (existentes)

| Token | Valor | Uso |
|---|---|---|
| `--rail-w` | `288px` | Largura da sidebar rail |
| `--measure` | `760px` | Largura máxima de leitura (prose) |

### Estrutura do Layout

```
Container máximo: 1560px (sr-shell)
├── Rail: 288px, sticky, height 100vh (sr-rail)
└── Main: 1fr (sr-main)
    ├── Topbar: sticky top 0, z-index 50, padding 14px 40px
    └── Content: padding 48px 40px 120px, max-width 1080px (sr-wrap)
        ├── Assimétrico: grid 2fr 1fr, gap 22px (sr-grid-asym)
        └── Row 3: auto-fill minmax(260px, 1fr), gap 22px (sr-row3)

Post layout:
├── Cover: 60vh min-height 430px (sr-post-cover)
└── Shell: max-width 1280px, padding 0 40px (sr-post-shell)
    └── Article: grid 1fr 180px, gap 40px (sr-article)
        ├── Prose: min-width 0 (sr-prose)
        └── TOC: sticky top 90px, width 180px (sr-rightcol)
```

### Breakpoints

| Breakpoint | Mudança |
|---|---|
| `≤ 900px` | Rail colapsa para horizontal; sr-grid-asym → 1fr; sr-article → 1fr; sr-rightcol → static |

---

## 5. Movimento {#movimento}

### Tokens Existentes

| Token | Valor | Uso |
|---|---|---|
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing spring padrão (saída rápida) |
| `--ease-s` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Transições suaves |

### Tokens de Duração Ausentes (recomendados — Studio DS)

```css
:root {
  --duration-instant:  70ms;   /* feedback hover (cor, borda) */
  --duration-fast:    150ms;   /* transições de cor */
  --duration-normal:  250ms;   /* padrão de UI */
  --duration-slow:    400ms;   /* card hover, transforms */
  --duration-slower:  700ms;   /* sr-reveal, parallax */
}
```

### Tokens de Easing Ausentes (recomendados)

```css
:root {
  --ease-out:      ease-out;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);    /* Material 3 */
  --ease-entrance: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit:     cubic-bezier(0.4, 0, 1, 1);
}
```

### Padrões de Movimento em Uso

```css
/* Hover de cor/borda (rápido) */
transition: background .25s, color .25s;

/* Elevação de card */
transition: transform .5s var(--ease), box-shadow .45s var(--ease), border-color .4s;

/* Scroll reveal */
.sr-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .7s var(--ease), transform .7s var(--ease);
}
.sr-reveal.sr-visible { opacity: 1; transform: translateY(0); }

/* OBRIGATÓRIO — reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sr-reveal { opacity: 1 !important; transform: none !important; }
}
```

---

## 6. Espaçamento {#espacamento}

Os valores abaixo são implícitos nos componentes. Tokens recomendados para canonizar:

```css
:root {
  --space-1:    2px;
  --space-2:    4px;
  --space-3:    8px;
  --space-4:   12px;
  --space-5:   16px;
  --space-6:   20px;
  --space-7:   24px;
  --space-8:   32px;
  --space-9:   40px;
  --space-10:  56px;
  --space-11:  80px;
  --space-12: 120px;
}
```

### Valores de Referência Implícitos

| Contexto | Valor Usado |
|---|---|
| Gap entre cards | `22px` |
| Padding de card body | `18px 22px` |
| Padding de sr-wrap | `48px 40px 120px` |
| Margin-top seção | `88px` |
| Rail padding | `30px 26px` |
| Topbar padding | `14px 40px` |
| Gap do artigo (prose + TOC) | `40px` |
| Margin-top newsletter fold | `120px` |

---

## 7. Raio de Borda {#raio}

```css
/* Recomendado — adicionar ao theme.css */
:root {
  --r-xs:   9px;     /* brand mark */
  --r-sm:   12px;    /* campos, inputs */
  --r-md:   16px;    /* cards médios, list-cards */
  --r-lg:   24px;    /* CutoutCard, hero */
  --r-full: 999px;   /* tags, pills, botões */
}
```

### Uso Atual por Componente

| Componente | Raio |
|---|---|
| Tags, pills, sr-btn | `72px` / `999px` → `--r-full` |
| Brand mark | `9px` → `--r-xs` |
| sr-field, sr-cu | `10px–13px` → `--r-sm` |
| sr-card, sr-list-card, sr-adj-item | `14px–16px` → `--r-md` |
| sr-hero, sr-cutcard, sr-news-fold | `20px–24px` → `--r-lg` |

---

## 8. Status e Dataviz {#status}

Ver tokens sugeridos na [seção 2](#tokens-cor). Uso editorial:

- `--pos` → badge "publicado", conversão positiva no admin
- `--neg` → estado de erro em formulários, alerta
- `--warn` → badge de conteúdo em revisão
- `--info` → sr-callout variante informativa

Dataviz rules:
- Nunca misture `--chart-*` com `--magenta` como background no mesmo elemento
- Ordem prioritária: `--chart-1` (métrica principal), `--chart-2`, `--chart-3`
- Rótulos de gráfico: `--font-mono`, `--ink-2` ou `--muted`

---

## 9. Acessibilidade WCAG 2.1 AA {#wcag}

### Tabela de Contraste Completa

| Foreground | Background | Ratio | Status |
|---|---|---|---|
| `--ink` #f4f1f5 | `--surface` #131017 | 14.4:1 | ✅ AAA |
| `--ink-2` #cbc4d2 | `--surface` #131017 | 9.8:1 | ✅ AAA |
| `--muted` #9a8fa3 | `--surface` #131017 | 4.8:1 | ✅ AA |
| `--dim` #6e6678 | `--surface` #131017 | 3.0:1 | ❌ FALHA texto normal |
| `--dim` #6e6678 | `--bg` #0b0a0d | 3.4:1 | ❌ FALHA texto normal |
| `--magenta` #e1379e | `--bg` #0b0a0d | 4.6:1 | ✅ AA |
| `#fff` | `--magenta` #e1379e | 4.1:1 | ✅ AA (≥14px bold) |
| `#fff` | `#15803d` (btn-wa) | 5.3:1 | ✅ AA |
| `--ink-2` #cbc4d2 | `--bg` #0b0a0d | 11.1:1 | ✅ AAA |

### Regras de Acessibilidade Aplicadas

1. **Texto body**: mínimo `--ink-2` (#cbc4d2) — ratio 9.8:1 ✅
2. **Texto UI**: mínimo `--muted` (#9a8fa3) — ratio 4.8:1 ✅
3. **`--dim` proibido em texto corrido** — somente labels mono uppercase onde contexto (tamanho, espaçamento, uppercase) compensa
4. **Focus rings obrigatórios**: todo elemento interativo recebe `:focus-visible`
5. **Reduced motion**: todo `.sr-reveal` tem `@media (prefers-reduced-motion: reduce)` override ✅ (já implementado)
6. **Alt text**: toda `<img>` tem `alt` não-vazio (ver [image-gates.md](./image-gates.md))
7. **Estrutura de headings**: hierárquica sem pular níveis (H1→H2→H3)
8. **Links ativos**: `aria-current="page"` em navegação

### Focus Ring (gap — adicionar ao showroom.css)

```css
/* Adicionar ao final de showroom.css */
:focus-visible {
  outline: 2px solid var(--magenta);
  outline-offset: 3px;
  border-radius: 3px;
}
```

---

## 10. Gates de Qualidade {#gates}

### G1 — Color Gate
- [ ] Nenhum texto body usa `--dim` como cor
- [ ] Magenta < 5% da área visual por viewport
- [ ] Nenhuma cor fora da paleta de tokens

### G2 — Typography Gate
- [ ] H1 usa Fraunces com `font-variation-settings: 'opsz' 144`
- [ ] Corpo usa Hanken Grotesk 16.5px / lh 1.72
- [ ] Labels técnicos usam JetBrains Mono uppercase com letter-spacing ≥ .08em
- [ ] Nenhuma `font-size` abaixo de 10.5px

### G3 — Image Gate
- [ ] Toda imagem de capa ≥ 1200px de largura
- [ ] OG image usa fundo escuro (`#0b0a0d` ou `#131017`)
- [ ] Todo `<img>` tem `alt` não-vazio
- [ ] (detalhes em [image-gates.md](./image-gates.md))

### G4 — Motion Gate
- [ ] Todo `.sr-reveal` tem `@media (prefers-reduced-motion: reduce)` override
- [ ] Nenhuma animação `duration > 1s` sem justificativa editorial

### G5 — WCAG Gate
- [ ] Nenhum texto falha WCAG AA (mínimo 4.5:1 texto normal, 3:1 texto grande 18px+ ou 14px bold)
- [ ] Todos os elementos interativos têm `:focus-visible`
- [ ] Estrutura de headings hierárquica (sem pular níveis)

---

## 11. Checklist de Publicação {#checklist}

```
Antes de publicar qualquer mudança no blog:

[ ] G1 Color Gate — nenhum dim em texto, magenta < 5%
[ ] G2 Typography Gate — fontes e pesos corretos
[ ] G3 Image Gate — toda imagem tem alt + dimensão ok
[ ] G4 Motion Gate — reduced-motion override presente
[ ] G5 WCAG Gate — sem texto abaixo de 4.5:1

[ ] Build verde:
    node --trace-uncaught node_modules/.bin/astro build

[ ] Sprint 4 SEO pipeline intacto (worker publica a cada 30min)
[ ] OG image validada (WhatsApp preview / og debugger)
[ ] Nenhum arquivo novo commitado além do escopo da mudança
```

---

## 12. Glossário {#glossario}

| Termo | Definição |
|---|---|
| **dark-only** | Blog permanentemente escuro — decisão editorial, não preferência do usuário |
| **magenta-evento** | `--magenta` usado como sinal de ação, nunca como cor de ambiente |
| **grain** | Textura de ruído fractal (SVG inline, 3.5% opacity) via `body::after` |
| **orb** | Elemento radial-gradient magenta fixo top-left (28% opacity, blur 90px) |
| **rail** | Sidebar esquerda sticky (288px) com navegação e mini-newsletter |
| **CutoutCard** | `.sr-cutcard` — card com badge recortado via CutoutCorner SVG |
| **CutoutCorner** | SVG de canto côncavo (23px) usado no inset e pin do CutoutCard |
| **kicker** | Label mono uppercase acima do título (categoria, nível) |
| **eyebrow** | Linha mono magenta com regra horizontal 30px antes de seção |
| **dek-lead** | Parágrafo intro em Fraunces italic 23px — abre o artigo antes do H2 |
| **TLDR** | Caixa de resumo do artigo (3–5 bullets magenta) |
| **sr-reveal** | Classe de scroll entrance — JS adiciona `.sr-visible` para animar |
| **magnet** | Lead magnet (PDF, checklist) — catalogado em `lead_magnets` no D1 |
| **cluster** | Categoria de conteúdo (rastreio, agência, portal) |
| **measure** | `--measure: 760px` — largura máxima de leitura do prose |
| **hair** | `--hair: rgba(255,255,255,0.07)` — borda sutil, quase invisível |
