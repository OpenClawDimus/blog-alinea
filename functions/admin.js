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

// Minta um token do template 'supabase_blog' (claim app='blog') a partir do
// sid presente no token de sessão padrão (__session), via Clerk Backend API.
// Depois insere 1 linha em admin_access_log — best-effort, nunca bloqueia o dashboard.
async function logAdminAccess(sid, clerkUserId, email, path, request, secretKey) {
  try {
    const r = await fetch(`https://api.clerk.com/v1/sessions/${sid}/tokens/supabase_blog`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'content-type': 'application/json' },
    });
    if (!r.ok) return;
    const { jwt: templatedToken } = await r.json();
    if (!templatedToken) return;
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
        // Audit log — best-effort, não bloqueia o dashboard se falhar.
        context.waitUntil(
          logAdminAccess(payload.sid, payload.sub, adminUser.email, url.pathname, request, env.CLERK_SECRET_KEY)
        );
      }
    }
  }

  if (!adminUser) {
    return new Response(loginHTML(), {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  // ── Queries ────────────────────────────────────────────────────────────
  const [totals] = await q(env, `
    SELECT
      (SELECT COUNT(*) FROM leads)            AS leads,
      (SELECT COUNT(*) FROM page_views)       AS views,
      (SELECT COUNT(*) FROM magnet_downloads) AS downloads,
      (SELECT COUNT(*) FROM sessions)         AS sessions
  `).then((r) => (Array.isArray(r) ? r : [{}]));

  const magnets = await q(env, `
    SELECT m.slug, m.title, m.type, m.cluster, m.active,
           COUNT(d.id) AS downloads
    FROM lead_magnets m
    LEFT JOIN magnet_downloads d ON d.magnet_slug = m.slug
    GROUP BY m.slug
    ORDER BY downloads DESC, m.slug
  `);

  const posts = await q(env, `
    SELECT pv.post_slug,
           COUNT(*) AS views,
           (SELECT COUNT(*) FROM leads l WHERE l.post_slug = pv.post_slug) AS leads
    FROM page_views pv
    WHERE pv.post_slug != ''
    GROUP BY pv.post_slug
    ORDER BY views DESC
  `);

  const origins = await q(env, `
    SELECT CASE WHEN utm_source = '' OR utm_source IS NULL THEN '(direto/orgânico)' ELSE utm_source END AS origem,
           COUNT(*) AS leads
    FROM leads
    GROUP BY origem
    ORDER BY leads DESC
  `);

  const recent = await q(env, `
    SELECT lead_name, lead_phone, wa_phone, event_name, post_slug, cluster, magnet_slug, utm_source, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT 40
  `);

  const html = dashboardHTML({ totals, magnets, posts, origins, recent, adminUser });
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// ── Views ────────────────────────────────────────────────────────────────────

const SHELL = (title, body) => `<!doctype html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Blog Dimus</title>
<style>
  :root { --bg:#0b0a0d; --panel:#141217; --line:#26222c; --ink:#f4f1f5; --mut:#a39daa; --mag:#e1379e; --ok:#1faf54; --warn:#e1b33a; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 ui-sans-serif,-apple-system,"Hanken Grotesk",system-ui,sans-serif; padding:32px 20px 80px; }
  .wrap { max-width:1040px; margin:0 auto; }
  h1 { font:600 26px/1.2 "Fraunces",Georgia,serif; margin:0 0 4px; }
  .sub { color:var(--mut); margin:0 0 28px; font-size:13px; }
  .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:16px 18px; }
  .card .n { font:600 28px/1 "Fraunces",Georgia,serif; }
  .card .l { color:var(--mut); font-size:12px; text-transform:uppercase; letter-spacing:.04em; margin-top:6px; }
  section { margin-bottom:34px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:0 0 12px; font-weight:600; }
  table { width:100%; border-collapse:collapse; background:var(--panel); border:1px solid var(--line); border-radius:14px; overflow:hidden; font-size:13.5px; }
  th,td { text-align:left; padding:10px 14px; border-bottom:1px solid var(--line); }
  th { color:var(--mut); font-weight:600; font-size:11.5px; text-transform:uppercase; letter-spacing:.04em; }
  tr:last-child td { border-bottom:0; }
  td.num,th.num { text-align:right; font-variant-numeric:tabular-nums; }
  .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; border:1px solid var(--line); color:var(--mut); }
  .mag { color:var(--mag); }
  .mono { font-family:ui-monospace,"JetBrains Mono",monospace; font-size:12px; color:var(--mut); }
  .empty { color:var(--mut); padding:18px 14px; }
  .err { color:#ff6b6b; font-size:12px; }
  a.logout { color:var(--mut); font-size:12px; text-decoration:none; border:1px solid var(--line); padding:6px 12px; border-radius:999px; cursor:pointer; }
  .top { display:flex; justify-content:space-between; align-items:flex-start; }
</style>
</head>
<body><div class="wrap">${body}</div></body></html>`;

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

function dashboardHTML({ totals, magnets, posts, origins, recent, adminUser }) {
  const t = totals || {};
  const cards = `
    <div class="cards">
      <div class="card"><div class="n mag">${t.leads ?? 0}</div><div class="l">Leads</div></div>
      <div class="card"><div class="n">${t.downloads ?? 0}</div><div class="l">Downloads</div></div>
      <div class="card"><div class="n">${t.views ?? 0}</div><div class="l">Views</div></div>
      <div class="card"><div class="n">${t.sessions ?? 0}</div><div class="l">Sessões</div></div>
    </div>`;

  const magnetsTbl = tableOrEmpty(magnets,
    `<th>Magnet</th><th>Tipo</th><th>Cluster</th><th class="num">Downloads</th>`,
    (m) => `<tr>
      <td>${esc(m.title)} <span class="mono">${esc(m.slug)}</span>${m.active ? '' : ' <span class="pill">inativo</span>'}</td>
      <td><span class="pill">${esc(m.type || '—')}</span></td>
      <td>${esc(m.cluster || '—')}</td>
      <td class="num">${m.downloads ?? 0}</td></tr>`,
    'Catálogo vazio — rode o seed de lead_magnets.');

  const postsTbl = tableOrEmpty(posts,
    `<th>Post</th><th class="num">Views</th><th class="num">Leads</th><th class="num">Conversão</th>`,
    (p) => {
      const conv = p.views ? ((p.leads / p.views) * 100).toFixed(1) + '%' : '—';
      return `<tr><td class="mono">${esc(p.post_slug)}</td>
        <td class="num">${p.views ?? 0}</td>
        <td class="num">${p.leads ?? 0}</td>
        <td class="num mag">${conv}</td></tr>`;
    },
    'Nenhuma view registrada ainda.');

  const originsTbl = tableOrEmpty(origins,
    `<th>Origem</th><th class="num">Leads</th>`,
    (o) => `<tr><td>${esc(o.origem)}</td><td class="num">${o.leads ?? 0}</td></tr>`,
    'Nenhum lead ainda.');

  const recentTbl = tableOrEmpty(recent,
    `<th>Quando</th><th>Nome</th><th>WhatsApp</th><th>Post</th><th>Magnet</th><th>Origem</th>`,
    (l) => `<tr>
      <td class="mono">${esc(fmtDate(l.created_at))}</td>
      <td>${esc(l.lead_name || '—')}</td>
      <td class="mono">${maskPhone(l.wa_phone || l.lead_phone)}</td>
      <td class="mono">${esc(l.post_slug || '—')}</td>
      <td class="mono">${esc(l.magnet_slug || '—')}</td>
      <td>${esc(l.utm_source || 'direto')}</td></tr>`,
    'Nenhum lead capturado ainda.');

  return SHELL('Admin', `
    <div class="top">
      <div><h1>Blog Dimus · Admin</h1><p class="sub">Catálogo finito de magnets · analytics de conversão · leads</p></div>
      <a class="logout clerk-signout" href="#">sair</a>
    </div>
    ${cards}
    <section><h2>Downloads por magnet (catálogo finito)</h2>${magnetsTbl}</section>
    <section><h2>Conversão por post</h2>${postsTbl}</section>
    <section><h2>Leads por origem</h2>${originsTbl}</section>
    <section><h2>Leads recentes</h2>${recentTbl}</section>
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
    </script>`);
}
