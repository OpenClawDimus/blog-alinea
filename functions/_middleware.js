/**
 * blog.dimus.com.br — Edge Middleware (Cloudflare Pages Functions)
 * Roda em toda request de página HTML.
 * Captura UTMs, fbclid/gclid/msclkid, minta _fbp/_fbc, persiste em D1 sessions.
 * Método KROB (herdado do dimus-usa, live-verified): getRawParam (clickid raw),
 * first-touch lock-in via UPSERT, cookies 400d.
 */

const SKIP_PATHS = [
  '/tracker', '/api/', '/admin', '/favicon', '/assets', '/_astro',
  '/sitemap', '/robots', '/llms', '/rss', '/pagefind', '/og.png',
];

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Pula rotas internas e estáticos
  if (
    SKIP_PATHS.some(p => url.pathname.startsWith(p)) ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|avif|ico|svg|woff2?|ttf|txt|xml|json|map)$/i)
  ) {
    return next();
  }

  // ── Cookies existentes ──────────────────────────────────────────────────
  const cookie = request.headers.get('cookie') || '';
  const getCookie = (n) => {
    const m = cookie.match(new RegExp('(?:^|;)\\s*' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  };

  let sessionId   = getCookie('_krob_sid');
  let externalId  = getCookie('_krob_eid');
  let existingFbp = getCookie('_fbp');
  let existingFbc = getCookie('_fbc');

  if (!sessionId)  sessionId  = crypto.randomUUID();
  if (!externalId) externalId = crypto.randomUUID();

  // ── Click IDs — raw (sem URL-decode; Meta espera os bytes exatos) ────────
  const fbclid  = getRawParam(url.search, 'fbclid');
  const gclid   = getRawParam(url.search, 'gclid');
  const msclkid = getRawParam(url.search, 'msclkid');

  // ── 5 UTMs ──────────────────────────────────────────────────────────────
  const utmSource   = url.searchParams.get('utm_source')   || '';
  const utmMedium   = url.searchParams.get('utm_medium')   || '';
  const utmCampaign = url.searchParams.get('utm_campaign') || '';
  const utmContent  = url.searchParams.get('utm_content')  || '';
  const utmTerm     = url.searchParams.get('utm_term')     || '';

  // ── Macros de campanha (params dinâmicos Meta/Google) ────────────────────
  const campaignId = url.searchParams.get('campaign_id') || '';
  const adsetId    = url.searchParams.get('adset_id')    || '';
  const adId       = url.searchParams.get('ad_id')       || '';
  const placement  = url.searchParams.get('placement')   || '';

  const host = request.headers.get('host') || '';
  const SUB_DOMAIN_INDEX = computeSubDomainIndex(host);
  const now = Date.now();

  // ── Minta _fbc do fbclid ────────────────────────────────────────────────
  let fbc = existingFbc;
  if (fbclid) {
    const existingPayload = fbc ? (fbc.split('.')[3] || '') : '';
    if (!fbc || existingPayload !== fbclid) {
      fbc = `fb.${SUB_DOMAIN_INDEX}.${now}.${fbclid}`;
    }
  }

  // ── Minta _fbp se faltar ────────────────────────────────────────────────
  let fbp = existingFbp;
  if (!fbp) {
    fbp = `fb.${SUB_DOMAIN_INDEX}.${now}.${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  // ── Serve a página primeiro, grava em D1 depois ──────────────────────────
  const response = await next();

  // ── Geo da edge do Cloudflare ────────────────────────────────────────────
  const cf = request.cf || {};
  const cfCountry    = cf.country    || '';
  const cfRegion     = cf.region     || '';
  const cfCity       = cf.city       || '';
  const cfPostalCode = cf.postalCode || '';
  const cfTimezone   = cf.timezone   || '';
  const cfAsn        = cf.asn ? String(cf.asn) : '';

  // ── Persiste sessão + page_view em D1 ────────────────────────────────────
  if (env.DB) {
    const nowSec = Math.floor(now / 1000);

    // post_slug derivado de /posts/<slug>/ (vazio p/ não-post); device do UA
    const ua = request.headers.get('user-agent') || '';
    const postMatch = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    const postSlug = postMatch ? postMatch[1] : '';
    const deviceType = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
      ? (/iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile')
      : 'desktop';
    const isHtml = (response.headers.get('content-type') || '').includes('text/html');
    if (isHtml) {
      context.waitUntil(
        env.DB.prepare(`
          INSERT INTO page_views (
            session_id, post_slug, path, referrer, device_type, country, created_at
          ) VALUES (?,?,?,?,?,?,?)
        `).bind(
          sessionId, postSlug, url.pathname,
          request.headers.get('referer') || '',
          deviceType, cfCountry, nowSec
        ).run()
      );
    }

    context.waitUntil(
      env.DB.prepare(`
        INSERT INTO sessions (
          session_id, external_id, fbclid, gclid, msclkid, fbc, fbp,
          ip_address, user_agent, referrer, landing_url,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          campaign_id, adset_id, ad_id, placement,
          country, region, city, postal_code, timezone, asn,
          created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(session_id) DO UPDATE SET
          fbclid       = CASE WHEN excluded.fbclid       != '' THEN excluded.fbclid       ELSE sessions.fbclid       END,
          gclid        = CASE WHEN excluded.gclid        != '' THEN excluded.gclid        ELSE sessions.gclid        END,
          msclkid      = CASE WHEN excluded.msclkid      != '' THEN excluded.msclkid      ELSE sessions.msclkid      END,
          fbc          = CASE WHEN excluded.fbc          != '' THEN excluded.fbc          ELSE sessions.fbc          END,
          utm_source   = CASE WHEN excluded.utm_source   != '' THEN excluded.utm_source   ELSE sessions.utm_source   END,
          utm_medium   = CASE WHEN excluded.utm_medium   != '' THEN excluded.utm_medium   ELSE sessions.utm_medium   END,
          utm_campaign = CASE WHEN excluded.utm_campaign != '' THEN excluded.utm_campaign ELSE sessions.utm_campaign END,
          utm_content  = CASE WHEN excluded.utm_content  != '' THEN excluded.utm_content  ELSE sessions.utm_content  END,
          utm_term     = CASE WHEN excluded.utm_term     != '' THEN excluded.utm_term     ELSE sessions.utm_term     END,
          campaign_id  = CASE WHEN excluded.campaign_id  != '' THEN excluded.campaign_id  ELSE sessions.campaign_id  END,
          adset_id     = CASE WHEN excluded.adset_id     != '' THEN excluded.adset_id     ELSE sessions.adset_id     END,
          ad_id        = CASE WHEN excluded.ad_id        != '' THEN excluded.ad_id        ELSE sessions.ad_id        END,
          placement    = CASE WHEN excluded.placement    != '' THEN excluded.placement    ELSE sessions.placement    END,
          updated_at   = excluded.updated_at
      `).bind(
        sessionId, externalId, fbclid, gclid, msclkid, fbc, fbp,
        request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '',
        request.headers.get('user-agent') || '',
        request.headers.get('referer') || '',
        url.toString(),
        utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
        campaignId, adsetId, adId, placement,
        cfCountry, cfRegion, cfCity, cfPostalCode, cfTimezone, cfAsn,
        nowSec, nowSec
      ).run()
    );
  }

  // ── Cookies (400 dias, sem HttpOnly p/ o pixel JS ler fbp/fbc) ───────────
  const maxAge = 34560000;
  const base   = `Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `_krob_sid=${sessionId}; ${base}`);
  headers.append('Set-Cookie', `_krob_eid=${externalId}; ${base}`);
  headers.append('Set-Cookie', `_fbp=${fbp}; ${base}`);
  if (fbc) headers.append('Set-Cookie', `_fbc=${fbc}; ${base}`);

  return new Response(response.body, { status: response.status, headers });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRawParam(search, name) {
  const m = (search || '').match(new RegExp('[?&]' + name + '=([^&]*)'));
  return m ? m[1] : '';
}

const CC_TLDS = new Set([
  'com.br', 'com.ar', 'com.mx', 'com.co', 'com.pe', 'com.au', 'com.pt',
  'co.uk', 'co.jp', 'co.kr', 'co.nz', 'co.za', 'co.in',
]);
function computeSubDomainIndex(host) {
  if (!host) return 1;
  const h = host.split(':')[0].toLowerCase();
  const lastTwo = h.split('.').slice(-2).join('.');
  return CC_TLDS.has(lastTwo) ? 2 : 1;
}
