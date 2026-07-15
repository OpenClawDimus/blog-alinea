# Image Gates — blog.dimus.com.br

Regras obrigatórias para todas as imagens publicadas no blog. Critério binário: PASS/FAIL.

> **Última revisão:** 2026-07-15 — Separação `coverImage` / `ogImage` + linguagem MiniMax dark cinematic.

---

## ⚠️ ARQUITETURA CRÍTICA — coverImage ≠ ogImage

Antes de qualquer outra coisa: o blog tem **dois campos distintos** para imagem e eles têm funções completamente diferentes.

| Campo | O que é | Onde aparece |
|---|---|---|
| `coverImage` | **Foto real / imagem artística** — o que o leitor vê | Card thumbnail + hero do post |
| `ogImage` | **Gráfico tipográfico 1200×630** — preview social | `<meta og:image>`, WhatsApp, LinkedIn |

### Regra absoluta

```
coverImage → FOTO/ARTE → o card e o hero do post
ogImage    → GRÁFICO   → preview social apenas
```

**Nunca use um gráfico OG como `coverImage`.** Nunca use uma foto como `ogImage`.

### Exemplo de frontmatter correto

```yaml
---
title: "Custo por Lead em Concessionária: Benchmark 2025"
ogImage: /og/og-custo-por-lead-concessionaria.png   # gráfico tipográfico 1200×630
coverImage: /covers/custo-por-lead-concessionaria-photo.jpg  # foto dark cinematic
---
```

---

## LINGUAGEM VISUAL PADRÃO — Dark Cinematic

Todos os `coverImage` do blog seguem um único padrão estético. Consistência é o ponto.

### O padrão (APROVADO ✅)

- **Fotografia ou arte gerada com iluminação dramática**: profundidade de campo rasa (f/1.4–f/2.8), bokeh, rim light
- **Paleta**: tons escuros dominantes (preto, navy, carvão), com acento de luz magenta ou ciano
- **Sem texto ou números sobrepostos na imagem** — informação vai no artigo, não na foto
- **Assunto conectado ao tema do post**: concessionária, laptop com dados, WhatsApp, funil, etc.
- **Ponto focal central**: sujeito nos 40–60% verticais e horizontais (sobrevive ao crop do card)

### O que NÃO fazer (REPROVADO ❌)

| ❌ ERRADO | Motivo |
|---|---|
| Gráfico OG tipográfico com título do post | É OG image, não cover. Aparece como "capa com texto" no card — quebra o padrão visual |
| Foto de banco com pessoas sorrindo em escritório | Não conecta com o ICP automotivo/PME. Stock genérico |
| Imagem branca ou muito clara | Conflita com o tema dark mesmo com overlay. Overlay tem limite |
| A mesma imagem em dois posts do mesmo viewport | Proibido. O layout expõe a repetição |
| Imagem com texto de marca ou logo sobrepostos | Não acessível, não editável, não escala |
| Screenshot de tela sem tratamento | Pixels pequenos, contraste ruim. Transformar em arte ou descartar |

### Filtro CSS aplicado automaticamente (não alterar)

```css
/* showroom.css — aplicado em cards e post hero */
.sr-cutcard__media img,
.sr-post-cover img {
  filter: brightness(0.78) saturate(0.82) contrast(1.06);
}
```

O filtro unifica fotos de origens diferentes. Uma imagem que "parece escura demais" sem o filtro pode estar certa — sempre visualize no contexto do blog, nunca em editor de imagem isolado.

---

## COMO GERAR — Prompt MiniMax (Template Canônico)

Use `mcp__minimax__text_to_image` com `model: image-01`, `aspect_ratio: 16:9`.

### Template de prompt

```
[CENA]: [descrição em 1 frase do que aparece na cena, conectado ao tema do post]
[LUZ]: dramatic rim light in deep magenta, dark atmospheric
[TÉCNICA]: f/1.8 shallow depth of field, professional photography, dark cinematic
[PROIBIÇÕES]: no text, no numbers overlaid, no logos
```

### Exemplos aprovados por tema

| Tema do post | Prompt da cena |
|---|---|
| Custo por lead / métricas | Salesperson reviewing lead analytics on a laptop, glowing data dashboard reflected in windshield of luxury car, dark car showroom |
| WhatsApp para vendas | Smartphone showing WhatsApp conversation notifications in a dark car dealership, blurred vehicles in background |
| CRM / automação | Hands typing on keyboard, CRM dashboard glowing on screen, dark office environment, blue and magenta light from monitors |
| Email marketing | Laptop with email campaign dashboard open, dark atmospheric home office, soft backlight creating halo effect |
| Chatbot / IA atendimento | Abstract AI neural network visualization, deep dark background, glowing nodes in magenta and cyan |
| Custo de estoque parado | Row of cars in dark parking lot at night, selective focus on one vehicle, wet asphalt reflecting city lights |
| Lead fantasma / sem resposta | Empty car dealership reception desk, single phone on counter, moody night lighting, neon signs in background |
| Indicação / canal mais barato | Two people handshaking in front of a car in a dark showroom, dramatic side lighting |

### Fluxo completo

```bash
# 1. Gerar
mcp__minimax__text_to_image
  prompt: "[cena] + dramatic rim light in deep magenta, dark atmospheric, f/1.8 shallow depth of field, professional photography, dark cinematic, no text, no numbers overlaid"
  aspect_ratio: "16:9"
  model: "image-01"
  output_directory: "/Users/guilhermeribeiro/Downloads/blog-dimus/public/covers"

# 2. Renomear (o MiniMax gera nomes com timestamp)
cp public/covers/image_0_*.jpg public/covers/<slug-do-post>.jpg

# 3. Adicionar ao frontmatter
coverImage: /covers/<slug-do-post>.jpg

# 4. Verificar no card antes de commitar
sh node_modules/.bin/astro build  # build verde = sem erro de schema
```

---

## G-COVER — Especificações Técnicas

| Propriedade | Valor |
|---|---|
| Largura mínima | **1200px** |
| Aspect ratio | 16:9 (MiniMax padrão) — cropado para 21:9 no hero |
| Formato | JPEG (MiniMax output) · WEBP (otimizado, se reprocessado) |
| Tamanho máximo | 400KB após compressão |
| `object-fit` | `cover` — imagem é cropada pelo container |
| `object-position` | `center top` (hero) / `center` (card) |
| Filtro aplicado | `brightness(0.78) saturate(0.82) contrast(1.06)` — **não remover** |
| Overlay aplicado | `linear-gradient(160deg, rgba(100,10,82,.22) 0%, rgba(11,10,13,.05) 40%, rgba(11,10,13,.68) 100%)` |

### Área segura (parallax)

O hero usa `height: 120%` para parallax via scroll. O assunto principal DEVE estar nos **20%–80% verticais** da imagem original. Fotos MiniMax geradas em 16:9 com sujeito centralizado passam automaticamente neste gate.

---

## G-OG — Open Graph Image

### Especificações

| Propriedade | Valor |
|---|---|
| Dimensões | **1200 × 630px** (ratio 1.91:1) |
| Background | `#0b0a0d` — **NUNCA fundo claro** |
| Conteúdo | Tipografia: título do post + badge categoria + URL |
| Formato de saída | PNG |
| Localização | `/public/og/og-<slug>.png` |

### Diferença visual OG vs Cover

```
OG image:    fundo escuro + texto do título + badge "blog.dimus.com.br"
             → preview no WhatsApp/LinkedIn identifica o post pelo TÍTULO

Cover image: foto/arte dark cinematic SEM TEXTO
             → o leitor vê uma FOTO ao abrir o site
```

São peças com propósitos completamente diferentes. **Nunca trocar as duas de lugar.**

### Validação de OG após publicar

- [Meta Open Graph Debugger](https://developers.facebook.com/tools/debug/)
- [opengraph.xyz](https://www.opengraph.xyz) — visualização rápida
- Preview no WhatsApp (compartilhar link e verificar card)

---

## G-THUMB — Thumbnails de Card

O thumbnail é sempre o `coverImage` do post. Não existe campo separado de thumbnail.

```
card thumbnail = coverImage  (nunca ogImage, nunca um campo separado)
```

### Dimensões por componente

| Componente | Aspect Ratio | Min Width |
|---|---|---|
| `sr-cutcard__media` | 16:10 | 400px |
| `sr-cutcard--tall .sr-cutcard__media` | auto (min-height 240px) | 400px |
| `sr-row3 .thumb` | 16:11 | 300px |
| `sr-hero .cover` | 21:9 | 800px |

### Regras

1. **Sem repetição**: nunca a mesma imagem em dois cards no mesmo viewport.
2. **Foco no centro**: assunto nos 40–60% centrais (horizontal e vertical).
3. **Overlay automático**: todos os thumbs recebem gradient-escuro. Imagens muito escuras ficam planas — prefira contraste médio.
4. **Hover zoom**: o sistema aplica `scale(1.06)` em hover. A imagem deve ter área extra nas bordas.
5. **onerror**: se a imagem falhar, o card cai para o noise pattern (correto, não quebra o layout).

---

## G-INLINE — Imagens no Corpo do Artigo

| Propriedade | Valor |
|---|---|
| Largura máxima | 760px (= --measure) |
| Formato | WEBP preferido |
| Tamanho máximo | 150KB |
| Loading | `lazy` |

### Estrutura obrigatória

```html
<figure>
  <Image
    src={dashboardSrc}
    alt="Dashboard mostrando 847 leads recebidos e 9 vendas atribuídas."
    width={760}
    height={427}
  />
  <figcaption>
    Dados reais de uma revenda de 35 carros/mês. Fonte: compilação interna Dimus, 2025.
  </figcaption>
</figure>
```

---

## Checklist Pré-Publicação

```
Cover image:
[ ] É uma foto/arte (NÃO um gráfico tipográfico)
[ ] Tema conectado ao conteúdo do post
[ ] Estética dark cinematic — sem fundo claro
[ ] Sem texto ou números sobrepostos
[ ] Largura ≥ 1200px, aspect ratio 16:9
[ ] Assunto nos 40–60% centrais (zoom e crop seguros)
[ ] Nome: /covers/<slug-do-post>.jpg ou <slug>-photo.jpg
[ ] Campo correto: coverImage: /covers/<slug>.jpg

OG image:
[ ] É um gráfico tipográfico 1200×630
[ ] Background escuro (#0b0a0d)
[ ] Nome: /og/og-<slug>.png
[ ] Campo correto: ogImage: /og/og-<slug>.png
[ ] Testada no WhatsApp preview

Thumbnails:
[ ] Sem imagem duplicada no mesmo viewport
[ ] Assunto principal nos 40–60% centrais

Inline:
[ ] Envoltas em <figure> + <figcaption>
[ ] Alt text ≤ 125 chars, descritivo
[ ] Fonte citada na caption para dados reais
```
