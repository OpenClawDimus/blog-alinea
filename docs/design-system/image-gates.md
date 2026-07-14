# Image Gates — blog.dimus.com.br

Regras obrigatórias para todas as imagens publicadas no blog. Critério binário: PASS/FAIL.

---

## Mapa de Tipos

| Tipo | Onde aparece | Gate |
|---|---|---|
| **Cover** | sr-post-cover, sr-hero, OG | G-COVER |
| **OG Image** | `<meta og:image>`, WhatsApp, LinkedIn | G-OG |
| **Thumbnail** | sr-card, sr-cutcard, sr-list-card, sr-row3 | G-THUMB |
| **Inline** | Dentro do corpo do artigo (sr-prose) | G-INLINE |

---

## G-COVER — Imagem de Capa

### Especificações Técnicas

| Propriedade | Valor |
|---|---|
| Largura mínima | **1200px** |
| Aspect ratio preferido | 21:9 (hero da home), 16:10 (card de post) |
| Formato | WEBP (preferido) · JPEG (fallback) |
| Tamanho máximo de arquivo | 400KB após compressão |
| `object-fit` | `cover` — imagem é cropada pelo container |
| `filter` aplicado | `saturate(1.02–1.05)` — integração dark |

### Regra de Parallax

O `sr-post-cover img` usa `height: 120%` para habilitar efeito de parallax via scroll. O assunto principal da imagem DEVE estar dentro da **área segura vertical** (20% a 80% da altura total) para que o crop do scroll não corte o elemento central.

### Regras Visuais

1. **Contraste sobre overlay**: o texto que sobrepõe a imagem recebe um `::after` gradient-escuro (`rgba(11,10,13,.5) → var(--surface)`). Mesmo assim, imagens muito claras devem ser evitadas — o overlay tem limite de densificação.

2. **Saturação máxima 1.05**: valores acima ficam artificiais e destoam do tema dark. O filtro `saturate(1.03)` está aplicado nos componentes — não remova.

3. **Estética alinhada ao ICP**: imagens de dashboards, carros em pátio, dados em tela, concessionárias de noite. Evite stock genérico de pessoas sorrindo em escritório.

4. **Integração dark**: prefira fotos com profundidade de cor. Imagens com grandes áreas brancas ou super-expostas conflitam com o tema escuro mesmo com overlay.

5. **Sem texto informativo dentro da imagem**: qualquer informação embutida na imagem (números, labels, CTAs) não é acessível por screen reader. Use `alt` e `<figcaption>`.

### Alt Text de Capa

```
Formato: "[Assunto principal]. [Contexto relevante ao artigo]."
Máximo: 125 caracteres
Obrigatório: descreve o que está NA imagem, não "capa do artigo sobre..."

✅ CORRETO:
"Dashboard de analytics com funil de vendas de uma revenda. 
 Canal de indicação aparece como maior fonte, sem rastreio."

❌ ERRADO:
"Imagem de capa do post sobre marketing automotivo."
"Cover image."
"" (vazio)
```

### Nome de Arquivo de Capa

```
Formato: [keyword-slug]-[contexto]-cover.webp
Exemplo: rastreio-leads-automotivo-dashboard-cover.webp

Regras:
- Kebab-case, sem acentos
- Inclua a keyword principal do artigo
- Sufixo -cover para distinguir de thumbnails
```

---

## G-OG — Open Graph Image

### Especificações

| Propriedade | Valor |
|---|---|
| Dimensões | **1200 × 630px** (ratio 1.91:1) |
| Background | `#0b0a0d` (--bg) — **NUNCA fundo claro** |
| Formato de saída | PNG (satori + sharp) |
| Fonte primária | Fraunces (via `fontData["--font-fraunces"]`) |
| Fonte secundária | Hanken Grotesk (a adicionar ao og.png.ts) |

### Gap Identificado — OG Atual

O arquivo `src/pages/og.png.ts` usa `background: "#fefbfb"` (claro) — **diverge do tema dark**. Esta é a OG site-level genérica.

### Spec Alvo para Correção (og.png.ts)

```typescript
// Substituir fundo claro por escuro
background: "#0b0a0d",

// Layout: 3 zonas
// Topo: kicker mono uppercase "blog.dimus.com.br" em --muted
// Centro: título do site em Fraunces 500, cor --ink
// Base: URL "blog.dimus.com.br" em JetBrains Mono, --dim

// Acento: traço magenta (#e1379e) de 3px na borda inferior
// ou badge top-left com nome do blog
```

### Rota OG Por Post (gap — não implementado ainda)

Atualmente existe apenas a OG site-level. Cada post deveria ter OG individual:

```
/posts/[slug]/og.png  →  src/pages/posts/[slug]/og.png.ts
```

**O que esta rota deve fazer:**
1. Ler `frontmatter.title`, `frontmatter.description`, `frontmatter.cluster` do slug
2. Gerar imagem com título do POST (não do site)
3. Kicker mono uppercase com cluster/categoria
4. Background: `#0b0a0d`
5. Opcionalmente usar a cover image como background com overlay dark (60–70% opacity)
6. URL do blog no rodapé em mono muted
7. Badge magenta com "blog.dimus.com.br" ou "ANÁLISE" / "CASE" conforme tipo do post

**Verificar antes de implementar:** `config.features.dynamicOgImage` deve ser `true`.

### Validação de OG

Após deploy, validar com:
- [Meta Open Graph Debugger](https://developers.facebook.com/tools/debug/)
- Preview de WhatsApp (compartilhar link e verificar card)
- [opengraph.xyz](https://www.opengraph.xyz) para visualização rápida

---

## G-THUMB — Thumbnails de Card

### Dimensões por Tipo de Card

| Componente | Aspect Ratio | Min Width | Notas |
|---|---|---|---|
| `sr-hero .cover` | 21:9 | 800px | Hero da home |
| `sr-card .thumb` | 16:10 | 400px | Card padrão |
| `sr-card.tall .thumb` | auto (flex, min-height 240px) | 400px | Card tall |
| `sr-cutcard__media` | 16:10 | 400px | CutoutCard padrão |
| `sr-cutcard--tall .sr-cutcard__media` | auto (min-height 240px) | 400px | CutoutCard tall |
| `sr-row3 .thumb` | 16:11 | 300px | Cards de row |
| `sr-list-card` | livre (object-fit cover, min-height 160px) | 300px | Lista horizontal |

### Regras de Thumbnail

1. **Foco no centro**: `object-fit: cover` cropa a imagem. O assunto principal deve estar nos 40–60% centrais (horizontal e vertical).

2. **Sem repetição**: nunca use a mesma imagem em dois cards do mesmo viewport. O sistema aplica `filter: saturate(1.02)` — imagens idênticas ficam óbvias.

3. **Overlay automático**: todos os thumbs recebem `::after` gradient-escuro. Imagens muito escuras ficam "planas" — prefira imagens com contraste médio.

4. **Fallback**: quando não há imagem específica, use a OG image do post como thumbnail. Nunca deixe `src` vazio.

5. **Transição de hover**: o sistema aplica `transform: scale(1.06)` em hover. A imagem deve ter área extra nas bordas (ao menos 6%) para que o zoom não exponha o recorte.

---

## G-INLINE — Imagens no Corpo do Artigo

### Especificações

| Propriedade | Valor |
|---|---|
| Largura máxima | 760px (= --measure) |
| Largura mínima | 600px recomendado |
| Formato | WEBP preferido |
| Tamanho máximo por imagem | 150KB |
| Loading | `lazy` (automático com `<Image />` do Astro) |
| Decoding | `async` |

### Estrutura HTML Obrigatória

```html
<!-- Sempre usar <figure> + <figcaption> para imagens inline -->
<figure>
  <Image
    src={dashboardSrc}
    alt="Dashboard mostrando 847 leads recebidos e 9 vendas atribuídas. 
         Canal WhatsApp aparece sem rastreio no painel da agência."
    width={760}
    height={427}
  />
  <figcaption>
    Dados reais de uma revenda de 35 carros/mês. Fonte: compilação interna Dimus, 2024.
  </figcaption>
</figure>
```

### Alt Text de Imagens Inline

```
Comprimento: 50–125 caracteres
Conteúdo: descreva O QUE ESTÁ NA IMAGEM + o dado/contexto editorial relevante
Inclua: números, valores, tendências visíveis na imagem quando relevante
Evite: "imagem mostrando que...", "gráfico de..." (desnecessário)

✅ CORRETO:
"847 leads no painel vs 9 vendas rastreadas. Diferença de 98% sem atribuição."

❌ ERRADO:
"Gráfico de leads"
"Dashboard de analytics"
"" (vazio — falha WCAG 1.1.1)
```

### SEO de Imagem Inline

```
Nome de arquivo:
[keyword-principal]-[o-que-mostra]-[numero].webp
Exemplo: rastreio-canal-whatsapp-leads-sem-atribuicao-01.webp

Caption (figcaption):
- 1–2 frases que explicam O QUE o dado mostra
- Inclua a keyword quando natural
- Cite a fonte quando for dado real (ex: "Fonte: relatório interno, Q1 2025")

Imagens de dados obrigatório:
- Número principal visível explicitado no alt text
- Período do dado na caption
- Fonte do dado (agência, plataforma, período) na caption
```

---

## SEO de Imagem — Checklist Consolidado

```
Antes de publicar artigo com imagens:

Cover:
[ ] Largura ≥ 1200px
[ ] Alt text descritivo (≤ 125 chars, não começa com "Imagem de...")
[ ] Nome: keyword-contexto-cover.webp
[ ] Assunto no centro vertical (área segura parallax 20%–80%)
[ ] Saturação 1.02–1.05 (integrada ao dark)

OG Image:
[ ] Background escuro (#0b0a0d)
[ ] Testada no WhatsApp preview
[ ] Testada no Facebook OG Debugger

Thumbnails:
[ ] Sem imagem duplicada no mesmo viewport
[ ] Assunto principal nos 40–60% centrais

Inline:
[ ] Envoltas em <figure> + <figcaption>
[ ] Alt text descritivo com dado quando relevante
[ ] Nome: keyword-o-que-mostra-numero.webp
[ ] Fonte citada na caption para dados reais
[ ] Nenhuma imagem com texto informativo embutido sem alternativa em texto
```
