## ⛔ PADRÃO SEO DE SITE — LEIA ANTES DE QUALQUER MUDANÇA (corrigido 2026-07-28)

### Title tag — padrão OBRIGATÓRIO em todos os posts:
```
[Título do post com keyword principal] | Blog Monumental
```
Implementado em `src/pages/posts/[...slug]/index.astro`:
```js
title={`${title} | Blog Monumental`}
```

### Site title e description (astro-paper.config.ts):
```js
title: "Blog Monumental — Marketing Automotivo"
description: "Blog de marketing automotivo para revendas de seminovos e concessionárias. Google Ads, Meta Ads, WhatsApp, CRM e como medir ROI real em carro vendido."
```

**Regras invioláveis:**
- `title` do site SEMPRE com keyword de nicho após `—`
- `description` do site com keywords: "marketing automotivo", "revendas de seminovos", "concessionárias"
- `description` de cada post: benefício concreto + dado numérico, 130–160 chars
- NUNCA editar `astro-paper.config.ts` ou `Layout.astro` sem garantir que o padrão se mantém
- NUNCA remover o sufixo `| Blog Monumental` dos posts

### Metadados estruturais — PADRÃO OBRIGATÓRIO (corrigido 2026-07-28)

- **`og:type`**: posts = `"article"` (via `ogType` prop em PostLayout); demais = `"website"`
- **`article:section`**: todo post DEVE ter `<meta property="article:section" content="Marketing Automotivo">` — já injetado em PostLayout automaticamente via prop `tags`
- **`article:tag`**: uma `<meta property="article:tag">` por tag do post — gerado automaticamente pelo PostLayout
- **`rel="prev"`/`rel="next"`**: páginas paginadas (`/posts/2`, `/posts/3`...) DEVEM ter esses links — já implementado em `[...page].astro`
- **Cover image**: NUNCA usar `alt=""` ou `aria-hidden="true"` na cover do post — usar `alt={title}` para Google Images
- **Home page**: DEVE ter `WebPage` no `@graph` do JSON-LD — já injetado via `<Fragment slot="head">` em `index.astro`

### Transporte para novos blogs (clientes)

Este repositório É o template. Para qualquer novo blog, **editar APENAS `astro-paper.config.ts`**:

```ts
site: {
  url: "https://blog.CLIENTE.com.br/",
  title: "Blog CLIENTE — Nicho Principal",
  description: "...",
  author: "Nome da Empresa",
  profile: "https://CLIENTE.com.br",
  blogShortTitle: "Blog CLIENTE",        // sufixo do <title> dos posts
  ga4Id: "G-XXXXXXXX",                  // GA4 do cliente
  metaPixelId: "XXXXXXXXX",             // Pixel Meta do cliente (ou via env)
  whatsappNumber: "55XXXXXXXXXXX",      // número com DDD
  whatsappMessage: "Mensagem padrão",
  articleSection: "Nicho do cliente",   // ex: "Decoração", "Saúde"
  organization: {
    name: "Nome da Empresa",
    logo: "logo-cliente.png",           // arquivo em /public
    sameAs: ["https://instagram.com/cliente", ...],
  },
  authorPerson: {
    name: "Nome do Autor",
    url: "https://autorpessoal.com",
    jobTitle: "Fundador",
    avatar: "foto-autor.png",           // arquivo em /public
    sameAs: ["https://instagram.com/autor"],
    knowsAbout: ["tema1", "tema2"],
  },
}
```

Tudo mais (Layout, PostLayout, schemas, hooks, pipeline) chega junto automaticamente via fork.
NUNCA editar os arquivos de layout para mudar dados de cliente — sempre via config.

---

## ⛔ GATE INVIOLÁVEL — Todo novo post .mdx EXIGE pipeline completo

**PROIBIDO commitar qualquer post sem que `.post-audits/<slug>.audit.json` exista e esteja passando.**

O pré-commit hook (`scripts/gate-post-pipeline.mjs`) BLOQUEIA o commit automaticamente.

### Pipeline canônico obrigatório (ordem importa):

```
1. DataForSEO SERP    → volume + intent + dificuldade + SERP features (location_code:2076, lang:pt)
2. Intent check       → 0% contaminação (ex: "veículo apreendido" num post de gestão de pátio)
3. MiroFish ICP       → ≥3/5 personas automotivas validam o tópico
4. Deduplication      → tópico E ângulo diferentes de todos os posts existentes
5. SEO agent          → H1/H2/H3, keyword density, entidades, internal links (≥3), image alt, meta
6. AEO agent          → AnswerCapsule, FAQ PAA-aligned, featured snippet candidato
7. GEO agent          → citabilidade LLM, dados com fonte, definições explícitas
8. EEAT check         → Experience (dados reais), Expertise (autor), Authority (fontes), Trust
9. Image SEO          → coverImage filename descritivo + alt text + OG 1200x630 padrão Monumental
10. LLM Council       → 5 advisors red team + peer review + chairman (bloqueante se factual error)
11. gate-covers.mjs   → 0 violations
12. score-posts.mjs   → composite ≥ 95, GEO ≥ 90, AEO = 100
```

### Como rodar (sessão limpa):
```bash
/blog-post-pipeline <slug>   # skill que orquestra todos os 12 passos
```

### O que NÃO substitui o pipeline:
- `score-posts.mjs` sozinho = verificação estrutural, NÃO validação SEO real
- Escrever post de cabeça sem DataForSEO = não conta

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
