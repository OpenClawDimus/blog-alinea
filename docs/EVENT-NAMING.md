# Convenção de Nomenclatura de Eventos — blog.dimus.com.br

> Objetivo: ler o nome de um lead/evento e **saber instantaneamente de onde veio**.
> Princípio: eventos de plataforma seguem o **padrão** (Meta `Lead`, GA4 `generate_lead`)
> para não perder otimização/objetivo; a **origem legível** vive nos rótulos.

## Origem canônica (`idTag`)

```
<propriedade>-<superfície>-<cluster>
```

| Parte | Valores | Significado |
|---|---|---|
| propriedade | `blog` | qual site Dimus (vs `usa`, `blueprint`, `infofast`) |
| superfície | `calc` · `quiz` · `post` | onde na página o lead nasceu |
| cluster | `estoque` · `atribuicao` · `portal` | tema/dor editorial |

## Mapa atual (fonte de verdade)

| Superfície | `idTag` (origem) | magnet_slug | post |
|---|---|---|---|
| Calculadora Carro Parado | `blog-calc-estoque` | `calc-carro-parado` | carro-parado-quanto-custa |
| Calculadora CAC | `blog-calc-atribuicao` | `calc-cac-carro-vendido` | lead-fantasma-quanto-custa |
| Quiz Refém do Portal | `blog-quiz-portal` | `quiz-refem-portal` | refem-do-portal |
| LeadForm no post (gate) | `blog-post-estoque` | — | carro-parado-quanto-custa |
| LeadForm no post (gate) | `blog-post-atribuicao` | — | lead-fantasma-quanto-custa |
| LeadForm no post (gate) | `blog-post-portal` | — | refem-do-portal |
| Fallback | `blog-lead` | — | — |

## `lead_ref` / `event_id`

```
<origem>-<base36(tempo)>-<rand6>
ex.: blog-calc-estoque-lxab12-7f3a9k
```

- **prefixo legível** = origem canônica (parse: tudo antes dos 2 últimos grupos `-`).
- **sufixo único** = `base36(Date.now())` (ordenável) + 6 chars `crypto.getRandomValues` (anti-colisão; substitui o antigo `Date.now().slice(-5)`).
- É o MESMO valor em: `[ID:ref]` no WhatsApp · `event_id` (dedup Pixel↔CAPI) · `lead_ref` em D1 · `custom_fields.lead_ref` no CRM blueprint.

## Onde a origem aparece (mesmo valor em todas)

| Camada | Campo | Valor |
|---|---|---|
| GA4 | evento | `generate_lead` (padrão, não renomear) |
| GA4 | param `lead_origin` | `blog-calc-estoque` |
| GA4 | param `lead_source` | `blog` |
| Meta Pixel | evento | `Lead` (padrão) |
| Meta Pixel | `content_name` | `blog-calc-estoque` |
| Meta CAPI | evento | `Lead` (padrão) |
| Meta CAPI | `custom_data.content_name` | `blog-calc-estoque` (idêntico ao Pixel → sem divergência de relatório) |
| Meta | `content_category` | cluster (`estoque-giro`/`atribuicao`/`portal`) |
| Meta | `content_ids` | `[magnet_slug]` |
| WhatsApp/D1/CRM | `lead_ref` | `blog-calc-estoque-…` |

## Regras

1. **Nunca** renomear o evento de plataforma (`Lead`/`generate_lead`) por origem — vira custom event e perde otimização Meta / objetivo GA4.
2. Novo placement → novo `idTag` seguindo `<propriedade>-<superfície>-<cluster>` + linha nesta tabela.
3. `content_name` (Pixel) === `content_name` (CAPI) === `idTag`. Sempre.
4. Cluster do `content_category` usa o slug editorial completo; o `idTag` usa a forma curta (`estoque`).

## Superfícies e clusters (atualizado)

- **superfícies**: `calc` · `quiz` · `post` · `gate` (bloco DimusHelp) · `lead` (fallback `blog-lead`)
- **clusters**: `estoque` · `atribuicao` · `portal` · `atendimento` · `geral`
- Origem do gate DimusHelp: `blog-gate-<cluster>` (ex.: `blog-gate-estoque`); `lead_ref` = `blog-gate-<cluster>-<post>`.

## GATE OBRIGATÓRIO (enforcement, não-opcional)

A convenção é **enforçada**, não confiada à disciplina:

- **Fonte de verdade**: `event-origins.json` (regex + superfícies + clusters + tokens proibidos).
- **Gate**: `scripts/gate-event-naming.mjs` — valida todo `idTag="…"`, o prefixo do ref do DimusHelp, e proíbe tokens legados (`CALC-`/`GATE-`/…). `npm run gate:naming`.
- **Hook de build**: integração `event-naming-gate` no `astro.config.ts` roda o gate em `astro:build:start` → **build (e deploy) BLOQUEADO** se qualquer origem fugir da convenção. Provado: build exit 1 em violação, exit 0 limpo.

Novo placement ⇒ `idTag` na convenção + (se novo cluster/superfície) atualizar `event-origins.json`. Sem isso, não buildа.
