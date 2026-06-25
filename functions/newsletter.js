/**
 * blog.dimus.com.br — /newsletter endpoint
 * POST: inscrição de newsletter (nome + email, sem WhatsApp obrigatório).
 * Forward: GHL (tags newsletter+blog) + Mautic (segmento blog-newsletter ID 12)
 *          + Resend (welcome email) + Supabase blueprint (dados SoT).
 *
 * Secrets necessários (CF Pages):
 *   MAUTIC_URL            = https://mkt.dimus.com.br
 *   MAUTIC_CLIENT_ID      = gsm dimus-mautic-client-id
 *   MAUTIC_CLIENT_SECRET  = gsm dimus-mautic-client-secret
 *   RESEND_API_KEY        = gsm dimus-resend-api-key
 *   GHL_TOKEN / GHL_LOCATION_ID (já setados p/ tracker.js)
 *   BLUEPRINT_SUPABASE_URL / BLUEPRINT_SUPABASE_KEY (já setados)
 */

const ALLOW = [
  'https://blog.dimus.com.br',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const MAUTIC_NEWSLETTER_SEGMENT_ID = 12; // blog-newsletter (criado 2026-06-25)

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

  // ── Honeypot ─────────────────────────────────────────────────────────────
  if (body.website) return json({ ok: true });

  const { nome = '', email = '', website: _hp = '' } = body;

  // ── Validação ─────────────────────────────────────────────────────────────
  if (String(nome).trim().length < 2) return json({ error: 'nome inválido' }, 422);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) return json({ error: 'email inválido' }, 422);

  const nomeTrimmed = String(nome).trim();
  const emailTrimmed = String(email).trim().toLowerCase();
  const nameParts = nomeTrimmed.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  // ── Mautic OAuth2 token ────────────────────────────────────────────────────
  let mauticContactId = '';
  if (env.MAUTIC_URL && env.MAUTIC_CLIENT_ID && env.MAUTIC_CLIENT_SECRET) {
    try {
      const tokenResp = await fetch(`${env.MAUTIC_URL}/oauth/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.MAUTIC_CLIENT_ID)}&client_secret=${encodeURIComponent(env.MAUTIC_CLIENT_SECRET)}`,
      });
      if (tokenResp.ok) {
        const { access_token: mToken } = await tokenResp.json().catch(() => ({}));
        if (mToken) {
          // Upsert contato no Mautic
          const mContactResp = await fetch(`${env.MAUTIC_URL}/api/contacts/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + mToken },
            body: JSON.stringify({
              firstname: firstName,
              lastname: lastName,
              email: emailTrimmed,
              tags: ['blog-newsletter'],
            }),
          });
          if (mContactResp.ok) {
            const mData = await mContactResp.json().catch(() => ({}));
            mauticContactId = String(mData?.contact?.id || '');
          }
          // Adiciona ao segmento blog-newsletter (ID 12) — API exige {ids:[n]}
          if (mauticContactId) {
            await fetch(`${env.MAUTIC_URL}/api/segments/${MAUTIC_NEWSLETTER_SEGMENT_ID}/contacts/add`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + mToken },
              body: JSON.stringify({ ids: [Number(mauticContactId)] }),
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('[mautic-newsletter]', e && e.message);
    }
  }

  // ── Resend welcome email ──────────────────────────────────────────────────
  if (env.RESEND_API_KEY) {
    context.waitUntil(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.RESEND_API_KEY },
        body: JSON.stringify({
          from: 'Guilherme Ribeiro <blog@dimus.com.br>',
          to: [emailTrimmed],
          subject: `${firstName}, bem-vindo ao blog do varejo automotivo que mede carro vendido`,
          html: `<p>Olá, ${firstName}!</p>
<p>Você está inscrito na newsletter do <strong>blog.dimus.com.br</strong>.</p>
<p>Toda semana publicamos conteúdo sobre marketing automotivo que mede carro vendido — não lead. Sem enrolação.</p>
<p>Se tiver alguma dúvida ou quiser conversar, responda este e-mail.</p>
<br>
<p>— Guilherme Ribeiro<br>
<a href="https://blog.dimus.com.br">blog.dimus.com.br</a></p>
<p style="color:#888;font-size:12px">Você se inscreveu em blog.dimus.com.br. Para cancelar, responda com "cancelar".</p>`,
        }),
      }).catch((e) => console.error('[resend-newsletter]', e && e.message))
    );
  }

  // ── GHL upsert (tag newsletter + blog) ──────────────────────────────────
  let ghlContactId = '';
  if (env.GHL_TOKEN && env.GHL_LOCATION_ID) {
    try {
      const ghlResp = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer ' + env.GHL_TOKEN,
          Version: '2021-07-28',
        },
        body: JSON.stringify({
          locationId: env.GHL_LOCATION_ID,
          firstName,
          lastName,
          name: nomeTrimmed,
          email: emailTrimmed,
          source: 'blog-newsletter',
          tags: ['newsletter', 'blog'],
        }),
      });
      if (ghlResp.ok) {
        const ghlData = await ghlResp.json().catch(() => ({}));
        ghlContactId = ghlData?.contact?.id || ghlData?.id || '';
      }
    } catch (e) {
      console.error('[ghl-newsletter]', e && e.message);
    }
  }

  // ── Supabase forward (dados SoT) ─────────────────────────────────────────
  if (env.BLUEPRINT_SUPABASE_URL && env.BLUEPRINT_SUPABASE_KEY) {
    context.waitUntil(
      fetch(`${env.BLUEPRINT_SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.BLUEPRINT_SUPABASE_KEY,
          Authorization: 'Bearer ' + env.BLUEPRINT_SUPABASE_KEY,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: emailTrimmed,
          phone: null,
          segment: 'blog-newsletter',
          landing_page: 'https://blog.dimus.com.br',
          ig_data_source: 'form_submitted',
          tags: ['newsletter', 'blog'],
          source: 'blog-newsletter',
          custom_fields: {
            lead_origin: 'blog-newsletter-geral',
            mautic_contact_id: mauticContactId,
            ghl_contact_id: ghlContactId,
          },
        }),
      }).catch((e) => console.error('[supabase-newsletter]', e && e.message))
    );
  }

  return json({ ok: true, subscribed: true });
}

export async function onRequestOptions(context) {
  const { request } = context;
  const reqOrigin = request.headers.get('origin') || '';
  const acao = ALLOW.includes(reqOrigin) ? reqOrigin : ALLOW[0];
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': acao,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
