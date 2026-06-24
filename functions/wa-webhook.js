/**
 * blog.dimus.com.br — /wa-webhook endpoint
 * Recebe webhook da Evolution API (WhatsApp inbound). Quando o lead responde
 * à mensagem inicial que contém [ID:lead_ref], extrai o ref, atualiza
 * leads.confirmed_at no D1 e dispara CAPI CompleteRegistration (dedup: usa
 * mesmo event_id base derivado do lead_ref para cross-referência com o Lead).
 *
 * Segurança: Evolution configura o webhook com token na query string:
 *   https://blog.dimus.com.br/wa-webhook?token=WA_WEBHOOK_SECRET
 *
 * Formato Evolution inbound (messages.upsert):
 * {
 *   event: "messages.upsert",
 *   instance: "...",
 *   data: {
 *     key: { remoteJid: "5567999999@s.whatsapp.net", fromMe: false, id: "..." },
 *     message: {
 *       conversation: "texto direto",
 *       extendedTextMessage: { text: "texto com context", contextInfo: { quotedMessage: { conversation: "..." } } }
 *     },
 *     messageTimestamp: 1234567890
 *   }
 * }
 *
 * Extração de [ID:ref]: checa em ordem
 *  1. conversation (direct)
 *  2. extendedTextMessage.text
 *  3. contextInfo.quotedMessage.conversation (quote-reply da nossa msg original)
 *  4. contextInfo.quotedMessage.extendedTextMessage.text
 *
 * CAPI CompleteRegistration usa PII do D1 (wa_phone, fbp, fbc, country, city,
 * lead_ref como external_id). event_id = "cr-" + lead_ref (cross-referenciável).
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── Validação do token de segurança ─────────────────────────────────────
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (!env.WA_WEBHOOK_SECRET || token !== env.WA_WEBHOOK_SECRET) {
    // Retorna 200 silencioso para não revelar existência do endpoint
    return new Response('ok', { status: 200 });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response('ok', { status: 200 });
  }

  // ── Apenas messages.upsert de mensagens recebidas (fromMe: false) ─────────
  const evt = body?.event || '';
  if (evt !== 'messages.upsert') return new Response('ok', { status: 200 });

  const data = body?.data || {};
  const key = data?.key || {};
  if (key.fromMe) return new Response('ok', { status: 200 });

  // ── Extrai [ID:lead_ref] do payload ──────────────────────────────────────
  const msg = data?.message || {};
  const textCandidates = [
    msg.conversation,
    msg.extendedTextMessage?.text,
    msg.extendedTextMessage?.contextInfo?.quotedMessage?.conversation,
    msg.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text,
    msg.imageMessage?.caption,
  ].filter(Boolean);

  let leadRef = '';
  for (const candidate of textCandidates) {
    const m = candidate.match(/\[ID:([^\]]+)\]/);
    if (m) { leadRef = m[1].trim(); break; }
  }

  if (!leadRef) return new Response('ok', { status: 200 });

  // ── Busca lead no D1 ─────────────────────────────────────────────────────
  if (!env.DB) return new Response('ok', { status: 200 });

  let lead;
  try {
    lead = await env.DB
      .prepare('SELECT * FROM leads WHERE lead_ref = ? LIMIT 1')
      .bind(leadRef)
      .first();
  } catch (e) {
    console.error('[wa-webhook] d1-lookup', e && e.message);
    return new Response('ok', { status: 200 });
  }

  if (!lead) {
    console.error('[wa-webhook] lead not found', leadRef);
    return new Response('ok', { status: 200 });
  }

  // Já confirmado anteriormente → idempotente (não re-dispara CAPI)
  if (lead.confirmed_at) {
    console.log('[wa-webhook] already confirmed', leadRef);
    return new Response('ok', { status: 200 });
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // ── UPDATE confirmed_at no D1 ─────────────────────────────────────────────
  context.waitUntil(
    env.DB.prepare('UPDATE leads SET confirmed_at = ? WHERE lead_ref = ?')
      .bind(nowSec, leadRef)
      .run()
      .catch(e => console.error('[wa-webhook] d1-update', e && e.message))
  );

  // ── CAPI CompleteRegistration ─────────────────────────────────────────────
  if (env.META_PIXEL_ID && env.META_ACCESS_TOKEN) {
    const eventId = 'cr-' + leadRef;

    // Hash PII do lead (phone + lead_ref como external_id)
    const [hashedPh, hashedExt] = await Promise.all([
      sha256(lead.wa_phone || ''),
      sha256(leadRef),
    ]);
    const hashedCountry = lead.country ? await sha256(normalizeGeo(lead.country)) : '';
    const hashedCity    = lead.city    ? await sha256(normalizeGeo(lead.city))    : '';

    const userData = {
      client_user_agent: lead.user_agent || '',
      client_ip_address: lead.ip_address || '',
    };
    if (hashedPh)  userData.ph = [hashedPh];
    if (hashedExt) userData.external_id = [hashedExt];
    if (lead.fbp)  userData.fbp = lead.fbp;
    if (lead.fbc)  userData.fbc = lead.fbc;
    if (hashedCountry) userData.country = [hashedCountry];
    if (hashedCity)    userData.ct      = [hashedCity];

    const metaEvent = {
      event_name: 'CompleteRegistration',
      event_time: nowSec,
      event_id: eventId,
      action_source: 'website',
      event_source_url: lead.page_url || '',
      user_data: userData,
      custom_data: {
        content_name: lead.lead_ref ? lead.lead_ref.split('-').slice(0, 3).join('-') : 'blog',
        status: 'confirmed_whatsapp',
      },
    };

    const capiPayload = { data: [metaEvent] };
    if (env.META_TEST_EVENT_CODE) capiPayload.test_event_code = env.META_TEST_EVENT_CODE;

    context.waitUntil(
      fetch(`https://graph.facebook.com/v25.0/${env.META_PIXEL_ID}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + env.META_ACCESS_TOKEN,
        },
        body: JSON.stringify(capiPayload),
      })
        .then(async (r) => {
          const text = await r.text().catch(() => '');
          if (r.ok) {
            // UPDATE capi_confirmed_at
            return env.DB.prepare('UPDATE leads SET capi_confirmed_at = ? WHERE lead_ref = ?')
              .bind(nowSec, leadRef)
              .run();
          } else {
            console.error('[wa-webhook] capi', r.status, text.slice(0, 200));
          }
        })
        .catch(e => console.error('[wa-webhook] capi-err', e && e.message))
    );
  }

  console.log('[wa-webhook] confirmed', leadRef, 'via', key.remoteJid);
  return new Response('ok', { status: 200 });
}

// Evolution envia GET para validar o endpoint durante setup
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (!env.WA_WEBHOOK_SECRET || token !== env.WA_WEBHOOK_SECRET) {
    return new Response('ok', { status: 200 });
  }
  return new Response('ok', { status: 200 });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sha256(value) {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeGeo(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
