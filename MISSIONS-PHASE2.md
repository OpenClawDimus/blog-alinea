# BLOG DIMUS — FASE 2 (pós go-live) — Missões/Sprints SDD
### 2026-06-24 · modo autônomo, validação por incremento, binário por item

> **Arquitetura de leads (DECISÃO travada):**
> - **GHL/Avantto = CRM source of truth** (onde se FALA com o lead de fato).
> - **Supabase (blueprint tllelzquwdfcjjlsurai) = camada obrigatória / source of truth de DADOS.**
> - **/admin (blog + blueprint) = camada de dashboard/análise** (lê, não é dono).
> - Fluxo alvo: form → /tracker → [D1 mirror + Meta CAPI + Supabase (dados) + **GHL (CRM)**] → WhatsApp.
> - Padrão de referência: tracking infofast↔Kommo (leadId real de volta). Análogo p/ GHL (contactId/opportunityId real).

---

## VALIDAÇÃO DE ENTENDIMENTO (cada item, como entendi)

1. **Smoke real Playwright** — submeter lead real no site live via Playwright, validar o caminho ponta-a-ponta e **provar com prova irrefutável** que o **Meta Lead (Pixel)** e o **CAPI** dispararam.
2. **Lead no GHL/Avantto + Supabase** — hoje só vai pro Supabase blueprint. Adicionar forward → **GHL** (CRM SoT) capturando **leadId/contactId REAL do GHL** + infos. Supabase continua obrigatório (dados). Admin = dashboard.
3. **Estudar infofast↔Kommo e aplicar análogo ao GHL** — replicar o padrão (forward + captura de ID real + erros conhecidos) trocando Kommo→GHL. Validar os DOIS casos com `TRACKING-NOTES.md` de cada (infofast e blog).
4. **Newsletter** — nova origem `blog-newsletter-*` (nomenclatura + origem corretas), registra lead em **GHL + Mautic + Resend** (Resend dispara o e-mail) + **Supabase obrigatório**.
5. **Loop WhatsApp CompleteRegistration** — webhook Evolution casa `[ID:ref]` da resposta → marca `confirmed_at`/`capi_confirmed_at` + dispara CompleteRegistration CAPI.
6. **Anti-abuso /tracker** — CF Rate Limiting por `cf-connecting-ip` + honeypot field.
7. **Provas Meta/CAPI** — registrar evidência irrefutável (request `facebook.com/tr` ev=Lead + `/tracker` meta_status 200 + Events Manager / Test Events).
8. **Registrar tudo no notes desta sessão** — aprendizados + evolução + histórico (contínuo, obrigatório).

---

## MISSÕES (cada uma com critério BINÁRIO)

### M1 — Smoke real + provas irrefutáveis Meta/CAPI  ◀ EXECUTAR JÁ
- Playwright CLI (.js): abre post live, preenche mini-form (nome+email+telefone SMOKE), captura network.
- **Binário:** (a) request a `facebook.com/tr` com `ev=Lead` capturado; (b) `/tracker` responde `meta_status=200`/`meta_ok=true`; (c) `[ID:ref]` segue convenção `blog-…`; (d) lead aparece no Supabase blueprint; (e) smoke DELETADO após prova.
- Out of scope: GHL (ainda não existe). Marcar lead como SMOKE p/ cleanup.

### M2 — GHL/Avantto forward (CRM source of truth)  ◀ ✅ DONE 2026-06-24 (tag blog-dimus/v0.9.0-ghl)
### M2.5 — Opportunity no pipeline BluePrint [Content]  ◀ ✅ DONE 2026-06-24 (tag blog-dimus/v1.0.0-opportunity)
### M5 — Loop WhatsApp CompleteRegistration  ◀ ✅ DONE 2026-06-24 (tag blog-dimus/v1.1.0-wa-webhook)
- Estudar `project_kommo_infofast` + `reference_blueprint_ghl` (location 5t9LTZfC12mnSsesCuoD, pipeline zTeBzW1qD2UxnqB8aBQ6, GSM dimus-ghl-pit-token).
- Adicionar em `tracker.js`: forward → GHL (criar/upsert contact + opportunity no pipeline BluePrint), capturar **contactId/opportunityId REAL**, gravar em D1 (`ghl_contact_id`) + Supabase.
- **Binário:** lead real cria contato no GHL, retorna contactId, persistido em D1 + Supabase; admin mostra ghl_contact_id. Smoke valida + cleanup.
- Migration: coluna `ghl_contact_id` em leads.

### M3 — Supabase como camada obrigatória formalizada
- Garantir: todo lead (form, gate, newsletter) grava no Supabase blueprint SEMPRE (dados), GHL como CRM, admin lê. Documentar contrato.
- **Binário:** os 3 sinks (D1, Supabase, GHL) gravam o mesmo lead com IDs cruzados (lead_ref + ghl_contact_id). Sem lead órfão.

### M4 — Newsletter (origem própria)
- Componente `NewsletterForm` (origem `blog-newsletter-geral`), captura nome+email (telefone opcional).
- Forward: GHL (tag newsletter) + Mautic (segmento) + Resend (dispara welcome/double opt-in) + Supabase obrigatório.
- **Binário:** signup real → contato GHL + contato Mautic + e-mail Resend disparado + linha Supabase; tudo com `lead_origin=blog-newsletter-geral`. Gate de nomenclatura passa. email-link-gate nos e-mails.

### M5 — Loop WhatsApp CompleteRegistration
- Endpoint `functions/wa-webhook.js` (Evolution inbound, gsm dimus-blueprint-evolution-api-key). Casa `[ID:ref]` da 1ª resposta do lead → `UPDATE leads SET confirmed_at` + CAPI CompleteRegistration (mesmo event_id base).
- **Binário:** mensagem de teste com `[ID]` conhecido → confirmed_at gravado + CompleteRegistration meta_status 200.

### M6 — Anti-abuso /tracker
- CF Rate Limiting ruleset por cf-connecting-ip (N/min) + honeypot field oculto no form (preenchido = bot → descarta).
- **Binário:** honeypot preenchido → 200 silencioso sem gravar/forward; rate-limit ativo (ruleset criado via API).

### M7 — Validação cruzada infofast↔blog + TRACKING-NOTES
- Atualizar `TRACKING-NOTES.md` do infofast e do blog com o padrão GHL e os aprendizados.
- **Binário:** ambos os notes documentam o padrão + erros; analogia Kommo→GHL registrada.

### M8 — Registro contínuo (notes desta sessão) — OBRIGATÓRIO sempre
- Cada incremento → SESSION-NOTES.md + este MISSIONS + mirror repo.

---

## ORDEM SUGERIDA (paralelização)
M1 (já) → M2 (GHL, núcleo) ∥ M5 (webhook) → M3 (formalizar) → M4 (newsletter) → M6 (anti-abuso) → M7 (notes cruzado). M8 contínuo.
Cada missão termina com loop adversarial (full audit + QA + red team + devil's advocate) — padrão build-audit-loop.

---

## M2 — EXECUÇÃO + PROVA (2026-06-24) ✅

**Verified: YES.** Lead real (server-side + browser) cria contato no GHL, retorna contactId REAL, persistido nos 3 sinks com ID cruzado.

### O que foi feito
- `functions/tracker.js`: upsert de contato no GHL (`POST services.leadconnectorhq.com/contacts/upsert`, `Version: 2021-07-28`) ANTES do INSERT D1 — `await` síncrono (precisa do id p/ cruzar). Gated por `GHL_TOKEN` (smoke local não toca CRM). Tags `['blog']` + source + customFields (lead_ref/post_slug/cluster/magnet_slug/utm_*). Falha em GHL NÃO bloqueia D1/Supabase/CAPI (try/catch + console.error).
- `ghl_contact_id` capturado de `contact.id` e gravado: (a) coluna nova no INSERT D1 `leads`, (b) `custom_fields.ghl_contact_id` do forward Supabase.
- `migrations/0004_ghl.sql`: `ALTER TABLE leads ADD COLUMN ghl_contact_id TEXT DEFAULT ''` — aplicada no D1 remoto (changed_db:true).
- Secrets CF Pages: `GHL_TOKEN` (gsm dimus-ghl-pit-token), `GHL_LOCATION_ID=5t9LTZfC12mnSsesCuoD`, `GHL_PIPELINE_ID=zTeBzW1qD2UxnqB8aBQ6` (reservado p/ opportunities futuras). Deploy + redeploy p/ bindar.

### Decisão de escopo (red-team)
- M2 faz SÓ upsert de contato — **NÃO cria opportunity** no board do funil (evita poluir o pipeline real do BluePrint). `GHL_PIPELINE_ID` fica setado p/ uso futuro (M3+).

### Prova irrefutável
- **contactId REAL: `E0wqtF4bttIHykbCbAIS`** (location Guilherme Ribeiro `5t9LTZfC12mnSsesCuoD`, pipeline "BluePrint [Content]").
- `/tracker` prod 200 (2 smokes): CAPI `events_received:1` — fbtrace `AaGvgYeNxHUMtL2fT6Hql44` (server) + `A0H3MoRHhDglnpC6S7MJAIH` (browser, `navigator.webdriver=false`).
- GHL GET por email → contato com phone `+5567999991111` (DDI 55 ok), tags `[blog]`, source `blog`.
- ID cruzado idêntico nos 3: GHL `E0wqtF4bttIHykbCbAIS` = D1.ghl_contact_id = Supabase.custom_fields.ghl_contact_id.
- Screenshot: `/tmp/ghl-lead.png` (prova de API renderizada).

### Bloqueios honestos
- **GHL UI screenshot**: sem credenciais de login no GSM (só PIT token de API) → tela de login do GHL. NÃO tentei login autônomo. Prova = API GET + PNG renderizado.
- **Meta Test Events screenshot**: Events Manager redireciona p/ login Meta Business (sem sessão, 2FA provável). NÃO tentei login autônomo. Prova alternativa = CAPI 200 + events_received:1 + fbtrace_ids reais.

### Aprendizados / erros GHL
- `contacts/upsert` deduplica por email → mesmo email em 2 smokes = 1 só contato (id estável). Bom p/ cleanup.
- **GHL DELETE tem lag de índice de busca**: DELETE→200 `succeeded:true`, mas o lookup por email ainda retorna 1 por ~10-15s. Fonte autoritativa = GET por ID (retorna 400 "Contact not found" imediato). Re-check por email após ~12s → 0.
- Telefone: tracker normaliza p/ E.164 (`5567999991111`); no GHL enviei `+` + waPhone → `+5567999991111` aceito.
- `wa_phone` no D1 é sem `+`; GHL guarda com `+`.

### Cleanup (OBRIGATÓRIO — confirmado 0 nos 3)
- GHL: DELETE contact `E0wqtF4bttIHykbCbAIS` → GET by id 400 (not found); email search 0.
- Supabase: `DELETE FROM leads WHERE email='smoke-ghl@dimus.com.br'` → COUNT 0.
- D1: `DELETE FROM leads WHERE lead_name='SMOKE GHL'` + magnet_downloads do smoke → COUNT 0.

### Arquivos alterados
- `/Users/guilhermeribeiro/Downloads/blog-dimus/functions/tracker.js`
- `/Users/guilhermeribeiro/Downloads/blog-dimus/migrations/0004_ghl.sql` (novo)
- `/Users/guilhermeribeiro/Downloads/blog-dimus/wrangler.toml`

Tag: `blog-dimus/v0.9.0-ghl` · commit `7f6d1ab`.
