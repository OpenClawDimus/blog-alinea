# Typography — blog.dimus.com.br

Especificações completas para toda a tipografia do blog.
Referência: `src/styles/showroom.css` (componentes) + `src/styles/theme.css` (tokens).

---

## Stack de Fontes

| Token | Família | Pesos | Papel Editorial |
|---|---|---|---|
| `--font-display` | **Fraunces** | 300–700 + italic variable | Titulagem editorial, display, pull quote |
| `--font-body` / `--font-app` | **Hanken Grotesk** | 300–700 | Corpo de texto, navegação, UI |
| `--font-mono` | **JetBrains Mono** | 400–600 | Kickers, labels, metadados, código |

### Características das Fontes

**Fraunces** — Serif óptica variável
- Eixo `opsz` (optical size): range 9–144
- Italic REAL disponível — nunca use `font-style: oblique`
- Nunca abaixo de 16px em uso editorial
- `font-variation-settings: 'opsz' 144` para display amplo; `'opsz' 36` para dek-lead

**Hanken Grotesk** — Sans-serif humanista
- Fallback: `ui-sans-serif, -apple-system, system-ui, sans-serif`
- Letter-spacing: negativo em títulos (`-.01em` a `-.02em`), neutro em corpo
- Nunca `font-weight < 400` em texto de leitura

**JetBrains Mono** — Monospace editorial
- Exclusivo para labels técnicos, kickers, metadados e código
- SEMPRE uppercase + letter-spacing quando usado como label (`.08em` a `.22em`)
- Fallback: `ui-monospace, "Courier New", monospace`

---

## Hierarquia de Títulos

### H1 — Título de Post (`.sr-post-h1`)

```css
font-family: var(--font-display);        /* Fraunces */
font-weight: 500;
font-variation-settings: 'opsz' 144;    /* óptico máximo — gracioso em grande */
font-size: clamp(32px, 5vw, 58px);      /* 32px mobile → 58px desktop */
line-height: 1.03;
letter-spacing: -.03em;
margin: 16px 0 0;
max-width: 20ch;                         /* quebra de linha natural editorial */
color: var(--ink);                       /* #f4f1f5 */
```

**Variante itálica em `<em>`:**
```css
.sr-post-h1 em {
  font-style: italic;
  color: var(--magenta);    /* #e1379e */
  font-weight: 500;
}
```

**Regras de Conteúdo H1:**
- Exatamente 1 H1 por página (HTML semântico obrigatório)
- Máximo 70 caracteres totais
- Keyword principal nos primeiros 60 caracteres
- Começa com dado, verbo ou situação — nunca com artigo ("O", "A")
- Pode conter `<em>` para destaque editorial em magenta

**Exemplo:**
```html
<h1 class="sr-post-h1">
  Uma revenda cancelou o Webmotors.
  <em>Não sumiu do mapa.</em>
</h1>
```

---

### H2 — Seção de Artigo (`.sr-prose .app-prose h2`)

```css
font-family: var(--font-display);
font-size: 22px;
font-weight: 600;
letter-spacing: -.025em;
line-height: 1.2;
margin: 44px 0 14px;                     /* espaço generoso acima — respira */
color: var(--ink);                       /* #f4f1f5 — mesmo nível que H1 */
```

**Regras de Conteúdo H2:**
- Máximo 5–7 H2 por artigo
- Cada H2 aparece no TOC (`.sr-toc`) — use IDs para ancoragem: `id="nome-da-secao"`
- SEO: inclua variações semânticas da keyword principal
- H2 é a "pergunta que o leitor tem" — deve poder ser uma busca no Google
- Nunca pule de H1 direto para H3 sem H2 intermediário

---

### H3 — Subseção de Artigo (`.sr-prose .app-prose h3`)

```css
font-family: var(--font-display);
font-size: 17px;
font-weight: 600;
font-style: normal;
letter-spacing: -.015em;
margin: 28px 0 10px;
color: var(--ink-2);                     /* #cbc4d2 — distinguível do H2 */
```

**Diferença visual H2 vs H3 (INVIOLÁVEL):**
| Propriedade | H2 | H3 |
|---|---|---|
| Cor | `--ink` (#f4f1f5) | `--ink-2` (#cbc4d2) |
| Tamanho | 22px | 17px |
| Margin-top | 44px | 28px |

Esta distinção visual é o que permite ao leitor navegar a hierarquia sem olhar para o TOC. Nunca equalize H2 e H3.

---

### H4 — Nível de Componente

H4 aparece em dois contextos com estilos distintos:

**1. H4 Editorial (dentro de card/componente):**
```css
/* sr-solve h4, sr-dimus-help h3 (usa h3 mas semântica de h4) */
font-family: var(--font-display);
font-weight: 600;
font-size: 16–24px;                      /* varia por componente */
line-height: 1.15;
```

**2. H4 Label Mono (seção de label técnico):**
```css
/* sr-tldr h4, sr-toc .lab, .sr-solve .b */
font-family: var(--font-mono);
font-size: 10.5–11px;
letter-spacing: .14–.18em;
text-transform: uppercase;
color: var(--magenta) ou var(--dim);
```

---

### H5 e H6 — Não Definidos

H5 e H6 não têm estilos no blog. Se precisar de subnível além de H4 dentro de um artigo:
- Refatore a estrutura do artigo (artigo com 5+ níveis é um artigo mal estruturado)
- Use `<strong>` + parágrafo para sub-itens dentro de H4
- Crie um novo artigo a partir do sub-tópico

---

## Display Typography (Fraunces além dos headings de artigo)

### `.sr-archive-title` — Títulos de Archive/Tags

```css
font-family: var(--font-display);
font-weight: 500;
font-variation-settings: 'opsz' 72;
font-size: clamp(32px, 4vw, 52px);
letter-spacing: -.03em;
line-height: 1.05;
margin: 18px 0 48px;
color: var(--ink);
```

### `.sr-news-fold h2` — Display de Newsletter

```css
font-family: var(--font-display);
font-weight: 500;
font-variation-settings: 'opsz' 144;
font-size: clamp(26px, 3.4vw, 40px);
letter-spacing: -.025em;
line-height: 1.08;
max-width: 20ch;
/* <em> → font-style: italic; color: var(--magenta) */
```

### `.sr-section-head h2` — Header de Seção na Home

```css
font-family: var(--font-display);
font-weight: 600;
font-variation-settings: 'opsz' 72;
font-size: 28px;
letter-spacing: -.02em;
```

### `.sr-pull` — Pull Quote

```css
font-family: var(--font-display);
font-weight: 500;
font-style: italic;
font-size: 31px;
line-height: 1.22;
letter-spacing: -.01em;
color: var(--ink);
border-left: 2px solid var(--magenta);
padding-left: 20px;
max-width: 22ch;
margin: 40px 0;
```

**Regra de uso:** máximo 1 pull quote por artigo. Extrai a frase mais impactante do language bank do ICP. Nunca use pull quote para informação técnica — reserve para frases verbatim do leitor.

### `.sr-dek-lead` — Parágrafo de Lead

```css
font-family: var(--font-display);
font-weight: 400;
font-variation-settings: 'opsz' 36;     /* intermediário — mais suave para leitura */
font-size: 23px;
line-height: 1.45;
font-style: italic;
color: var(--ink-2);
margin-bottom: 30px;
```

**Regra de uso:** aparece uma vez por artigo, entre o H1 e o primeiro H2. Máximo 3 frases. Não é itálico decorativo — é o parágrafo de abertura da voz editorial.

---

## Body Typography (Hanken Grotesk)

### Corpo de Artigo (`.sr-prose .app-prose p, li`)

```css
font-family: var(--font-body);           /* Hanken Grotesk */
font-size: 16.5px;
line-height: 1.72;                       /* INVIOLÁVEL — validado para legibilidade */
color: rgb(203, 196, 210);              /* ≈ --ink-2, ligeiramente ajustado */
```

**Regras de corpo:**
- Line-height 1.72 não é negociável
- Máximo ~70 caracteres por linha (controlado pela coluna de prose)
- Nunca `font-weight < 400` em texto corrido
- `<strong>` = weight 600 (não 700)
- `<em>` em corpo = italic Hanken Grotesk, cor mantida (não adiciona cor)

### Navigation / UI

```css
/* sr-topnav a, sr-clusters li a */
font-size: 14–14.5px;
font-weight: 500;
color: var(--ink-2);
/* hover/active → color: #fff */
```

### Brand Name (`.sr-brand .name`)

```css
font-family: var(--font-display);
font-weight: 600;
font-size: 20px;
letter-spacing: -.02em;
```

### Textos de Suporte (`.sr-brand-sub`, `.sr-news-fold p`, `.sr-solve p`)

```css
font-size: 12.5–15.5px;
color: var(--muted) ou var(--ink-2);
line-height: 1.5;
max-width: 52–60ch;
```

---

## Mono Typography (JetBrains Mono)

| Componente | Tamanho | Letter-spacing | Transform | Cor |
|---|---|---|---|---|
| `.sr-kicker` | 10.5px | .12em | uppercase | `--muted` |
| `.sr-eyebrow` | 11px | .18em | uppercase | `--magenta` |
| `.sr-rail-label` | 10.5px | .18em | uppercase | `--dim` |
| `.sr-tag` | 11px | .08em | uppercase | `--muted` |
| `.sr-post-meta` | 12.5px | — | — | `--dim` / `--ink-2` |
| `.sr-toc .lab` | 10.5px | .18em | uppercase | `--dim` |
| `.sr-datastrip` | 11px | — | — | `--muted` |
| `.sr-dotsep` (visual) | 3px × 3px | — | — | `--dim` |
| `.sr-adj-item .lab` | 10.5px | .12em | uppercase | `--muted` |
| `.sr-list-date` | 10.5px | .10em | uppercase | `--dim` |
| `.sr-tag-count` | 10.5px | .12em | uppercase | `rgba(255,255,255,.5)` |
| `.sr-section-head a` (ver tudo) | 12px | — | — | `--muted` |
| `.sr-proof` | 11.5px | — | — | `--dim` |
| `.sr-cutcard__cta` | 11px | .06em | — | `#fff` |
| `.sr-cutcard__pin` | 10.5px | .10em | uppercase | `#fff` |

---

## SEO Rules para Títulos

1. **H1 único por página**: obrigatório HTML semântico. Em páginas com display editorial diferente (home, archive), o H1 semântico existe no HTML mas pode ter estilo diferente do display visual.

2. **Keyword no H1**: keyword principal nos primeiros 60 caracteres. Inicie com o dado/situação mais impactante.

3. **H2 = perguntas do leitor**: cada H2 deve mapear uma intenção de busca real. Teste: "alguém buscaria exatamente isso no Google?"

4. **H3 = respostas de H2**: subnível de H2. Se precisar de H3 sem H2 antes, crie o H2 pai.

5. **Comprimento recomendado:**
   - H1: 40–70 chars (inclui keyword)
   - H2: 25–60 chars
   - H3: 15–50 chars
   - H4: sem limite rígido (contexto de componente)

6. **Sem pontuação terminal**: headings não terminam com `.`. Podem terminar com `?`, `!`, ou `:` quando editorialmente justificado.

7. **Sem pular níveis**: sempre H1 → H2 → H3 → H4, na sequência. Nunca H1 → H3 ou H2 → H4 direto.

---

## Variáveis de Fonte Óptica (opsz)

| Valor | Contexto | Efeito Visual |
|---|---|---|
| `'opsz' 144` | Post H1, newsletter display | Serifas grandes, muito amplo, máximo editorial |
| `'opsz' 72` | Archive title, section-head | Intermediário, balanceado |
| `'opsz' 36` | Dek-lead | Mais compacto, adequado para parágrafo grande |
| padrão | Títulos de card, h2/h3 de artigo | opsz não especificado — fonte decide |

**Regra:** nunca use `opsz < 36` em Fraunces — os pesos ópticos pequenos são calibrados para texto miúdo, ficam finos demais em display.

---

## Typography Gates

### TG1 — Font Family Gate
- [ ] Display (H1, section display, pull quote) usa Fraunces
- [ ] Corpo do artigo usa Hanken Grotesk
- [ ] Labels, kickers, metadados usam JetBrains Mono
- [ ] Nenhum elemento display usa system-ui ou sans-serif genérico

### TG2 — Size Gate
- [ ] Nenhum texto abaixo de 10.5px visível na página
- [ ] H1 usa `clamp()` — nunca tamanho fixo
- [ ] Corpo do artigo: exatamente 16.5px / 1.72 line-height
- [ ] Pull quote ≤ 22ch de largura máxima

### TG3 — Hierarchy Gate
- [ ] Exatamente 1 H1 por página
- [ ] Sem pular níveis (H1→H3 sem H2, etc.)
- [ ] H2 e H3 visualmente distinguíveis (cor + tamanho)
- [ ] Headings ≤ 70 chars

### TG4 — SEO Gate
- [ ] Keyword principal nos primeiros 60 chars do H1
- [ ] H1 não começa com artigo ("O", "A", "Os", "As")
- [ ] Cada H2 mapeia uma intenção de busca real
- [ ] Nenhum heading termina com `.`
