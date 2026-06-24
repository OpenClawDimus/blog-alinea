/**
 * blog.dimus.com.br — Painel admin (Cloudflare Pages Function, rota /admin)
 * Server-side only. Lê D1 blog-tracking e renderiza dashboard dark.
 * Métricas: downloads/magnet (catálogo finito), views/post, leads/origem,
 * conversão/post (leads ÷ views). PII (nome/telefone) só aparece aqui.
 *
 * Gate: env.DASH_KEY. Aceita ?key=… (seta cookie 12h) ou cookie _dash.
 * Sem chave correta → 401. Sem env.DASH_KEY setada → 503 (config faltando).
 */

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

  if (!env.DASH_KEY) {
    return new Response('Admin indisponível: DASH_KEY não configurada.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  if (!env.DB) {
    return new Response('Admin indisponível: binding DB ausente.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // ── Auth gate ──────────────────────────────────────────────────────────
  // O cookie guarda um TOKEN HMAC opaco (exp.sig), NUNCA a DASH_KEY bruta.
  // Login via POST (corpo), nunca ?key= na URL (não vaza em log/Referer).
  const cookie = request.headers.get('cookie') || '';
  const getCk = (n) => {
    const m = cookie.match(new RegExp('(?:^|;)\\s*' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  };
  const clearCookie = '_dash=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Strict; Secure';

  // POST = tentativa de login (chave no corpo form ou JSON)
  if (request.method === 'POST') {
    let key = '';
    try {
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) key = String((await request.json()).key || '');
      else key = String((await request.formData()).get('key') || '');
    } catch { /* corpo inválido → key vazia */ }
    const good = key.length === env.DASH_KEY.length && timingSafeEqual(key, env.DASH_KEY);
    const h = new Headers({ 'cache-control': 'no-store' });
    if (good) {
      h.append('set-cookie', `_dash=${await issueToken(env.DASH_KEY)}; Path=/admin; Max-Age=43200; HttpOnly; SameSite=Strict; Secure`);
      h.set('location', '/admin');
      return new Response(null, { status: 303, headers: h }); // PRG → some o segredo da request
    }
    h.set('content-type', 'text/html; charset=utf-8');
    h.append('set-cookie', clearCookie);
    return new Response(loginHTML(true), { status: 401, headers: h });
  }

  // Logout explícito
  if (url.searchParams.get('logout') != null) {
    const h = new Headers({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    h.append('set-cookie', clearCookie);
    return new Response(loginHTML(false), { status: 200, headers: h });
  }

  // GET = valida o token de sessão (HMAC), nunca a chave bruta
  const ok = await verifyToken(env.DASH_KEY, getCk('_dash'));
  if (!ok) {
    const h = new Headers({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    if (getCk('_dash')) h.append('set-cookie', clearCookie); // token expirado/inválido → limpa
    return new Response(loginHTML(false), { status: 401, headers: h });
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

  const html = dashboardHTML({ totals, magnets, posts, origins, recent });
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Sessão: token HMAC opaco (exp.sig) derivado da DASH_KEY ────────────────────
// O cookie carrega ESTE token, nunca a chave-mestra. Revogável trocando DASH_KEY.
async function hmacHex(secret, msg) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function issueToken(secret) {
  const exp = Math.floor(Date.now() / 1000) + 43200; // 12h
  return exp + '.' + (await hmacHex(secret, 'admin.v1.' + exp));
}
async function verifyToken(secret, token) {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = parseInt(token.slice(0, dot), 10);
  const sig = token.slice(dot + 1);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacHex(secret, 'admin.v1.' + exp);
  return sig.length === expected.length && timingSafeEqual(sig, expected);
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
  a.logout { color:var(--mut); font-size:12px; text-decoration:none; border:1px solid var(--line); padding:6px 12px; border-radius:999px; }
  .top { display:flex; justify-content:space-between; align-items:flex-start; }
  form.login { max-width:340px; margin:80px auto; background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:28px; }
  form.login input { width:100%; padding:11px 13px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); font-size:15px; }
  form.login button { width:100%; margin-top:12px; padding:11px; border:0; border-radius:10px; background:var(--mag); color:#fff; font-weight:600; cursor:pointer; }
</style>
</head>
<body><div class="wrap">${body}</div></body></html>`;

function loginHTML(failed) {
  return SHELL('Admin', `
    <form class="login" method="post" action="/admin">
      <h1>Blog Dimus · Admin</h1>
      <p class="sub">Acesso restrito.</p>
      ${failed ? '<p class="err">Chave inválida.</p>' : ''}
      <input type="password" name="key" placeholder="Chave de acesso" autofocus autocomplete="off">
      <button type="submit">Entrar</button>
    </form>`);
}

function tableOrEmpty(rows, cols, render, emptyMsg) {
  if (rows && rows.__error) return `<p class="err">Erro: ${esc(rows.__error)} <span class="mono">(migration 0002 aplicada?)</span></p>`;
  if (!rows || !rows.length) return `<div class="empty">${esc(emptyMsg)}</div>`;
  return `<table><thead><tr>${cols}</tr></thead><tbody>${rows.map(render).join('')}</tbody></table>`;
}

function dashboardHTML({ totals, magnets, posts, origins, recent }) {
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
      <a class="logout" href="/admin?logout=1">sair</a>
    </div>
    ${cards}
    <section><h2>Downloads por magnet (catálogo finito)</h2>${magnetsTbl}</section>
    <section><h2>Conversão por post</h2>${postsTbl}</section>
    <section><h2>Leads por origem</h2>${originsTbl}</section>
    <section><h2>Leads recentes</h2>${recentTbl}</section>`);
}
