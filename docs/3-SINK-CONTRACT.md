# Contrato 3-Sink — blog.dimus.com.br
### Versão 1.0 · 2026-06-24

> Qualquer lead gerado por qualquer superfície do blog **deve** gravitar pelos 3 sinks abaixo.
> Sem exceção. Sem lead órfão. Sem divergência de IDs entre sinks.

---

## Arquitetura

```
Browser
  └─ POST /tracker
       ├─ Meta CAPI (Graph v25.0)          [sinal de conversão — não é sink de lead]
       ├─ D1 blog-tracking (ENAM)          [mirror operacional / analytics local]
       ├─ GHL/Avantto (CRM SoT)            [quem fala com o lead]
       └─ Supabase blueprint (dados SoT)   [fonte de verdade de dados / dashboard]
```

---

## Sink 1 — D1 (blog-tracking)

| Campo | Valor |
|---|---|
| Database ID | `71f19cdf-555b-46f3-9b13-b81eb1238e96` |
| Region | ENAM |
| Binding | `DB` (wrangler.toml) |
| Tabela | `leads` |
| PK / dedup | `event_id` (ON CONFLICT DO NOTHING) |

**Colunas de IDs cruzados:**
- `lead_ref` — `<origem>-<base36>-<rand6>` (canônico, legível)
- `event_id` — dedup pixel↔CAPI
- `ghl_contact_id` — retornado pelo GHL após upsert
- `ghl_opportunity_id` — retornado após criação da opportunity

**Papel:** Mirror de analytics. Lido pelo `/admin` do blog e pelo WhatsApp webhook (`wa-webhook.js`). Não é a fonte de verdade — é o espelho local que sobrevive sem internet para o Supabase.

**Gate:** `env.DB` presente. Falha silenciosa (waitUntil + console.error), nunca bloqueia CAPI/GHL/Supabase.

---

## Sink 2 — GHL/Avantto (CRM SoT)

| Campo | Valor |
|---|---|
| Location ID | `5t9LTZfC12mnSsesCuoD` (`GHL_LOCATION_ID`) |
| Pipeline | BluePrint [Content] — `zTeBzW1qD2UxnqB8aBQ6` (`GHL_PIPELINE_ID`) |
| Estágio inicial | Novo Lead (Nurturing) — `1019a23c-4b2d-430d-83bd-2caebcb02aa4` |
| Auth | PIT token `GHL_TOKEN` (gsm: `dimus-ghl-pit-token`) |
| Endpoint upsert | `POST services.leadconnectorhq.com/contacts/upsert` |
| Endpoint opp | `POST services.leadconnectorhq.com/opportunities/` |

**Retornos capturados:**
- `contact.id` → `ghl_contact_id` (gravado em D1 + Supabase custom_fields)
- `opportunity.id` → `ghl_opportunity_id` (gravado em D1)

**Papel:** CRM source of truth — onde o time se comunica com o lead. Tags: `['blog']`, source: `'blog'`.

**Gate:** `env.GHL_TOKEN && env.GHL_LOCATION_ID`. Execução **síncrona** (await) — ID necessário antes dos writes de D1/Supabase. Falha não bloqueia os outros sinks.

**Gotchas:**
- `contacts/upsert` deduplica por email → mesmo email = mesmo contato (id estável).
- `400 "Can not create duplicate opportunity"` → opportunity já existe, `meta.existingId` contém o ID.
- DELETE tem lag de índice (~10-15s); GET por ID é autoritativo (400 = not found imediato).

---

## Sink 3 — Supabase blueprint (dados SoT)

| Campo | Valor |
|---|---|
| Project | `tllelzquwdfcjjlsurai` |
| URL | `https://tllelzquwdfcjjlsurai.supabase.co` (`BLUEPRINT_SUPABASE_URL`) |
| Auth | service_role key (`BLUEPRINT_SUPABASE_KEY`, gsm: `dimus-blueprint-supabase-service-role`) |
| Tabela | `leads` (CRM compartilhado — blueprint.dimus.com.br/admin) |

**Campos mapeados:**
- `ig_data_source` = `'form_submitted'` (CHECK constraint — único valor válido para blog)
- `tags` = `['blog']`
- `source` = `'blog'`
- `custom_fields.lead_ref` = lead_ref
- `custom_fields.ghl_contact_id` = ghlContactId (ID cruzado)
- `custom_fields.ghl_opportunity_id` = ghlOpportunityId

**Papel:** Fonte de verdade de dados. Lida pelo admin do blueprint (`blueprint.dimus.com.br/admin`) e por workflows de análise. Nunca recebe leads de smoke/teste.

**Gate:** `env.BLUEPRINT_SUPABASE_URL && env.BLUEPRINT_SUPABASE_KEY`. Fire-and-forget (waitUntil). Falha não bloqueia resposta ao browser.

**Regra crítica:** NUNCA injetar lead de teste aqui. Smoke tests deletam imediatamente após prova.

---

## Meta CAPI (não é sink de lead)

Dispara antes dos sinks. Envia sinal de conversão para o dataset `998136448049534`.
Eventos: `Lead` (form), `CompleteRegistration` (via wa-webhook após reply no WhatsApp).
Falha não bloqueia nenhum sink.

---

## Invariantes obrigatórias

| # | Invariante |
|---|---|
| I1 | Todo lead com `event_name='Lead'` grava nos 3 sinks |
| I2 | `lead_ref` é idêntico nos 3 sinks (PK de negócio) |
| I3 | `ghl_contact_id` aparece em D1.leads + Supabase.custom_fields |
| I4 | Falha em qualquer sink não bloqueia os outros (try/catch independentes) |
| I5 | Nenhum lead de smoke/teste permanece em Supabase ou GHL após validação |
| I6 | `ig_data_source='form_submitted'` em todo lead de blog no Supabase |
| I7 | `event_id` único no D1 (ON CONFLICT DO NOTHING → dedup pixel↔CAPI) |

---

## Verificação de conformidade (smoke binário)

```bash
# Após smoke real:
# D1:       SELECT lead_ref, ghl_contact_id, ghl_opportunity_id FROM leads WHERE lead_ref='<ref>'
# GHL:      GET /contacts/{ghl_contact_id} → confirm email + tags=['blog']
# Supabase: SELECT custom_fields FROM leads WHERE custom_fields->>'lead_ref'='<ref>'
# Cruzamento: os 3 devem retornar o mesmo lead_ref e ghl_contact_id
```

---

## Superfícies que devem respeitar este contrato

| Superfície | Origem (`lead_origin`) | Status |
|---|---|---|
| Calculadora carro parado | `blog-calc-estoque` | ✅ ativo |
| Calculadora CAC | `blog-calc-cac` | ✅ ativo |
| Quiz Refém do Portal | `blog-quiz-portal` | ✅ ativo |
| Newsletter (M4) | `blog-newsletter-geral` | 🔜 próximo |
| Posts (LeadForm inline) | `blog-post-<cluster>` | ✅ ativo |
