/**
 * blog.dimus.com.br — /tracker endpoint
 * POST: recebe evento de conversão do browser (form-first→WhatsApp), enriquece
 * com a sessão D1, hasheia PII e dispara para Meta CAPI (Graph v25.0).
 * Grava lead em D1 + magnet_download (biblioteca finita) e faz forward
 * fire-and-forget para o Supabase do blueprint (CRM compartilhado).
 *
 * Método KROB (herdado do dimus-usa, live-verified): event_id/event_time
 * passthrough do browser (dedup pixel↔CAPI), fbp/fbc/ip/ua raw, PII SHA-256,
 * action_source='website', external_id como array dedup (EMQ).
 *
 * Body esperado (de src/scripts/lead.ts):
 *   event_name='Lead', event_id=lead_ref, event_source_url, lead_ref, source='blog',
 *   nome, whatsapp, post_slug, cluster, magnet_slug,
 *   calc {valor,dias,acc} (opcional), user_data{fbp,fbc} (opcional).
 *
 * IMPORTANTE (CRM blueprint): a tabela `leads` tem CHECK em ig_data_source
 * (manychat_subscriber|form_submitted|scraped_bio). Lead de blog é form →
 * ig_data_source='form_submitted' + tags:['blog'] + source:'blog'
 * (a "tag blog" pedida vive em tags/source/custom_fields.market, NÃO no enum).
 * Forward só dispara com BLUEPRINT_SUPABASE_KEY setada → smoke local não toca o CRM.
 */

const ALLOW = [
  'https://blog.dimus.com.br',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

export async function onRequestPost(context) {
  const { request, env } = context;
  const reqOrigin = request.headers.get('origin') || '';
  const acao = ALLOW.includes(reqOrigin) ? reqOrigin : ALLOW[0];
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': acao },
  });

  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const {
    event_name: rawEventName,
    event_id: rawEventId, event_time,
    event_source_url: rawSourceUrl = '',
    user_data = {},
    lead_ref = '',
    source = 'blog',
    lead_origin = '', // origem canônica (ex.: blog-calc-estoque) → content_name
    nome = '', email = '', whatsapp = '',
    post_slug = '', cluster = '', magnet_slug = '',
    page_url = '',
    // atribuição (fallback quando não há sessão)
    utm_source = '', utm_medium = '', utm_campaign = '',
    utm_content = '', utm_term = '', ctwa_clid = '',
  } = body;

  const event_name = rawEventName || 'Lead';
  const event_id = rawEventId || lead_ref || crypto.randomUUID();
  const event_source_url = rawSourceUrl || page_url || request.headers.get('referer') || '';

  // ── Bot check ────────────────────────────────────────────────────────────
  const ua = request.headers.get('user-agent') || '';
  if (isBot(ua)) return json({ ok: true, skipped: 'bot' });

  const { deviceType, browserName, osName } = parseUA(ua);

  // ── Validação server-side (não confiar no client; anti-flood do CRM) ──────
  // Espelha src/scripts/lead.ts. Bloqueia ANTES de CAPI/D1/forward.
  if (event_name !== 'PageView') {
    const nomeOk = String(nome || user_data.fn || '').trim().length >= 2;
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || user_data.em || '').trim());
    const phoneDigits = String(whatsapp || user_data.ph || '').replace(/\D/g, '');
    const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 13;
    if (!nomeOk || !emailOk || !phoneOk) {
      return json({ error: 'invalid lead', nome: nomeOk, email: emailOk, whatsapp: phoneOk }, 422);
    }
  }

  // ── Geo edge CF ──────────────────────────────────────────────────────────
  const cf = request.cf || {};
  const cfCountry = cf.country || '';
  const cfCity    = cf.city    || '';

  // ── Cookies ──────────────────────────────────────────────────────────────
  const cookie = request.headers.get('cookie') || '';
  const getCookie = (n) => {
    const m = cookie.match(new RegExp('(?:^|;)\\s*' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  };
  const sessionId  = getCookie('_krob_sid') || '';
  const externalId = getCookie('_krob_eid') || '';

  const fbp = validateFb(user_data.fbp) || validateFb(getCookie('_fbp')) || '';
  const fbc = validateFb(user_data.fbc) || validateFb(getCookie('_fbc')) || '';
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';

  // ── Sessão p/ UTMs ───────────────────────────────────────────────────────
  let sessionData = {};
  if (env.DB && sessionId) {
    try {
      const row = await env.DB.prepare('SELECT * FROM sessions WHERE session_id = ?').bind(sessionId).first();
      if (row) sessionData = row;
    } catch (_) { /* noop */ }
  }

  // Sessão é a fonte de verdade; quando vazia, cai pro body.
  const utmSource   = sessionData.utm_source   || utm_source   || '';
  const utmMedium   = sessionData.utm_medium   || utm_medium   || '';
  const utmCampaign = sessionData.utm_campaign || utm_campaign || '';
  const utmContent  = sessionData.utm_content  || utm_content  || '';
  const utmTerm     = sessionData.utm_term     || utm_term     || '';
  const ctwaClid    = sessionData.ctwa_clid    || ctwa_clid    || '';

  // ── PII ──────────────────────────────────────────────────────────────────
  const fnRaw = user_data.fn || nome || '';
  const phRaw = user_data.ph || whatsapp || '';
  const waPhone = normalizePhone(phRaw);

  const hashedEm         = await sha256(user_data.em || email || '');
  const hashedFn         = await sha256(normalizeName(fnRaw));
  const hashedPh         = await sha256(waPhone);
  const hashedExternalId = await sha256(externalId);
  const hashedLeadRef    = lead_ref ? await sha256(lead_ref) : '';
  const hashedCountry    = cfCountry ? await sha256(normalizeGeo(cfCountry)) : '';
  const hashedCity       = cfCity    ? await sha256(normalizeGeo(cfCity))    : '';

  // LeadForm/LeadMiniForm → Lead (dedup com pixel)
  const metaEventName = (event_name === 'LeadForm' || event_name === 'LeadMiniForm') ? 'Lead' : event_name;

  // ── Meta CAPI user_data ──────────────────────────────────────────────────
  const metaUserData = { client_ip_address: clientIp, client_user_agent: ua };
  if (hashedEm) metaUserData.em = [hashedEm];
  if (hashedFn) metaUserData.fn = [hashedFn];
  if (hashedPh) metaUserData.ph = [hashedPh];
  // EMQ: external_id como array dedup (lead_ref + cookie estável)
  const externalIds = [...new Set([hashedLeadRef, hashedExternalId].filter(Boolean))];
  if (externalIds.length) metaUserData.external_id = externalIds;
  if (fbp) metaUserData.fbp = fbp;
  if (fbc) metaUserData.fbc = fbc;
  if (hashedCountry) metaUserData.country = [hashedCountry];
  if (hashedCity)    metaUserData.ct      = [hashedCity];

  // ── event_time sanitizado (ms→s, sem futuro, sem >7d-past) ───────────────
  let et = event_time || Math.floor(Date.now() / 1000);
  if (et > 1e12) et = Math.floor(et / 1000);
  const nowS = Math.floor(Date.now() / 1000);
  if (et > nowS) et = nowS;
  if (et < nowS - 7 * 86400 + 120) et = nowS - 7 * 86400 + 120;

  const metaEvent = {
    event_name: metaEventName,
    event_time: et,
    event_id,
    event_source_url: event_source_url || '',
    action_source: 'website',
    user_data: metaUserData,
  };
  // custom_data: simetria com o pixel + dimensões editoriais p/ segmentação.
  // content_name = origem canônica (igual ao Pixel) → relatório/audience sem divergência.
  metaEvent.custom_data = {
    content_name: lead_origin || source || 'blog',
    content_category: cluster || '',
    content_ids: magnet_slug ? [magnet_slug] : undefined,
  };

  const metaPayload = { data: [metaEvent] };
  if (env.META_TEST_EVENT_CODE) metaPayload.test_event_code = env.META_TEST_EVENT_CODE;

  // ── POST Meta Graph v25.0 ────────────────────────────────────────────────
  let metaStatus = 0, metaOk = 0, metaBody = '', metaPayloadSent = '';
  if (env.META_PIXEL_ID && env.META_ACCESS_TOKEN && event_name !== 'PageView') {
    const payloadStr = JSON.stringify(metaPayload);
    metaPayloadSent = payloadStr;
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v25.0/${env.META_PIXEL_ID}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + env.META_ACCESS_TOKEN,
          },
          body: payloadStr,
        }
      );
      metaStatus = resp.status;
      metaOk = resp.ok ? 1 : 0;
      metaBody = await resp.text();
    } catch (err) {
      metaBody = `Fetch error: ${err.message}`;
    }
  } else {
    metaBody = 'skipped: missing META creds or PageView';
  }

  // ── Grava lead em D1 ─────────────────────────────────────────────────────
  const nowSec = Math.floor(Date.now() / 1000);
  if (env.DB && event_name !== 'PageView') {
    context.waitUntil(
      env.DB.prepare(`
        INSERT INTO leads (
          session_id, lead_ref, event_id, event_time, event_name,
          lead_name, lead_phone, wa_phone,
          post_slug, cluster, magnet_slug,
          ip_address, user_agent, fbp, fbc,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, ctwa_clid,
          campaign_id, adset_id, ad_id, placement,
          page_url, meta_status_code, meta_response_ok, meta_response_body, meta_payload_sent,
          device_type, browser, os, country, city,
          created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(event_id) DO NOTHING
      `).bind(
        sessionId, lead_ref || event_id, event_id, et, event_name,
        nome || '', whatsapp || '', waPhone,
        post_slug, cluster, magnet_slug,
        clientIp, ua, fbp, fbc,
        utmSource, utmMedium, utmCampaign, utmContent, utmTerm, ctwaClid,
        sessionData.campaign_id || '', sessionData.adset_id || '',
        sessionData.ad_id || '', sessionData.placement || '',
        event_source_url || '',
        metaStatus, metaOk, metaBody.slice(0, 1000), metaPayloadSent.slice(0, 2000),
        deviceType, browserName, osName, cfCountry, cfCity,
        nowSec
      ).run().catch((e) => console.error('[d1-lead]', event_id, e && e.message))
    );

    // ── Biblioteca finita: 1 download por submit com magnet_slug ───────────
    if (magnet_slug) {
      context.waitUntil(
        env.DB.prepare(`
          INSERT INTO magnet_downloads (lead_ref, magnet_slug, post_slug, cluster, session_id, wa_phone, created_at)
          VALUES (?,?,?,?,?,?,?)
          ON CONFLICT(lead_ref) DO NOTHING
        `).bind(lead_ref || event_id, magnet_slug, post_slug, cluster, sessionId, waPhone, nowSec)
          .run().catch((e) => console.error('[d1-magnet]', magnet_slug, e && e.message))
      );
    }
  }

  // ── Forward fire-and-forget → Supabase blueprint (CRM compartilhado) ─────
  // Schema REAL: first_name/last_name/phone/segment/landing_page/custom_fields
  // jsonb/ig_data_source(CHECK)/tags. Só dispara com KEY setada (smoke não toca CRM).
  if (env.BLUEPRINT_SUPABASE_URL && env.BLUEPRINT_SUPABASE_KEY && event_name !== 'PageView' && (nome || whatsapp)) {
    const nameParts = (nome || '').trim().split(/\s+/).filter(Boolean);
    const phoneDigits = (whatsapp || '').replace(/\D/g, '');
    const realEmail = (email || user_data.em || '').trim();
    const supaLead = {
      email: realEmail
        ? realEmail
        : (phoneDigits ? `${phoneDigits}@wa.blog.dimus.com.br` : `${event_id}@blog.dimus.com.br`),
      first_name: nameParts.shift() || '',
      last_name: nameParts.join(' '),
      phone: whatsapp || '',
      segment: cluster || '',
      source: source || 'blog',
      status: 'new',
      // CHECK (manychat_subscriber|form_submitted|scraped_bio). blog = form.
      ig_data_source: 'form_submitted',
      tags: ['blog'],
      landing_page: event_source_url || page_url || '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
      custom_fields: {
        cluster: cluster || '',
        post_slug: post_slug || '',
        magnet_slug: magnet_slug || '',
        whatsapp: whatsapp || '',
        lead_ref: lead_ref || '',
        market: 'blog',
      },
    };
    const fwdUrl = `${env.BLUEPRINT_SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/leads?on_conflict=email`;
    context.waitUntil(
      fetch(fwdUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.BLUEPRINT_SUPABASE_KEY,
          Authorization: `Bearer ${env.BLUEPRINT_SUPABASE_KEY}`,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(supaLead),
      })
        .then(async (r) => {
          if (!r.ok) {
            const t = await r.text().catch(() => '');
            console.error('[blueprint-forward]', r.status, t.slice(0, 200));
          }
        })
        .catch((e) => console.error('[blueprint-forward] err', e.message))
    );
  }

  return json({
    ok: true,
    event_name,
    event_id,
    meta_status: metaStatus,
    meta_ok: metaOk === 1,
    meta_response: metaBody.slice(0, 200),
  });
}

export async function onRequestOptions(context) {
  const { request } = context;
  const reqOrigin = request.headers.get('origin') || '';
  const acao = ALLOW.includes(reqOrigin) ? reqOrigin : ALLOW[0];
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': acao,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sha256(value) {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeName(n) { return (n || '').trim().toLowerCase(); }

function normalizePhone(ph) {
  if (!ph) return '';
  // Mercado BR: o form coleta dígitos locais (DDD+9+8 = 10-11 dígitos).
  // Meta CAPI espera E.164 com DDI → prefixa 55 quando local e sem DDI.
  let d = ph.replace(/\D/g, '').replace(/^0+/, '');
  // 10-11 díg = número local (DDD+fone) → prefixa DDI 55. Checa por LENGTH, não
  // prefixo: DDD 55 (RS/Santa Maria) tem 11 díg e começaria com '55' por engano.
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d;
}

function validateFb(v) {
  if (!v) return '';
  const p = v.split('.');
  if (p.length < 4 || p[0] !== 'fb' || !/^\d+$/.test(p[1]) || !/^\d+$/.test(p[2]) || !p[3]) return '';
  return v;
}

function isBot(ua) {
  if (!ua) return false;
  // whatsapp deliberadamente excluído (in-app browser = tráfego real)
  return /facebookexternalhit|facebot|slackbot|twitterbot|googlebot|bingbot|crawl|spider|bot/i.test(ua);
}

function parseUA(ua) {
  if (!ua) return { deviceType: '', browserName: '', osName: '' };
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(ua);
  const deviceType = isMobile ? 'mobile' : 'desktop';

  let browserName = '';
  if (/Edg\//i.test(ua))               browserName = 'Edge';
  else if (/OPR\//i.test(ua))          browserName = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browserName = 'Samsung';
  else if (/Chrome\//i.test(ua))       browserName = 'Chrome';
  else if (/Firefox\//i.test(ua))      browserName = 'Firefox';
  else if (/Safari\//i.test(ua))       browserName = 'Safari';

  let osName = '';
  if (/Windows NT/i.test(ua))            osName = 'Windows';
  else if (/Android/i.test(ua))          osName = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) osName = 'iOS';
  else if (/Mac OS X/i.test(ua))         osName = 'macOS';
  else if (/Linux/i.test(ua))            osName = 'Linux';

  return { deviceType, browserName, osName };
}

function normalizeGeo(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
