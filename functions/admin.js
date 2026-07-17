/**
 * blog.dimus.com.br — Painel admin (Cloudflare Pages Function, rota /admin)
 * Server-side only. Lê D1 blog-tracking e renderiza dashboard dark.
 * Métricas: downloads/magnet (catálogo finito), views/post, leads/origem,
 * conversão/post (leads ÷ views). PII (nome/telefone) só aparece aqui.
 *
 * Auth: Clerk JWT (produção clerk.dimus.com.br). Requer env CLERK_SECRET_KEY.
 * publicMetadata.role = "admin"|"superadmin"|"full_admin" + publicMetadata.access inclui "blog".
 * Cada login autenticado grava 1 linha em admin_access_log (site='blog') no Supabase
 * via token do template Clerk 'supabase_blog' (claim app='blog').
 */

const CLERK_FRONTEND_API = 'https://clerk.dimus.com.br';
const CLERK_PK = 'pk_live_Y2xlcmsuZGltdXMuY29tLmJyJA';
const SUPABASE_URL = 'https://tllelzquwdfcjjlsurai.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsbGVsenF1d2RmY2pqbHN1cmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTExMjQsImV4cCI6MjA4OTg2NzEyNH0.bKUp91XCEvEtU1h8HtcqY7PeIaLuPLDjXUUZbvR5cRc';

// Minta 1 token do template 'supabase_blog' (claim app='blog') a partir do
// sid presente no token de sessão padrão (__session), via Clerk Backend API.
// Compartilhado entre logAdminAccess (escrita) e getAdminAccessLog (leitura)
// — achado do full audit (wf_b00b3e88-427, #5 QA): antes cada função mintava
// seu próprio token, dobrando a chamada de rede à toa no mesmo request.
// Timeout defensivo (achado devil's advocate #1): getAdminAccessLog é
// aguardado de forma síncrona antes do D1 rodar, diferente do padrão
// fire-and-forget do resto do arquivo — um Clerk/Supabase lento não pode
// travar o dashboard inteiro, então aborta rápido e segue sem exclusão.
async function mintSupabaseBlogToken(sid, secretKey) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(`https://api.clerk.com/v1/sessions/${sid}/tokens/supabase_blog`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'content-type': 'application/json' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const { jwt: templatedToken } = await r.json();
    return templatedToken || null;
  } catch { return null; }
}

// Insere 1 linha em admin_access_log — best-effort, nunca bloqueia o dashboard.
async function logAdminAccess(clerkUserId, email, path, request, templatedToken) {
  if (!templatedToken) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/admin_access_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${templatedToken}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        site: 'blog',
        clerk_user_id: clerkUserId,
        email,
        path,
        ip: request.headers.get('cf-connecting-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      }),
    });
  } catch { /* audit log é best-effort */ }
}

// Lê admin_access_log (Supabase) — quem da equipe acessou o painel, quando,
// de onde. Retorna também os IPs distintos, usados pra excluir tráfego da
// própria equipe das métricas de audiência real do blog (ver mergeOrigins-
// style: filtro aplicado no worker, não em SQL cross-database — sessions/
// page_views vivem no D1, admin_access_log vive no Supabase, sem JOIN possível).
//
// GOTCHA CONHECIDO (achado do full audit #4 QA, não corrigido nesta sessão):
// a policy RLS de SELECT em admin_access_log (Supabase, projeto
// tllelzquwdfcjjlsurai) só libera leitura pra suporte@dimus.com.br e
// ribeirofguilherme@gmail.com. Qualquer outro admin autenticado recebe uma
// lista vazia (200 OK, 0 linhas) indistinguível de "sem acessos ainda" — a
// exclusão de tráfego da equipe silenciosamente não roda pra eles. Decisão
// de segurança (expandir a allowlist RLS ou aceitar a limitação) fica pro
// dono do produto, não é algo pra essa função decidir sozinha.
async function getAdminAccessLog(templatedToken) {
  if (!templatedToken) return { rows: [], ips: [] };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_access_log?site=eq.blog&select=email,ip,path,user_agent,created_at&order=created_at.desc&limit=100`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${templatedToken}` } }
    );
    if (!res.ok) return { rows: [], ips: [] };
    const rows = await res.json().catch(() => []);
    const ips = Array.from(new Set((Array.isArray(rows) ? rows : []).map((r) => r.ip).filter(Boolean))).slice(0, 20);
    return { rows: Array.isArray(rows) ? rows : [], ips };
  } catch { return { rows: [], ips: [] }; }
}

function getCk(cookie, name) {
  const m = cookie.match(new RegExp('(?:^|;)\\s*' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function b64url(s) {
  return atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + (4 - s.length % 4) % 4, '='));
}

async function verifyClerkJwt(token) {
  if (!token) return null;
  try {
    const [hB64, pB64, sB64] = token.split('.');
    if (!hB64 || !pB64 || !sB64) return null;
    const header  = JSON.parse(b64url(hB64));
    const payload = JSON.parse(b64url(pB64));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const { keys } = await (await fetch(`${CLERK_FRONTEND_API}/.well-known/jwks.json`)).json();
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) return null;
    const ck = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', ck,
      Uint8Array.from(b64url(sB64), c => c.charCodeAt(0)),
      new TextEncoder().encode(`${hB64}.${pB64}`)
    );
    return ok ? payload : null;
  } catch { return null; }
}

async function getClerkUser(userId, sk) {
  const r = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${sk}` },
  });
  if (!r.ok) return null;
  return r.json();
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (sec) => {
  if (!sec) return '—';
  try {
    return new Date(sec * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch { return '—'; }
};

const maskPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length < 6) return esc(p);
  return esc(d.slice(0, 4) + '••••' + d.slice(-2));
};

async function q(env, sql, ...binds) {
  try {
    const stmt = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
    const { results } = await stmt.all();
    return results || [];
  } catch (e) {
    return { __error: e.message || String(e) };
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cookie = request.headers.get('cookie') || '';

  if (!env.CLERK_SECRET_KEY) {
    return new Response('Admin indisponível: CLERK_SECRET_KEY não configurada.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  if (!env.DB) {
    return new Response('Admin indisponível: binding DB ausente.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // ── Auth gate — Clerk JWT ──────────────────────────────────────────────
  const sessionToken = getCk(cookie, '__session');
  const payload = await verifyClerkJwt(sessionToken);
  let adminUser = null;
  if (payload) {
    const user = await getClerkUser(payload.sub, env.CLERK_SECRET_KEY);
    if (user) {
      const meta = user.public_metadata || {};
      const role = meta.role;
      const access = Array.isArray(meta.access) ? meta.access : [];
      if (['admin', 'superadmin', 'full_admin'].includes(role) && access.includes('blog')) {
        adminUser = {
          email: user.email_addresses?.[0]?.email_address || '',
          role,
        };
      }
    }
  }

  if (!adminUser) {
    return new Response(loginHTML(), {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  // 1 mint de token Clerk 'supabase_blog' compartilhado entre escrita (audit
  // log) e leitura (acessos da equipe) — antes cada função mintava o seu.
  const supabaseBlogToken = await mintSupabaseBlogToken(payload.sid, env.CLERK_SECRET_KEY);

  // Audit log — best-effort, fire-and-forget, não bloqueia o dashboard se falhar.
  context.waitUntil(
    logAdminAccess(payload.sub, adminUser.email, url.pathname, request, supabaseBlogToken)
  );

  // ── Acessos da equipe (Supabase admin_access_log) ─────────────────────────
  // IPs de quem já logou no /admin excluem o próprio tráfego interno das
  // métricas de sessions (page_views não tem ip_address — exclusão fica
  // restrita a sessions, ver NOTES.md). Ver gotcha de RLS no comentário de
  // getAdminAccessLog — não funciona pra todo admin, só pra 2 emails.
  const accessLog = await getAdminAccessLog(supabaseBlogToken);
  const teamIps = accessLog.ips;
  const teamExcl = teamIps.length ? ` AND ip_address NOT IN (${teamIps.map(() => '?').join(',')})` : '';

  // ── Queries ────────────────────────────────────────────────────────────
  // Todas as agregações de sessions/page_views filtram is_bot = 0 (Wave 1 —
  // ~94% do tráfego bruto era axios/curl, não leitores reais).
  const nowSec = Math.floor(Date.now() / 1000);
  const D7 = 7 * 86400;

  const [totals] = await q(env, `
    SELECT
      (SELECT COUNT(*) FROM leads)                          AS leads,
      (SELECT COUNT(*) FROM page_views WHERE is_bot = 0)     AS views,
      (SELECT COUNT(*) FROM magnet_downloads)                AS downloads,
      (SELECT COUNT(*) FROM sessions WHERE is_bot = 0${teamExcl})       AS sessions,
      (SELECT COUNT(*) FROM sessions WHERE is_bot = 1)       AS bot_sessions,
      (SELECT COUNT(*) FROM sessions)                        AS all_sessions,
      (SELECT MAX(created_at) FROM sessions)                 AS last_ingestion,
      (SELECT COUNT(*) FROM sessions WHERE is_bot = 0 AND created_at >= ${nowSec - 3600}${teamExcl}) AS active_1h
  `, ...teamIps, ...teamIps).then((r) => (Array.isArray(r) ? r : [{}]));

  // Comparação semana-vs-semana anterior (mesmos dados já agregados por dia,
  // só recortados em duas janelas — nenhuma query nova além desta).
  const [period] = await q(env, `
    SELECT
      (SELECT COUNT(*) FROM sessions WHERE is_bot = 0 AND created_at >= ${nowSec - D7}${teamExcl}) AS sessions_now,
      (SELECT COUNT(*) FROM sessions WHERE is_bot = 0 AND created_at >= ${nowSec - 2 * D7} AND created_at < ${nowSec - D7}${teamExcl}) AS sessions_prev,
      (SELECT COUNT(*) FROM page_views WHERE is_bot = 0 AND created_at >= ${nowSec - D7}) AS views_now,
      (SELECT COUNT(*) FROM page_views WHERE is_bot = 0 AND created_at >= ${nowSec - 2 * D7} AND created_at < ${nowSec - D7}) AS views_prev,
      (SELECT COUNT(*) FROM leads WHERE created_at >= ${nowSec - D7}) AS leads_now,
      (SELECT COUNT(*) FROM leads WHERE created_at >= ${nowSec - 2 * D7} AND created_at < ${nowSec - D7}) AS leads_prev
  `, ...teamIps, ...teamIps).then((r) => (Array.isArray(r) ? r : [{}]));

  const magnets = await q(env, `
    SELECT m.slug, m.title, m.type, m.cluster, m.active,
           COUNT(d.id) AS downloads
    FROM lead_magnets m
    LEFT JOIN magnet_downloads d ON d.magnet_slug = m.slug
    GROUP BY m.slug
    ORDER BY downloads DESC, m.slug
  `);

  // M4/M7 — posts distintos com tráfego + sessions únicas + conversão por post.
  const posts = await q(env, `
    SELECT pv.post_slug,
           COUNT(*) AS views,
           COUNT(DISTINCT pv.session_id) AS sessions,
           (SELECT COUNT(*) FROM leads l WHERE l.post_slug = pv.post_slug) AS leads
    FROM page_views pv
    WHERE pv.post_slug != '' AND pv.is_bot = 0
    GROUP BY pv.post_slug
    ORDER BY views DESC
  `);

  // Posts órfãos — sem view nos últimos 14 dias (indicador de conteúdo
  // esquecido, calculável só com page_views, zero infra nova).
  const orphanPosts = await q(env, `
    SELECT post_slug, MAX(created_at) AS ultima_view, COUNT(*) AS views_total
    FROM page_views WHERE post_slug != '' AND is_bot = 0
    GROUP BY post_slug HAVING MAX(created_at) < ${nowSec - 14 * 86400}
    ORDER BY ultima_view ASC
  `);

  // Drill-down de post individual (?s=posts&post=<slug>) — série diária real,
  // leads, e a partir daqui a versão expandida: sessions/conversão vs. média
  // do site, breakdown de referrer, UTM e dispositivo daquele post específico.
  const postSlug = url.searchParams.get('post') || '';
  let postDetail = null;
  if (postSlug) {
    const postDaily = await q(env, `
      SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') AS day, COUNT(*) AS views
      FROM page_views WHERE post_slug = ? AND is_bot = 0
      GROUP BY day ORDER BY day DESC LIMIT 30
    `, postSlug);
    const postLeads = await q(env, `
      SELECT lead_name, wa_phone, lead_phone, magnet_slug, utm_source, event_name, created_at
      FROM leads WHERE post_slug = ? ORDER BY created_at DESC
    `, postSlug);
    const [compareStats] = await q(env, `
      SELECT
        (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE post_slug = ? AND is_bot = 0) AS post_sessions,
        (SELECT AVG(cnt) FROM (
           SELECT COUNT(DISTINCT session_id) AS cnt FROM page_views
           WHERE post_slug != '' AND is_bot = 0 GROUP BY post_slug
        )) AS avg_sessions_site,
        (SELECT COUNT(*) FROM leads WHERE post_slug = ?) AS post_leads,
        (SELECT COUNT(*) FROM leads) AS site_leads,
        (SELECT COUNT(DISTINCT session_id) FROM sessions WHERE is_bot = 0) AS site_sessions
    `, postSlug, postSlug).then((r) => (Array.isArray(r) ? r : [{}]));
    const postReferrers = await q(env, `
      SELECT CASE WHEN referrer = '' OR referrer IS NULL THEN '(direto)' ELSE referrer END AS referrer,
             COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
      FROM page_views WHERE post_slug = ? AND is_bot = 0
      GROUP BY referrer ORDER BY views DESC LIMIT 15
    `, postSlug);
    const postUtms = await q(env, `
      SELECT CASE WHEN s.utm_source = '' OR s.utm_source IS NULL THEN '(direto/orgânico)' ELSE s.utm_source END AS utm_source,
             COUNT(DISTINCT s.session_id) AS sessions
      FROM sessions s
      WHERE s.session_id IN (SELECT DISTINCT session_id FROM page_views WHERE post_slug = ? AND is_bot = 0 AND session_id != '')
      GROUP BY utm_source ORDER BY sessions DESC
    `, postSlug);
    const postDevices = await q(env, `
      SELECT CASE WHEN device_type = '' OR device_type IS NULL THEN 'desconhecido' ELSE device_type END AS device,
             COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
      FROM page_views WHERE post_slug = ? AND is_bot = 0
      GROUP BY device ORDER BY views DESC
    `, postSlug);
    postDetail = {
      slug: postSlug, daily: postDaily, leads: postLeads, compareStats,
      referrers: postReferrers, utms: postUtms, devices: postDevices,
    };
  }

  // Breakdown de dispositivo site-wide (via page_views — sessions não tem
  // device_type, só page_views e leads têm essa coluna).
  const devicesSite = await q(env, `
    SELECT CASE WHEN device_type = '' OR device_type IS NULL THEN 'desconhecido' ELSE device_type END AS device,
           COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
    FROM page_views WHERE is_bot = 0
    GROUP BY device ORDER BY views DESC
  `);

  // Newsletter — novos inscritos 7d vs. 7d anteriores, total geral, curva de
  // crescimento diária (tabela newsletter_subscribers, nunca antes exibida).
  const [newsletterTotals] = await q(env, `
    SELECT
      (SELECT COUNT(*) FROM newsletter_subscribers) AS total,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE created_at >= ${nowSec - D7}) AS novos_7d,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE created_at >= ${nowSec - 2 * D7} AND created_at < ${nowSec - D7}) AS novos_7d_prev
  `).then((r) => (Array.isArray(r) ? r : [{}]));
  const newsletterDaily = await q(env, `
    SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') AS day, COUNT(*) AS novos
    FROM newsletter_subscribers GROUP BY day ORDER BY day ASC
  `);

  // M6 — origem por lead e por session, mescladas por chave em JS (funil real
  // origem → sessão → lead) em vez de duas tabelas soltas sem conversão.
  const originsLeads = await q(env, `
    SELECT CASE WHEN utm_source = '' OR utm_source IS NULL THEN '(direto/orgânico)' ELSE utm_source END AS origem,
           COUNT(*) AS leads
    FROM leads
    GROUP BY origem
    ORDER BY leads DESC
  `);

  // teamExcl aplicado aqui também — achado do full audit (wf_b00b3e88-427,
  // #3 QA): antes só totals/period excluíam a equipe, origins e daily
  // continuavam contando o próprio tráfego interno apesar do texto na UI
  // dizer "já excluído das sessões acima". Consistência agora.
  const originsSessions = await q(env, `
    SELECT CASE WHEN utm_source = '' OR utm_source IS NULL THEN '(direto/orgânico)' ELSE utm_source END AS origem,
           COUNT(*) AS sessions
    FROM sessions
    WHERE is_bot = 0${teamExcl}
    GROUP BY origem
    ORDER BY sessions DESC
  `, ...teamIps);

  const recent = await q(env, `
    SELECT lead_name, lead_phone, wa_phone, event_name, post_slug, cluster, magnet_slug, utm_source, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT 40
  `);

  // M8 — série diária sessions reais vs. bot descartado (últimos 30 dias com dado).
  const dailyTeamExcl = teamIps.length ? ` WHERE ip_address NOT IN (${teamIps.map(() => '?').join(',')})` : '';
  const daily = await q(env, `
    SELECT strftime('%Y-%m-%d', created_at, 'unixepoch') AS day,
           SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) AS real,
           SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) AS bot
    FROM sessions${dailyTeamExcl}
    GROUP BY day
    ORDER BY day DESC
    LIMIT 30
  `, ...teamIps);

  // Wave 4 — GA4/GSC pré-agregados pelo Worker cron separado (blog-dimus-cron,
  // scheduled() 1x/dia). admin.js NUNCA chama googleapis.com direto — só lê
  // D1. GSC filtrado a blog.dimus.com.br porque a Domain Property cobre todo
  // dimus.com.br (todos os subdomínios), não só o blog.
  let ga4Summary = [];
  let gscTop = [];
  if (env.GSC_GA4_ENABLED) {
    ga4Summary = await q(env, `
      SELECT date, SUM(sessions) AS sessions, SUM(engaged_sessions) AS engaged_sessions,
             SUM(generate_lead_events) AS generate_lead_events
      FROM ga4_daily GROUP BY date ORDER BY date DESC LIMIT 30
    `);
    gscTop = await q(env, `
      SELECT page, query, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
             ROUND(SUM(position_sum) * 1.0 / SUM(impressions), 1) AS position
      FROM gsc_daily
      WHERE page LIKE 'https://blog.dimus.com.br%'
      GROUP BY page, query
      ORDER BY clicks DESC, impressions DESC
      LIMIT 30
    `);
  }

  const section = (url.searchParams.get('s') || 'overview').toLowerCase();
  const html = dashboardHTML({
    section, totals, period, magnets, posts, postDetail, orphanPosts, devicesSite,
    newsletterTotals, newsletterDaily, accessLog,
    originsLeads, originsSessions, recent, daily, adminUser,
    gscGa4Enabled: !!env.GSC_GA4_ENABLED, ga4Summary, gscTop,
  });
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// ── Views ────────────────────────────────────────────────────────────────────

// Tokens únicos consolidados (Wave 5 — anti-slop, ver DESIGN.md). OKLCH,
// neutros tingidos pro hue da marca (magenta), accent como lanterna — nunca
// preenchimento decorativo. Fraunces só em título de página + divisores de
// seção; mono reservado a DADOS (slug, timestamp, contagem, %).
const TOKENS = `
  :root {
    --bg:        oklch(14% 0.010 335);
    --surface-1: oklch(17% 0.011 335);
    --surface-2: oklch(20% 0.012 335);
    --line:      oklch(28% 0.012 335);
    --ink:       oklch(95% 0.006 335);
    --ink-mut:   oklch(68% 0.014 335);
    --ink-faint: oklch(48% 0.012 335);
    --mag:       oklch(62% 0.19 350);
    --mag-dim:   oklch(62% 0.19 350 / 0.10);
    --good:      oklch(64% 0.14 152);
    --warn:      oklch(70% 0.15 75);
    --sp1:8px; --sp2:16px; --sp3:24px; --sp4:40px;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.55 ui-sans-serif,-apple-system,"Hanken Grotesk",system-ui,sans-serif; }
  h1 { font:500 33px/1.15 "Fraunces",Georgia,serif; margin:0 0 4px; letter-spacing:-.01em; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.07em; color:var(--ink-mut); margin:0 0 var(--sp2); font-weight:600; font-family:ui-sans-serif,system-ui,sans-serif; }
  .sub { color:var(--ink-mut); margin:0 0 var(--sp4); font-size:14px; max-width:70ch; }
  section { margin-bottom:var(--sp4); padding-bottom:var(--sp4); border-bottom:1px solid var(--line); }
  section:last-of-type { border-bottom:0; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; border-top:1px solid var(--line); }
  th,td { text-align:left; padding:11px 4px; border-bottom:1px solid var(--line); }
  th:not(:first-child), td:not(:first-child) { padding-left:20px; }
  th { color:var(--ink-faint); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.05em; font-family:ui-sans-serif,system-ui,sans-serif; padding-top:0; }
  tr:last-child td { border-bottom:0; }
  td.num,th.num { text-align:right; font-variant-numeric:tabular-nums; font-family:ui-monospace,"JetBrains Mono",monospace; }
  .stat { color:var(--ink-faint); font-family:ui-sans-serif,system-ui,sans-serif; }
  .mag { color:var(--mag); }
  .mono { font-family:ui-monospace,"JetBrains Mono",monospace; }
  .faint { color:var(--ink-faint); }
  .empty { color:var(--ink-mut); max-width:60ch; }
  .err { color:oklch(70% 0.18 25); font-size:12px; }
  .botnote { color:var(--ink-faint); font-size:13px; margin:-20px 0 var(--sp4); max-width:70ch; }
  a.logout { color:var(--ink-mut); font-size:12px; text-decoration:none; border:1px solid var(--line); padding:6px 12px; border-radius:6px; cursor:pointer; font-family:ui-sans-serif,system-ui,sans-serif; transition:color 120ms ease, border-color 120ms ease; }
  a.logout:hover { color:var(--ink); border-color:var(--ink-mut); }
  a.logout:active { transform:scale(0.97); }
  .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp3); }

  /* Faixa de métricas: linha tipográfica, não grid de cards idênticos. */
  .kpi-row { display:flex; flex-wrap:wrap; gap:0; margin-bottom:var(--sp3); }
  .kpi { padding:0 32px 0 0; margin-right:32px; border-right:1px solid var(--line); }
  .kpi:last-child { border-right:0; margin-right:0; padding-right:0; }
  .kpi .n { font:500 32px/1 "Fraunces",Georgia,serif; font-variant-numeric:tabular-nums; }
  .kpi .l { color:var(--ink-faint); font-size:11.5px; text-transform:uppercase; letter-spacing:.06em; margin-top:8px; font-family:ui-sans-serif,system-ui,sans-serif; }
  .kpi .d { font-size:12px; margin-top:6px; font-family:ui-monospace,"JetBrains Mono",monospace; }

  .chart-wrap { padding:var(--sp2) 0 0; }
  .chart-wrap svg .line { stroke-dasharray:3000; stroke-dashoffset:3000; animation:draw-in .8s cubic-bezier(0.23,1,0.32,1) forwards; }
  @keyframes draw-in { to { stroke-dashoffset:0; } }

  /* Motion/interação (princípios Emil Kowalski): easing forte, duração curta,
     só transform/color — nunca 'transition:all'; sem animação em nav/teclado. */
  @media (prefers-reduced-motion: no-preference) {
    body { animation:page-in 180ms cubic-bezier(0.23,1,0.32,1); }
  }
  @keyframes page-in { from { opacity:0; } to { opacity:1; } }
  tr { transition:background-color 120ms ease; }
  @media (hover:hover) and (pointer:fine) {
    tbody tr:hover { background:var(--surface-1); }
  }
  .rowa { color:inherit; text-decoration:none; border-bottom:1px solid transparent; transition:color 120ms ease, border-color 120ms ease; }
  @media (hover:hover) and (pointer:fine) {
    .rowa:hover { color:var(--mag); border-color:var(--mag-dim); }
  }
  .backlink { color:var(--ink-mut); text-decoration:none; font-size:13px; display:inline-block; margin-bottom:var(--sp2); transition:color 120ms ease; }
  .backlink:hover { color:var(--mag); }
  .good { color:var(--good); }
  .bad { color:var(--warn); }
  :focus-visible { outline:2px solid var(--mag); outline-offset:2px; border-radius:2px; }
  button, a { -webkit-tap-highlight-color:transparent; }
`;

// Ícones thin monocromáticos (estilo Lucide, desenhados à mão — stroke=currentColor).
function icon(name) {
  const paths = {
    overview: 'M2 9l6-6 6 6M4 8v6h8V8',
    posts: 'M5 2h5l3 3v9H5z M10 2v3h3',
    leads: 'M8 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M3 14c0-3 2.2-5 5-5s5 2 5 5',
    origins: 'M8 14A6 6 0 108 2a6 6 0 000 12z M8 8l2.5-3.5L9 8l-2.5 3.5z',
    magnets: 'M2 5.5L8 3l6 2.5v5L8 13 2 10.5z M2 5.5L8 8l6-2.5 M8 8v5',
    newsletter: 'M2 4h12v8H2z M2 4l6 5 6-5',
    search: 'M7 12A4.5 4.5 0 107 3a4.5 4.5 0 000 9z M10.3 10.3L14 14',
    system: 'M2 8h2.5l1.5-4 2 8 1.5-4H14',
    quality: 'M2 13V9h3v4H2z M6 13V6h3v7H6z M10 13V3h3v10h-3z',
  };
  const d = paths[name] || paths.overview;
  return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

// Gráfico de linha simples (M8) — único tipo aprovado pro benchmarking (§5.6).
// Zero decoração: sem gradiente, sem preenchimento, sem eixo — só a série.
function lineChartSVG(rows, { width = 640, height = 110, color = 'var(--mag)' } = {}) {
  if (!rows || !rows.length) return '<div class="empty">Sem dados de sessão ainda.</div>';
  const data = rows.slice().reverse(); // ordem cronológica ascendente
  const max = Math.max(...data.map((d) => d.real || 0), 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const pt = (d, i) => `${(i * stepX).toFixed(1)},${(height - ((d.real || 0) / max) * height).toFixed(1)}`;
  const points = data.map(pt).join(' ');
  const first = data[0]?.day || '';
  const last = data[data.length - 1]?.day || '';
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none">
      <polyline class="line" points="${points}" fill="none" stroke="${color}" stroke-width="1.75" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="mono faint" style="display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;">
      <span>${esc(first)}</span><span>${esc(last)}</span>
    </div>`;
}

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'posts', label: 'Posts' },
  { key: 'leads', label: 'Leads' },
  { key: 'origins', label: 'Origens' },
  { key: 'magnets', label: 'Magnets' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'search', label: 'Busca' },
  { key: 'system', label: 'Sistema' },
  { key: 'quality', label: 'Qualidade' },
];

function sidebarNav(active) {
  const items = NAV_ITEMS.map((it) => `
    <a class="navitem${it.key === active ? ' active' : ''}" href="/admin?s=${it.key}">
      <span class="ic">${icon(it.key)}</span><span class="lb">${esc(it.label)}</span>
    </a>`).join('');
  return `
    <nav class="sidebar" id="sidebar">
      <div class="brand"><span class="lb">Blog Dimus</span></div>
      ${items}
      <button class="collapse-btn" id="collapseBtn" type="button" title="Colapsar sidebar">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg>
        <span class="lb">Colapsar</span>
      </button>
    </nav>`;
}

const SHELL = (title, active, body) => `<!doctype html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Blog Dimus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  ${TOKENS}
  .shell { display:flex; min-height:100dvh; }
  .sidebar {
    width:212px; flex:0 0 212px; background:var(--surface-1); border-right:1px solid var(--line);
    padding:var(--sp3) var(--sp2); display:flex; flex-direction:column; gap:1px;
    transition:width .18s cubic-bezier(.16,1,.3,1), flex-basis .18s cubic-bezier(.16,1,.3,1);
    position:sticky; top:0; align-self:flex-start; height:100dvh; overflow-y:auto;
  }
  .brand { font:500 16px/1.2 "Fraunces",Georgia,serif; padding:2px 10px var(--sp3); color:var(--ink); letter-spacing:-.01em; }
  .navitem { display:flex; align-items:center; gap:11px; padding:8px 10px; border-radius:6px; color:var(--ink-mut); text-decoration:none; font-size:13.5px; transition:color 120ms ease, background-color 120ms ease; }
  .navitem .ic { display:flex; flex:0 0 auto; opacity:.85; }
  @media (hover:hover) and (pointer:fine) { .navitem:hover { color:var(--ink); background:var(--surface-2); } }
  .navitem:active { transform:scale(0.98); }
  .navitem.active { color:var(--mag); background:var(--mag-dim); }
  .navitem.active .ic { opacity:1; }
  .collapse-btn { margin-top:auto; display:flex; align-items:center; gap:11px; padding:8px 10px; border-radius:6px; color:var(--ink-faint); background:none; border:0; cursor:pointer; font-size:12px; font-family:ui-sans-serif,system-ui,sans-serif; transition:color 120ms ease, background-color 120ms ease; }
  @media (hover:hover) and (pointer:fine) { .collapse-btn:hover { color:var(--ink-mut); background:var(--surface-2); } }
  .collapse-btn:active { transform:scale(0.97); }
  .collapse-btn svg { transition:transform .18s ease; flex:0 0 auto; }
  .main { flex:1; min-width:0; padding:var(--sp4) var(--sp4) 80px; }
  .wrap { max-width:1080px; margin:0 auto; }
  body.sb-collapsed .sidebar { width:52px; flex-basis:52px; padding-left:8px; padding-right:8px; }
  body.sb-collapsed .navitem { justify-content:center; }
  body.sb-collapsed .navitem .lb, body.sb-collapsed .brand .lb, body.sb-collapsed .collapse-btn .lb { display:none; }
  body.sb-collapsed .brand { text-align:center; padding:2px 0 var(--sp3); }
  body.sb-collapsed .collapse-btn svg { transform:rotate(180deg); }
  @media (max-width:720px) {
    .shell { flex-direction:column; }
    .sidebar { width:100%; flex-direction:row; flex-wrap:wrap; border-right:0; border-bottom:1px solid var(--line); position:static; height:auto; }
    .collapse-btn { display:none; }
    .main { padding:var(--sp3) var(--sp2) 60px; }
  }
</style>
</head>
<body>
  <div class="shell">
    ${sidebarNav(active)}
    <div class="main"><div class="wrap">${body}</div></div>
  </div>
  <script>
    (function () {
      var KEY = 'admin_sidebar_collapsed';
      var btn = document.getElementById('collapseBtn');
      if (localStorage.getItem(KEY) === '1') document.body.classList.add('sb-collapsed');
      if (btn) btn.addEventListener('click', function () {
        document.body.classList.toggle('sb-collapsed');
        localStorage.setItem(KEY, document.body.classList.contains('sb-collapsed') ? '1' : '0');
      });
    })();
  </script>
</body></html>`;

function loginHTML() {
  // Design: Editorial — Fraunces serif display, Motion One entrance, ultra-minimal
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin · Blog Dimus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0b0a0d;
    --bg2:#0e0c11;
    --ink:#f4f1f5;
    --ink2:#cbc4d2;
    --mut:#6b6472;
    --mag:#e1379e;
    --line:rgba(255,255,255,.06);
  }
  html{background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
  body{
    min-height:100dvh;
    display:grid;
    grid-template-columns:1fr minmax(0,460px) 1fr;
    grid-template-rows:1fr;
  }

  /* Left decorative column */
  .col-left{
    border-right:1px solid var(--line);
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    padding:40px 32px;
  }
  .col-left .issue{
    font-family:'JetBrains Mono',monospace;
    font-size:10px;
    letter-spacing:.18em;
    text-transform:uppercase;
    color:var(--mut);
    writing-mode:vertical-rl;
    transform:rotate(180deg);
  }
  .col-left .line-v{
    width:1px;
    flex:1;
    background:linear-gradient(180deg,transparent,var(--mag) 50%,transparent);
    margin:24px auto;
    opacity:.3;
  }

  /* Center column */
  .col-center{
    display:flex;
    flex-direction:column;
    justify-content:center;
    padding:64px 48px;
    position:relative;
  }

  /* Header */
  .kicker{
    font-family:'JetBrains Mono',monospace;
    font-size:10px;
    letter-spacing:.22em;
    text-transform:uppercase;
    color:var(--mag);
    margin-bottom:20px;
    opacity:0;
    transform:translateY(8px);
  }
  .display{
    font-family:'Fraunces',serif;
    font-size:clamp(2.6rem,5vw,3.6rem);
    font-weight:300;
    line-height:1.06;
    letter-spacing:-.01em;
    color:var(--ink);
    margin-bottom:6px;
    opacity:0;
    transform:translateY(12px);
  }
  .display em{
    font-style:italic;
    color:var(--mag);
    font-weight:300;
  }
  .rule{
    width:48px;height:1px;
    background:var(--mag);
    margin:24px 0;
    opacity:0;
    transform:scaleX(0);
    transform-origin:left;
  }

  /* Clerk wrapper */
  #sign-in{opacity:0;transform:translateY(8px)}

  /* Footer */
  .note{
    margin-top:28px;
    font-family:'JetBrains Mono',monospace;
    font-size:10px;
    color:var(--mut);
    letter-spacing:.06em;
    line-height:1.8;
    opacity:0;
  }
  .note strong{color:rgba(225,55,158,.55);font-weight:500}

  /* Right column */
  .col-right{
    border-left:1px solid var(--line);
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    padding:40px 32px;
  }
  .vol-num{
    font-family:'Fraunces',serif;
    font-size:clamp(4rem,10vw,7rem);
    font-weight:300;
    color:rgba(255,255,255,.03);
    line-height:1;
    text-align:right;
    letter-spacing:-.04em;
    user-select:none;
  }

  @media(max-width:640px){
    body{grid-template-columns:0 1fr 0}
    .col-left,.col-right{display:none}
    .col-center{padding:48px 28px}
  }
</style>
</head>
<body>
  <div class="col-left">
    <span class="issue">Blog Dimus — Admin</span>
    <div class="line-v"></div>
    <span class="issue">2026</span>
  </div>

  <div class="col-center">
    <div class="kicker" id="k">Área restrita</div>
    <h1 class="display" id="d">
      Blog<br/>
      <em>Dimus</em>
    </h1>
    <div class="rule" id="r"></div>
    <div id="sign-in"></div>
    <p class="note" id="n">
      Acesso exclusivo para membros da equipe Dimus.<br/>
      Problemas? <strong>Entre em contato com o administrador.</strong>
    </p>
  </div>

  <div class="col-right">
    <div class="vol-num">02</div>
  </div>

  <!-- Motion One (motion.dev) — Web Animations API wrapper, ~18kb -->
  <script type="module">
    import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/motion@10.18.0/+esm';

    // Stagger entrance — editorial reveal
    animate('#k', { opacity:[0,1], y:[8,0] }, { duration:.45, delay:.1, easing:'ease-out' });
    animate('#d', { opacity:[0,1], y:[12,0] }, { duration:.55, delay:.25, easing:[0.22,1,0.36,1] });
    animate('#r', { opacity:[0,1], scaleX:[0,1] }, { duration:.5, delay:.5, easing:'ease-out' });
    animate('#n', { opacity:[0,1] }, { duration:.5, delay:1.1, easing:'ease-out' });
  </script>

  <script async crossorigin="anonymous"
    data-clerk-publishable-key="${CLERK_PK}"
    src="${CLERK_FRONTEND_API}/npm/@clerk/clerk-js@5/dist/clerk.browser.js">
  </script>
  <script>
    window.addEventListener('load', async function () {
      if (!window.Clerk) return;
      await window.Clerk.load();
      if (window.Clerk.user) { location.href = '/admin'; return; }

      const el = document.getElementById('sign-in');
      window.Clerk.mountSignIn(el, {
        appearance: {
          variables: {
            colorPrimary:'#e1379e',
            colorBackground:'#0e0c11',
            colorInputBackground:'#0b0a0d',
            colorInputText:'#f4f1f5',
            colorText:'#f4f1f5',
            colorTextSecondary:'#6b6472',
            colorDanger:'#ff5252',
            borderRadius:'4px',
            fontFamily:"'JetBrains Mono', monospace",
            fontSize:'13px',
          },
          elements: {
            card:{ background:'transparent', border:'none', boxShadow:'none', padding:0 },
            headerTitle:{ display:'none' },
            headerSubtitle:{ display:'none' },
            socialButtonsBlockButton:{ display:'none' },
            dividerRow:{ display:'none' },
            footerAction:{ display:'none' },
            formFieldInput:{
              background:'#0b0a0d',
              color:'#f4f1f5',
              caretColor:'#e1379e',
              border:'1px solid rgba(255,255,255,.08)',
              borderRadius:'4px',
              fontFamily:"'JetBrains Mono', monospace",
            },
            formButtonPrimary:{
              background:'#e1379e',
              borderRadius:'4px',
              fontFamily:"'JetBrains Mono', monospace",
              letterSpacing:'.08em',
            },
          },
        },
      });

      // Reveal after Clerk mounts
      setTimeout(() => {
        el.style.transition = 'opacity .4s ease, transform .4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 600);
    });
  </script>
</body>
</html>`;
}

function tableOrEmpty(rows, cols, render, emptyMsg) {
  if (rows && rows.__error) return `<p class="err">Erro: ${esc(rows.__error)} <span class="mono">(migration 0002 aplicada?)</span></p>`;
  if (!rows || !rows.length) return `<div class="empty">${esc(emptyMsg)}</div>`;
  return `<table><thead><tr>${cols}</tr></thead><tbody>${rows.map(render).join('')}</tbody></table>`;
}

const SECTION_TITLES = {
  overview: 'Overview', posts: 'Posts', leads: 'Leads', origins: 'Origens',
  magnets: 'Magnets', newsletter: 'Newsletter', search: 'Busca', system: 'Sistema', quality: 'Qualidade',
};

// Delta vs. período anterior — nunca inventa significância: mostra o par
// absoluto sempre junto do %, e admite quando não há período anterior pra comparar.
function deltaTag(now, prev) {
  now = now || 0; prev = prev || 0;
  if (!prev) return `<span class="faint">sem período anterior pra comparar</span>`;
  const diff = now - prev;
  const pct = ((diff / prev) * 100).toFixed(0);
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '·';
  const cls = diff > 0 ? 'good' : diff < 0 ? 'bad' : 'faint';
  return `<span class="${cls}">${arrow} ${Math.abs(pct)}%</span> <span class="faint">(${prev} → ${now})</span>`;
}

// Funil real origem → sessão → lead: mescla as duas queries por chave em vez
// de exibir duas tabelas soltas que o leitor tinha que cruzar de cabeça.
function mergeOrigins(leadsRows, sessionsRows) {
  if (leadsRows && leadsRows.__error) return leadsRows;
  if (sessionsRows && sessionsRows.__error) return sessionsRows;
  const map = new Map();
  (sessionsRows || []).forEach((r) => map.set(r.origem, { origem: r.origem, sessions: r.sessions || 0, leads: 0 }));
  (leadsRows || []).forEach((r) => {
    const e = map.get(r.origem) || { origem: r.origem, sessions: 0, leads: 0 };
    e.leads = r.leads || 0;
    map.set(r.origem, e);
  });
  return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
}

function dashboardHTML({ section, totals, period, magnets, posts, postDetail, orphanPosts, devicesSite, newsletterTotals, newsletterDaily, accessLog, originsLeads, originsSessions, recent, daily, adminUser, gscGa4Enabled, ga4Summary, gscTop }) {
  const t = totals || {};
  const p = period || {};
  const nl = newsletterTotals || {};
  const botPct = t.all_sessions ? ((t.bot_sessions / t.all_sessions) * 100).toFixed(0) : 0;
  const active = SECTION_TITLES[section] ? section : 'overview';
  const postSlugParam = postDetail?.slug || '';

  const magnetsTbl = tableOrEmpty(magnets,
    `<th>Magnet</th><th>Tipo</th><th>Cluster</th><th class="num">Downloads</th>`,
    (m) => `<tr>
      <td>${esc(m.title)} <span class="mono faint">${esc(m.slug)}</span>${m.active ? '' : ' <span class="faint">· inativo</span>'}</td>
      <td class="faint">${esc(m.type || '—')}</td>
      <td class="faint">${esc(m.cluster || '—')}</td>
      <td class="num">${m.downloads ?? 0}</td></tr>`,
    'Catálogo vazio — rode o seed de lead_magnets.');

  const postsTbl = tableOrEmpty(posts,
    `<th>Post</th><th class="num">Views</th><th class="num">Sessões</th><th class="num">Leads</th><th class="num">Conversão</th>`,
    (post) => {
      const conv = post.views ? ((post.leads / post.views) * 100).toFixed(1) + '%' : '—';
      const href = `/admin?s=posts&post=${encodeURIComponent(post.post_slug)}`;
      return `<tr>
        <td class="mono"><a class="rowa" href="${href}">${esc(post.post_slug)}</a></td>
        <td class="num">${post.views ?? 0}</td>
        <td class="num">${post.sessions ?? 0}</td>
        <td class="num">${post.leads ?? 0}</td>
        <td class="num mag">${conv}</td></tr>`;
    },
    'Nenhuma view registrada ainda.');

  const mergedOrigins = mergeOrigins(originsLeads, originsSessions);
  const originsTbl = tableOrEmpty(mergedOrigins,
    `<th>Origem</th><th class="num">Sessões</th><th class="num">Leads</th><th class="num">Conversão</th>`,
    (o) => {
      const conv = o.sessions ? ((o.leads / o.sessions) * 100).toFixed(2) + '%' : '—';
      return `<tr><td>${esc(o.origem)}</td><td class="num">${o.sessions ?? 0}</td><td class="num">${o.leads ?? 0}</td><td class="num mag">${conv}</td></tr>`;
    },
    'Nenhuma origem registrada ainda.');

  const recentTbl = tableOrEmpty(recent,
    `<th>Quando</th><th>Nome</th><th>WhatsApp</th><th>Post</th><th>Magnet</th><th>Origem</th><th>Evento</th>`,
    (l) => `<tr>
      <td class="mono">${esc(fmtDate(l.created_at))}</td>
      <td>${esc(l.lead_name || '—')}</td>
      <td class="mono">${maskPhone(l.wa_phone || l.lead_phone)}</td>
      <td class="mono"><a class="rowa" href="/admin?s=posts&post=${encodeURIComponent(l.post_slug || '')}">${esc(l.post_slug || '—')}</a></td>
      <td class="mono">${esc(l.magnet_slug || '—')}</td>
      <td>${esc(l.utm_source || 'direto')}${l.cluster ? ` <span class="faint">· ${esc(l.cluster)}</span>` : ''}</td>
      <td class="faint">${esc(l.event_name || '—')}</td></tr>`,
    'Nenhum lead capturado ainda.');

  // Sistema mostra ANOMALIAS (picos de bot fora do padrão), não o mesmo dump
  // de 30 dias que já vira o gráfico da Overview — conteúdo distinto por seção.
  const botSpikes = (daily || []).filter((d) => (d.bot || 0) > 1000).sort((a, b) => (b.bot || 0) - (a.bot || 0));
  const spikesTbl = tableOrEmpty(botSpikes,
    `<th>Dia</th><th class="num">Bot descartado</th><th class="num">Sessões reais</th>`,
    (d) => `<tr><td class="mono">${esc(d.day)}</td><td class="num mag">${d.bot ?? 0}</td><td class="num">${d.real ?? 0}</td></tr>`,
    'Nenhum pico de bot fora do padrão nos últimos 30 dias.');

  const orphansTbl = tableOrEmpty(orphanPosts,
    `<th>Post</th><th class="num">Views totais</th><th class="num">Última view</th>`,
    (o) => `<tr><td class="mono"><a class="rowa" href="/admin?s=posts&post=${encodeURIComponent(o.post_slug)}">${esc(o.post_slug)}</a></td><td class="num">${o.views_total ?? 0}</td><td class="num">${esc(fmtDate(o.ultima_view))}</td></tr>`,
    'Nenhum post órfão — todos tiveram tráfego nos últimos 14 dias.');

  const devicesTbl = tableOrEmpty(devicesSite,
    `<th>Dispositivo</th><th class="num">Views</th><th class="num">Sessões</th>`,
    (d) => `<tr><td>${esc(d.device)}</td><td class="num">${d.views ?? 0}</td><td class="num">${d.sessions ?? 0}</td></tr>`,
    'Sem dados de dispositivo ainda.');

  const teamIpsCount = (accessLog?.ips || []).length;
  const accessLogTbl = tableOrEmpty(accessLog?.rows,
    `<th>Quando</th><th>Email</th><th>IP</th><th>Path</th>`,
    (a) => `<tr><td class="mono">${esc(fmtDate(a.created_at ? Math.floor(new Date(a.created_at).getTime() / 1000) : 0))}</td><td>${esc(a.email || '—')}</td><td class="mono">${esc(a.ip || '—')}</td><td class="mono faint">${esc(a.path || '—')}</td></tr>`,
    'Nenhum acesso registrado ainda (admin_access_log vazio ou indisponível).');

  const nlPct7d = deltaTag(nl.novos_7d, nl.novos_7d_prev);
  let nlCumulative = 0;
  const nlChartRows = (newsletterDaily || []).map((d) => {
    nlCumulative += d.novos || 0;
    return { day: d.day, real: nlCumulative };
  }).reverse(); // lineChartSVG espera ordem desc (ele reverte internamente)

  const cards = `
    <div class="kpi-row">
      <div class="kpi"><div class="n mag">${t.leads ?? 0}</div><div class="l">Leads</div><div class="d">${deltaTag(p.leads_now, p.leads_prev)}</div></div>
      <div class="kpi"><div class="n">${t.sessions ?? 0}</div><div class="l">Sessões reais</div><div class="d">${deltaTag(p.sessions_now, p.sessions_prev)}</div></div>
      <div class="kpi"><div class="n">${t.views ?? 0}</div><div class="l">Views</div><div class="d">${deltaTag(p.views_now, p.views_prev)}</div></div>
      <div class="kpi"><div class="n">${t.downloads ?? 0}</div><div class="l">Downloads</div></div>
      <div class="kpi"><div class="n">${t.active_1h ?? 0}</div><div class="l">Sessões — última hora</div></div>
    </div>
    <p class="botnote">Filtro de bot ativo (Wave 1) — ${t.bot_sessions ?? 0} de ${t.all_sessions ?? 0} sessions brutas descartadas (${botPct}% do tráfego bruto era script/tooling, não leitor real).${teamIpsCount ? ` Tráfego de ${teamIpsCount} IP(s) da própria equipe (via admin_access_log) já excluído das contagens de <strong>sessões</strong> em toda a Overview/Origens/Sistema — views e leads não são filtrados por IP (page_views não tem essa coluna).` : ''} Deltas comparam os últimos 7 dias vs. os 7 dias anteriores.</p>
    <p class="stat">Conversão geral: <span class="mono mag">${t.sessions ? ((t.leads / t.sessions) * 100).toFixed(2) : '0.00'}%</span> das sessões reais viraram lead (${t.leads ?? 0} de ${t.sessions ?? 0}).</p>`;

  const top5 = (posts || []).slice(0, 5);
  const top5Tbl = tableOrEmpty(top5,
    `<th>Post</th><th class="num">Views</th><th class="num">Leads</th>`,
    (post) => `<tr><td class="mono"><a class="rowa" href="/admin?s=posts&post=${encodeURIComponent(post.post_slug)}">${esc(post.post_slug)}</a></td><td class="num">${post.views ?? 0}</td><td class="num">${post.leads ?? 0}</td></tr>`,
    'Nenhuma view registrada ainda.');

  // Drill-down de post individual — clicar num post na tabela leva pra cá.
  let postDetailBody = '';
  if (postDetail) {
    const chartRows = (postDetail.daily || []).map((d) => ({ day: d.day, real: d.views }));
    const postLeadsTbl = tableOrEmpty(postDetail.leads,
      `<th>Quando</th><th>Nome</th><th>WhatsApp</th><th>Magnet</th><th>Origem</th>`,
      (l) => `<tr>
        <td class="mono">${esc(fmtDate(l.created_at))}</td>
        <td>${esc(l.lead_name || '—')}</td>
        <td class="mono">${maskPhone(l.wa_phone || l.lead_phone)}</td>
        <td class="mono">${esc(l.magnet_slug || '—')}</td>
        <td>${esc(l.utm_source || 'direto')}</td></tr>`,
      'Nenhum lead deste post ainda.');

    const cs = postDetail.compareStats || {};
    const postSessions = cs.post_sessions ?? 0;
    const avgSessions = cs.avg_sessions_site ? Number(cs.avg_sessions_site).toFixed(1) : '0.0';
    const postConv = postSessions ? ((cs.post_leads / postSessions) * 100).toFixed(2) : '0.00';
    const siteConv = cs.site_sessions ? ((cs.site_leads / cs.site_sessions) * 100).toFixed(2) : '0.00';
    const compareRow = `
      <div class="kpi-row">
        <div class="kpi"><div class="n">${postSessions}</div><div class="l">Sessões deste post</div><div class="d faint">média do site: ${avgSessions}</div></div>
        <div class="kpi"><div class="n mag">${postConv}%</div><div class="l">Conversão deste post</div><div class="d faint">média do site: ${siteConv}%</div></div>
      </div>`;

    const referrersTbl = tableOrEmpty(postDetail.referrers,
      `<th>Referrer</th><th class="num">Views</th><th class="num">Sessões</th>`,
      (r) => `<tr><td class="mono">${esc(r.referrer)}</td><td class="num">${r.views ?? 0}</td><td class="num">${r.sessions ?? 0}</td></tr>`,
      'Sem referrer registrado ainda.');

    const utmsTbl = tableOrEmpty(postDetail.utms,
      `<th>Origem (UTM)</th><th class="num">Sessões</th>`,
      (u) => `<tr><td>${esc(u.utm_source)}</td><td class="num">${u.sessions ?? 0}</td></tr>`,
      'Sem UTM registrado ainda.');

    const devicesPostTbl = tableOrEmpty(postDetail.devices,
      `<th>Dispositivo</th><th class="num">Views</th><th class="num">Sessões</th>`,
      (d) => `<tr><td>${esc(d.device)}</td><td class="num">${d.views ?? 0}</td><td class="num">${d.sessions ?? 0}</td></tr>`,
      'Sem dados de dispositivo ainda.');

    postDetailBody = `
      <a class="backlink" href="/admin?s=posts">← todos os posts</a>
      <section><h2>Views por dia (últimos 30 dias com dado)</h2><div class="chart-wrap">${lineChartSVG(chartRows)}</div></section>
      <section><h2>Este post vs. média do site</h2>${compareRow}</section>
      <section><h2>Origem por referrer</h2>${referrersTbl}</section>
      <section><h2>Origem por UTM</h2>${utmsTbl}</section>
      <section><h2>Dispositivo</h2>${devicesPostTbl}</section>
      <section><h2>Leads deste post</h2>${postLeadsTbl}</section>`;
  }

  const sections = {
    overview: `
      ${cards}
      <section><h2>Sessões reais por dia (bot já descartado)</h2><div class="chart-wrap">${lineChartSVG(daily)}</div></section>
      <section><h2>Top 5 posts</h2>${top5Tbl}</section>
      <section><h2>Dispositivo (site inteiro)</h2>${devicesTbl}</section>`,

    posts: postDetail ? postDetailBody : `
      <section><h2>Conversão por post (view → lead)</h2>${postsTbl}</section>
      <section><h2>Posts órfãos — sem view nos últimos 14 dias</h2>${orphansTbl}</section>`,

    leads: `<section><h2>Leads recentes</h2>${recentTbl}</section>`,

    origins: `<section><h2>Funil por origem: sessão → lead (conversão real)</h2>${originsTbl}</section>`,

    magnets: `<section><h2>Downloads por magnet (catálogo finito)</h2>${magnetsTbl}</section>`,

    newsletter: `
      <div class="kpi-row">
        <div class="kpi"><div class="n mag">${nl.total ?? 0}</div><div class="l">Inscritos totais</div></div>
        <div class="kpi"><div class="n">${nl.novos_7d ?? 0}</div><div class="l">Novos — últimos 7 dias</div><div class="d">${nlPct7d}</div></div>
      </div>
      <section><h2>Crescimento acumulado de inscritos</h2><div class="chart-wrap">${lineChartSVG(nlChartRows)}</div></section>
      <p class="empty">Conversão newsletter → lead por email não é calculável hoje: a tabela <span class="mono">leads</span> não tem coluna de email pra cruzar com <span class="mono">newsletter_subscribers</span>. Registrado como gap, não estimado.</p>`,

    search: gscGa4Enabled ? (() => {
      const ga4Chart = lineChartSVG((ga4Summary || []).map((d) => ({ day: d.date, real: d.sessions })));
      const ga4Tbl = tableOrEmpty(ga4Summary,
        `<th>Dia</th><th class="num">Sessões (GA4)</th><th class="num">Engajadas</th><th class="num">generate_lead</th>`,
        (d) => `<tr><td class="mono">${esc(d.date)}</td><td class="num">${d.sessions ?? 0}</td><td class="num">${d.engaged_sessions ?? 0}</td><td class="num mag">${d.generate_lead_events ?? 0}</td></tr>`,
        'Sem dado GA4 ainda — Worker cron roda 1x/dia.');
      const gscTbl = tableOrEmpty(gscTop,
        `<th>Página</th><th>Query</th><th class="num">Clicks</th><th class="num">Impressões</th><th class="num">Posição</th>`,
        (r) => `<tr><td class="mono faint">${esc((r.page || '').replace('https://blog.dimus.com.br', ''))}</td><td>${esc(r.query)}</td><td class="num mag">${r.clicks ?? 0}</td><td class="num">${r.impressions ?? 0}</td><td class="num">${r.position ?? '—'}</td></tr>`,
        'Sem dado GSC do blog ainda — Worker cron roda 1x/dia.');
      return `
        <section><h2>Sessões GA4 por dia</h2><div class="chart-wrap">${ga4Chart}</div></section>
        <section><h2>generate_lead e engajamento (GA4)</h2>${ga4Tbl}</section>
        <section><h2>Top queries/páginas — busca orgânica (GSC, só blog.dimus.com.br)</h2>${gscTbl}</section>`;
    })() : `
      <section><h2>Busca orgânica (GA4/GSC)</h2>
        <div class="empty">
          Aguardando Wave 4 — credenciais GA4/GSC já provisionadas (Wave 0, property <span class="mono">543369220</span>),
          mas a integração de dados (cron diário + tabelas <span class="mono">ga4_daily</span>/<span class="mono">gsc_daily</span>) ainda não foi implementada.
          Esta seção nasce honesta: sem dado fake, sem placeholder de número.
        </div></section>`,

    system: `
      <section><h2>Saúde do tracking</h2>
        <div class="kpi-row">
          <div class="kpi"><div class="n mag">${botPct}%</div><div class="l">Tráfego bot (histórico)</div></div>
          <div class="kpi"><div class="n">${t.bot_sessions ?? 0}</div><div class="l">Sessions marcadas bot</div></div>
          <div class="kpi"><div class="n">${t.all_sessions ?? 0}</div><div class="l">Sessions brutas totais</div></div>
          <div class="kpi"><div class="n">${t.active_1h ?? 0}</div><div class="l">Sessões — última hora</div></div>
        </div>
        <p class="stat">Última ingestão: <span class="mono">${esc(fmtDate(t.last_ingestion))}</span></p>
      </section>
      <section><h2>Picos de bot fora do padrão (últimos 30 dias)</h2>${spikesTbl}</section>
      <section><h2>Acessos da equipe ao painel (admin_access_log)</h2>
        <p class="stat">${teamIpsCount ? `${teamIpsCount} IP(s) distintos identificados — já excluídos do tráfego real na Overview/Origens/série diária.` : 'Nenhum IP identificado ainda. Se você já acessou o painel antes e não vê nada aqui, a policy RLS do Supabase (admin_access_log) pode não liberar leitura pro seu email — checar com quem administra o Supabase antes de assumir que não há acesso registrado.'}</p>
        ${accessLogTbl}</section>`,

    quality: `
      <section>
        <h2>Score editorial por post (SEO / GEO / AEO)</h2>
        <p class="stat">Scores calculados no build a partir do conteúdo real dos arquivos MDX — nenhum número inventado.
        <strong style="color:var(--ink-mut)">SEO</strong>: estrutura técnica (descrição, título, OG, FAQ, palavras).
        <strong style="color:var(--ink-mut)">GEO</strong>: otimização para motores generativos (LLMs, AI overviews).
        <strong style="color:var(--ink-mut)">AEO</strong>: componentes canônicos Dimus (AnswerCapsule, LeadForm, DimusHelp).</p>
        <div id="q-loading" class="empty">Carregando scores...</div>
        <div id="q-root" style="display:none"></div>
      </section>
      <script>
      (function(){
        function bar(n){
          var c=n>=90?'var(--good)':n>=70?'var(--warn)':'var(--mag)';
          return '<span style="display:inline-flex;align-items:center;gap:5px">'
            +'<span style="width:44px;height:4px;background:var(--surface-2);border-radius:2px;overflow:hidden">'
            +'<span style="width:'+n+'%;height:100%;background:'+c+';border-radius:2px;display:block"></span></span>'
            +'<span class="mono" style="font-size:11px;min-width:26px;text-align:right">'+n+'</span></span>';
        }
        fetch('/posts-quality.json')
          .then(function(r){return r.json();})
          .then(function(d){
            var posts=d.posts||[];
            var avg=posts.length?Math.round(posts.reduce(function(a,p){return a+p.composite;},0)/posts.length):0;
            var a90=posts.filter(function(p){return p.composite>=90;}).length;
            var og=posts.filter(function(p){return p.has_unique_og;}).length;
            var issues=posts.filter(function(p){return p.composite<70||!p.has_unique_og;});
            var alert=issues.length
              ?'<div style="background:var(--surface-1);border:1px solid oklch(62% 0.19 350/0.25);border-radius:8px;padding:14px 18px;margin-bottom:20px">'
                +'<p style="margin:0;font-size:13px"><span style="color:var(--mag);font-weight:500">'+issues.length+' post(s) com problemas:</span> '
                +issues.map(function(p){return '<span class="mono" style="font-size:11px">'+p.slug+'</span>';}).join(', ')+'</p></div>'
              :'';
            var kpis='<div class="kpi-row" style="margin-bottom:22px">'
              +'<div class="kpi"><div class="n mag">'+posts.length+'</div><div class="l">Posts publicados</div></div>'
              +'<div class="kpi"><div class="n">'+avg+'</div><div class="l">Score medio</div></div>'
              +'<div class="kpi"><div class="n">'+a90+'</div><div class="l">Score &ge; 90</div></div>'
              +'<div class="kpi"><div class="n">'+og+'</div><div class="l">OG unicos</div></div>'
              +'</div>';
            var rows=posts.map(function(p){
              var ogFlag=p.has_unique_og
                ?'<span style="color:var(--good)">&#10003;</span>'
                :'<span style="color:var(--mag)">&#10007;</span>';
              var comps=''
                +(p.has_answer_capsule?'<span title="AnswerCapsule" style="color:var(--good)">AC</span> ':'<span style="color:var(--mag)">AC</span> ')
                +(p.has_lead_form?'<span title="LeadForm" style="color:var(--good)">LF</span> ':'<span style="color:var(--mag)">LF</span> ')
                +(p.has_dimus_help?'<span title="DimusHelp" style="color:var(--good)">DH</span>':'<span style="color:var(--mag)">DH</span>');
              return '<tr>'
                +'<td style="font-size:11.5px;max-width:300px"><a href="/posts/'+p.slug+'" class="rowa" target="_blank" rel="noopener">'+p.slug+'</a></td>'
                +'<td class="num">'+bar(p.composite)+'</td>'
                +'<td class="num">'+bar(p.seo)+'</td>'
                +'<td class="num">'+bar(p.geo)+'</td>'
                +'<td class="num">'+bar(p.aeo)+'</td>'
                +'<td class="num mono" style="font-size:11px">'+p.word_count+'w</td>'
                +'<td class="num">'+ogFlag+'</td>'
                +'<td class="num mono" style="font-size:10.5px;letter-spacing:.02em">'+comps+'</td>'
                +'</tr>';
            }).join('');
            var tbl='<div style="overflow-x:auto"><table>'
              +'<thead><tr>'
              +'<th>Post</th>'
              +'<th class="num">Score</th>'
              +'<th class="num">SEO</th>'
              +'<th class="num">GEO</th>'
              +'<th class="num">AEO</th>'
              +'<th class="num">Palavras</th>'
              +'<th class="num">OG</th>'
              +'<th class="num">Comps</th>'
              +'</tr></thead>'
              +'<tbody>'+rows+'</tbody>'
              +'</table></div>'
              +'<p class="faint mono" style="font-size:11px;margin-top:10px">Score gerado em: '+new Date(d.generated_at).toLocaleString("pt-BR")+'</p>';
            document.getElementById('q-root').innerHTML=alert+kpis+tbl;
            document.getElementById('q-loading').style.display='none';
            document.getElementById('q-root').style.display='';
          })
          .catch(function(e){
            document.getElementById('q-loading').textContent='Erro ao carregar scores: '+e.message;
          });
      })();
      </script>
    `,
  };

  const topBlock = `
    <div class="top">
      <div><h1${postDetail ? ' class="mono" style="font-size:26px;"' : ''}>${postDetail ? esc(postDetail.slug) : esc(SECTION_TITLES[active])}</h1><p class="sub">Blog Dimus · Admin — ${esc(adminUser?.email || '')}</p></div>
      <a class="logout clerk-signout" href="#">sair</a>
    </div>`;

  const body = `
    ${topBlock}
    ${sections[active] || sections.overview}
    <script async crossorigin="anonymous"
      data-clerk-publishable-key="${CLERK_PK}"
      src="${CLERK_FRONTEND_API}/npm/@clerk/clerk-js@5/dist/clerk.browser.js">
    </script>
    <script>
      window.addEventListener('load', async function () {
        if (!window.Clerk) return;
        await window.Clerk.load();
        document.querySelectorAll('.clerk-signout').forEach(el => {
          el.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.Clerk.signOut();
            location.href = '/admin';
          });
        });
      });
    </script>`;

  return SHELL(postSlugParam ? postSlugParam : SECTION_TITLES[active], active, body);
}
