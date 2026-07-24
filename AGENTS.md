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
9. Image SEO          → coverImage filename descritivo + alt text + OG 1200x630 padrão Dimus
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
