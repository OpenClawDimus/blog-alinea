/**
 * blog.dimus.com.br — Design System Preview /admin/ds
 * Cloudflare Pages Function. Auth: Clerk JWT (mesmo gate do /admin).
 * Visualização interativa de todos os tokens, tipografia e componentes do Showroom.
 */

const CLERK_FRONTEND_API = 'https://clerk.dimus.com.br';
const CLERK_PK = 'pk_live_Y2xlcmsuZGltdXMuY29tLmJyJA';

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

export async function onRequest(context) {
  const { request, env } = context;
  const cookie = request.headers.get('cookie') || '';

  if (!env.CLERK_SECRET_KEY) {
    return new Response('CLERK_SECRET_KEY ausente.', { status: 503, headers: { 'content-type': 'text/plain' } });
  }

  const sessionToken = getCk(cookie, '__session');
  const payload = await verifyClerkJwt(sessionToken);
  let authed = false;
  if (payload) {
    const user = await getClerkUser(payload.sub, env.CLERK_SECRET_KEY);
    if (user) {
      const meta = user.public_metadata || {};
      const role = meta.role;
      const access = Array.isArray(meta.access) ? meta.access : [];
      if (['admin', 'superadmin', 'full_admin'].includes(role) && access.includes('blog')) {
        authed = true;
      }
    }
  }

  if (!authed) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin', 'cache-control': 'no-store' },
    });
  }

  return new Response(dsHTML(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function dsHTML() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Design System · Blog Dimus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,500&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>
/* ── Reset & Base ───────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0a0d;
  --bg-2:#0e0c11;
  --surface:#131017;
  --surface-2:#181420;
  --hair:rgba(255,255,255,.07);
  --hair-mag:rgba(225,55,158,.16);
  --ink:#f4f1f5;
  --ink-2:#cbc4d2;
  --muted:#9a8fa3;
  --dim:#6e6678;
  --magenta:#e1379e;
  --magenta-deep:#b21e97;
  --pink:#ff53c8;
  --pos:#1faf54;
  --neg:#ff5252;
  --warn:#e1b33a;
  --info:#4fa8d5;
  --ease:cubic-bezier(.16,1,.3,1);
}
html{background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
body{font:15px/1.6 'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif;padding:0;min-height:100vh}

/* ── Layout ─────────────────────────────────────────────────── */
.ds-shell{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
.ds-nav{
  position:sticky;top:0;height:100vh;overflow-y:auto;
  padding:28px 20px;background:var(--bg-2);border-right:1px solid var(--hair);
  display:flex;flex-direction:column;gap:6px;
}
.ds-nav-brand{
  font-family:'Fraunces',serif;font-size:18px;font-weight:600;
  color:var(--ink);letter-spacing:-.02em;margin-bottom:20px;
}
.ds-nav-brand span{color:var(--magenta)}
.ds-nav a{
  display:block;padding:7px 12px;border-radius:8px;
  font-size:13px;color:var(--ink-2);text-decoration:none;
  transition:background .2s,color .2s;
}
.ds-nav a:hover{background:rgba(255,255,255,.05);color:#fff}
.ds-nav .group{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);padding:16px 12px 6px;margin-top:8px}
.ds-nav .back{color:var(--magenta);font-size:12px;margin-bottom:16px;border:1px solid var(--hair-mag);border-radius:999px;padding:5px 12px;display:inline-block;text-align:center}

.ds-main{padding:48px 56px 120px;max-width:1100px}
h1.ds-page-title{font-family:'Fraunces',serif;font-size:clamp(28px,3vw,42px);font-weight:500;color:var(--ink);letter-spacing:-.03em;margin-bottom:6px}
.ds-version{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:.1em;margin-bottom:56px}

/* ── Section ────────────────────────────────────────────────── */
.ds-section{margin-bottom:80px}
.ds-section-label{
  font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--magenta);margin-bottom:12px;
  display:flex;align-items:center;gap:12px;
}
.ds-section-label::after{content:'';flex:1;height:1px;background:var(--hair)}
h2.ds-h{font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:var(--ink);letter-spacing:-.02em;margin-bottom:24px}
.ds-desc{font-size:14px;color:var(--muted);max-width:60ch;line-height:1.6;margin-bottom:28px}

/* ── Tables ─────────────────────────────────────────────────── */
.ds-table{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--hair);border-radius:14px;overflow:hidden;font-size:13.5px;margin-bottom:24px}
.ds-table th,.ds-table td{text-align:left;padding:11px 16px;border-bottom:1px solid var(--hair)}
.ds-table th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-family:'JetBrains Mono',monospace}
.ds-table tr:last-child td{border-bottom:0}
.code{font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(255,255,255,.05);padding:2px 7px;border-radius:5px;color:var(--ink-2)}
.pass{color:var(--pos)}
.fail{color:var(--neg);font-weight:600}
.warn{color:var(--warn)}

/* ── Color swatches ─────────────────────────────────────────── */
.ds-swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.ds-swatch{border-radius:12px;overflow:hidden;border:1px solid var(--hair)}
.ds-swatch-color{height:72px}
.ds-swatch-info{background:var(--surface);padding:10px 12px}
.ds-swatch-name{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-2)}
.ds-swatch-value{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim);margin-top:2px}
.ds-swatch-ratio{font-size:11px;margin-top:4px}

/* ── Typography specimens ───────────────────────────────────── */
.ds-type-row{display:flex;align-items:baseline;gap:24px;padding:20px 0;border-bottom:1px solid var(--hair)}
.ds-type-row:last-child{border-bottom:0}
.ds-type-meta{min-width:200px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim);line-height:1.8}
.ds-type-meta strong{color:var(--ink-2);display:block;font-size:11px}

/* ── Motion tokens ──────────────────────────────────────────── */
.ds-motion-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.ds-motion-card{
  border:1px solid var(--hair);border-radius:12px;padding:16px;
  background:var(--surface);cursor:pointer;
}
.ds-motion-preview{
  width:100%;height:4px;background:var(--magenta);border-radius:2px;
  margin-bottom:12px;transform:scaleX(0);transform-origin:left;
}
.ds-motion-card:hover .ds-motion-preview{transform:scaleX(1)}
.ds-motion-label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.ds-motion-value{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--ink-2);margin-top:4px}

/* ── Component previews ─────────────────────────────────────── */
.ds-comp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.ds-comp-item{border:1px solid var(--hair);border-radius:14px;overflow:hidden}
.ds-comp-preview{background:var(--surface-2);padding:24px;min-height:100px;display:flex;align-items:center;justify-content:center}
.ds-comp-label{background:var(--surface);padding:10px 14px;border-top:1px solid var(--hair)}
.ds-comp-name{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--magenta)}
.ds-comp-desc{font-size:12px;color:var(--dim);margin-top:3px}

/* ── Inline preview components ─────────────────────────────── */
.demo-btn{display:inline-flex;align-items:center;gap:8px;background:var(--magenta);color:#fff;font-family:'Fraunces',serif;font-weight:600;font-size:14px;padding:10px 22px;border-radius:72px;border:0;cursor:pointer;box-shadow:0 8px 22px rgba(178,30,151,.34)}
.demo-eyebrow{display:inline-flex;align-items:center;gap:14px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--magenta)}
.demo-eyebrow::before{content:'';width:30px;height:1px;background:var(--magenta);opacity:.6}
.demo-tag{display:inline-flex;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border:1px solid var(--hair);border-radius:72px;padding:5px 12px}
.demo-kicker{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.demo-card-mini{background:#18141f;border:1px solid rgba(255,255,255,.11);border-radius:14px;padding:20px;width:100%}
.demo-card-mini h3{font-family:'Fraunces',serif;font-weight:600;font-size:18px;letter-spacing:-.02em;margin-top:8px;color:var(--ink)}
.demo-field{display:flex;background:var(--bg);border:1px solid var(--hair);border-radius:10px;overflow:hidden;width:100%}
.demo-field input{flex:1;background:none;border:0;outline:none;color:var(--ink);font-family:'Hanken Grotesk',sans-serif;font-size:13px;padding:10px 12px}
.demo-field input::placeholder{color:var(--dim)}
.demo-tldr{border:1px solid var(--hair);border-radius:12px;padding:18px 22px;background:var(--surface);width:100%}
.demo-tldr h4{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--magenta);margin-bottom:10px}
.demo-tldr li{padding-left:18px;font-size:14px;color:var(--ink-2);position:relative;margin-bottom:8px;list-style:none}
.demo-tldr li::before{content:'';position:absolute;left:2px;top:.55em;width:5px;height:5px;border-radius:50%;background:var(--magenta)}
.demo-pull{font-family:'Fraunces',serif;font-weight:500;font-style:italic;font-size:22px;line-height:1.22;color:var(--ink);border-left:2px solid var(--magenta);padding-left:16px;max-width:22ch}

/* ── WCAG ───────────────────────────────────────────────────── */
.wcag-row td:first-child{font-family:'JetBrains Mono',monospace;font-size:12px}
.wcag-swatch{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:middle;margin-right:6px;border:1px solid rgba(255,255,255,.1)}

/* ── Gate checklist ─────────────────────────────────────────── */
.ds-gate{background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:24px 28px;margin-bottom:16px}
.ds-gate h3{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--magenta);margin-bottom:14px}
.ds-gate ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.ds-gate li{font-size:13.5px;color:var(--ink-2);padding-left:22px;position:relative}
.ds-gate li::before{content:'□';position:absolute;left:0;color:var(--dim);font-size:14px}

@media(max-width:900px){
  .ds-shell{grid-template-columns:1fr}
  .ds-nav{display:none}
  .ds-main{padding:28px 20px 80px}
}
</style>
</head>
<body>
<div class="ds-shell">

  <!-- Sidebar nav -->
  <nav class="ds-nav">
    <div class="ds-nav-brand">Blog <span>Dimus</span><br>Design System</div>
    <a href="/admin" class="back">← Admin</a>

    <span class="group">Fundação</span>
    <a href="#colors">Cores</a>
    <a href="#typography">Tipografia</a>
    <a href="#layout">Layout</a>
    <a href="#motion">Movimento</a>
    <a href="#spacing">Espaçamento</a>

    <span class="group">Componentes</span>
    <a href="#buttons">Botões</a>
    <a href="#labels">Labels</a>
    <a href="#cards">Cards</a>
    <a href="#prose">Prose</a>
    <a href="#lead">Lead Capture</a>

    <span class="group">Qualidade</span>
    <a href="#wcag">WCAG</a>
    <a href="#gaps">Token Gaps</a>
    <a href="#gates">Gates</a>
  </nav>

  <!-- Main content -->
  <main class="ds-main">
    <h1 class="ds-page-title">Design System</h1>
    <p class="ds-version">v1.0.0 · 2026-07-14 · blog.dimus.com.br · <a href="/admin/ds" style="color:var(--magenta)">dark-only</a></p>

    <!-- CORES -->
    <section class="ds-section" id="colors">
      <div class="ds-section-label">01 · Cores</div>
      <h2 class="ds-h">Paleta de Tokens</h2>
      <p class="ds-desc">Todos os valores vivem em <code class="code">src/styles/theme.css</code>. Dark-only permanente — sem dual theme.</p>

      <div class="ds-swatches">
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#0b0a0d;border-bottom:1px solid rgba(255,255,255,.05)"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--bg</div><div class="ds-swatch-value">#0b0a0d</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#0e0c11"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--bg-2</div><div class="ds-swatch-value">#0e0c11</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#131017"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--surface</div><div class="ds-swatch-value">#131017</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#181420"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--surface-2</div><div class="ds-swatch-value">#181420</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#f4f1f5"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--ink</div><div class="ds-swatch-value">#f4f1f5</div><div class="ds-swatch-ratio pass">✅ 14.4:1 AAA</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#cbc4d2"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--ink-2</div><div class="ds-swatch-value">#cbc4d2</div><div class="ds-swatch-ratio pass">✅ 9.8:1 AAA</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#9a8fa3"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--muted</div><div class="ds-swatch-value">#9a8fa3</div><div class="ds-swatch-ratio pass">✅ 4.8:1 AA</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#6e6678"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--dim</div><div class="ds-swatch-value">#6e6678</div><div class="ds-swatch-ratio fail">⚠️ 3.0:1 FALHA</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#e1379e"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--magenta</div><div class="ds-swatch-value">#e1379e</div><div class="ds-swatch-ratio pass">✅ 4.6:1 AA</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:linear-gradient(135deg,#e1379e,#b21e97)"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--magenta-deep</div><div class="ds-swatch-value">#b21e97</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:#ff53c8"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--pink</div><div class="ds-swatch-value">#ff53c8</div><div class="ds-swatch-ratio warn">hover/glow only</div></div>
        </div>
        <div class="ds-swatch">
          <div class="ds-swatch-color" style="background:rgba(255,255,255,0.07);border:1px dashed rgba(255,255,255,.1)"></div>
          <div class="ds-swatch-info"><div class="ds-swatch-name">--hair</div><div class="ds-swatch-value">rgba(255,255,255,.07)</div></div>
        </div>
      </div>

      <p style="font-size:13px;color:var(--warn);padding:14px 18px;background:rgba(225,179,58,.08);border:1px solid rgba(225,179,58,.2);border-radius:10px">
        ⚠️ <strong>--dim (#6e6678)</strong> falha WCAG AA para texto normal (ratio 3.0:1 vs --surface). Use apenas em labels mono uppercase. Para texto corrido, use --muted (4.8:1 ✅).
      </p>
    </section>

    <!-- TIPOGRAFIA -->
    <section class="ds-section" id="typography">
      <div class="ds-section-label">02 · Tipografia</div>
      <h2 class="ds-h">Stack de Fontes</h2>

      <div style="background:var(--surface);border:1px solid var(--hair);border-radius:14px;overflow:hidden;margin-bottom:32px">
        <div class="ds-type-row" style="padding:24px 28px">
          <div class="ds-type-meta">
            <strong>--font-display</strong>
            Fraunces · Display<br>
            opsz 9–144 · italic real<br>
            pesos: 300–700
          </div>
          <div style="font-family:'Fraunces',serif;font-size:clamp(28px,4vw,48px);font-weight:500;font-variation-settings:'opsz' 144;letter-spacing:-.03em;color:var(--ink)">
            Marketing medido
          </div>
        </div>
        <div class="ds-type-row" style="padding:24px 28px;border-top:1px solid var(--hair)">
          <div class="ds-type-meta">
            <strong>--font-display (italic)</strong>
            font-style: italic<br>
            opsz 36 · peso 400
          </div>
          <div style="font-family:'Fraunces',serif;font-size:28px;font-weight:400;font-variation-settings:'opsz' 36;font-style:italic;color:var(--ink-2);line-height:1.45">
            Em carro vendido no seu pátio.
          </div>
        </div>
        <div class="ds-type-row" style="padding:24px 28px;border-top:1px solid var(--hair)">
          <div class="ds-type-meta">
            <strong>--font-body</strong>
            Hanken Grotesk · Body<br>
            16.5px · lh 1.72<br>
            peso 400
          </div>
          <div style="font-family:'Hanken Grotesk',sans-serif;font-size:16.5px;line-height:1.72;color:rgb(203,196,210);max-width:52ch">
            Sua agência manda relatório de lead toda semana. Relatório de venda por canal — alguém te mandou alguma vez? O que está invisível no seu painel pode ser seu canal mais barato.
          </div>
        </div>
        <div class="ds-type-row" style="padding:24px 28px;border-top:1px solid var(--hair)">
          <div class="ds-type-meta">
            <strong>--font-mono</strong>
            JetBrains Mono · Labels<br>
            10.5–12.5px · uppercase<br>
            letter-spacing .08–.22em
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--magenta)">RASTREIO · ANÁLISE</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">5 MIN DE LEITURA · 12 JUL 2026</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--dim)">guilherme ribeiro · 12/07/2026 · 5 min</span>
          </div>
        </div>
      </div>

      <!-- Heading hierarchy -->
      <h2 class="ds-h">Hierarquia de Títulos</h2>
      <div style="background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:32px 36px;margin-bottom:24px">
        <div style="font-family:'Fraunces',serif;font-size:clamp(32px,5vw,52px);font-weight:500;font-variation-settings:'opsz' 144;letter-spacing:-.03em;line-height:1.03;margin-bottom:6px;color:var(--ink)">H1 — Post Title <em style="font-style:italic;color:var(--magenta)">em Fraunces</em></div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:var(--dim);margin-bottom:32px">clamp(32px,5vw,58px) · opsz 144 · weight 500 · lh 1.03</div>

        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.2;margin-top:44px;margin-bottom:8px;color:var(--ink)">H2 — Seção Principal do Artigo</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:var(--dim);margin-bottom:16px">22px · weight 600 · --ink · margin-top 44px</div>

        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:600;letter-spacing:-.015em;margin-top:28px;margin-bottom:8px;color:var(--ink-2)">H3 — Subseção (cor --ink-2)</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:var(--dim);margin-bottom:16px">17px · weight 600 · --ink-2 · margin-top 28px</div>

        <div style="font-family:'Fraunces',serif;font-size:16px;font-weight:600;margin-top:20px;margin-bottom:6px;color:var(--ink)">H4 Editorial — dentro de card</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--magenta);margin-top:16px">H4 LABEL — MONO UPPERCASE MAGENTA</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:var(--dim)">10.5–11px · mono · uppercase · letter-spacing .14–.18em</div>
      </div>
    </section>

    <!-- LAYOUT -->
    <section class="ds-section" id="layout">
      <div class="ds-section-label">03 · Layout</div>
      <h2 class="ds-h">Sistema de Grid</h2>
      <table class="ds-table">
        <thead><tr><th>Token</th><th>Valor</th><th>Uso</th></tr></thead>
        <tbody>
          <tr><td><code class="code">--rail-w</code></td><td><code class="code">288px</code></td><td style="color:var(--ink-2)">Largura do sidebar rail</td></tr>
          <tr><td><code class="code">--measure</code></td><td><code class="code">760px</code></td><td style="color:var(--ink-2)">Largura máxima de leitura</td></tr>
          <tr><td>sr-shell max-width</td><td><code class="code">1560px</code></td><td style="color:var(--ink-2)">Container raiz</td></tr>
          <tr><td>sr-wrap max-width</td><td><code class="code">1080px</code></td><td style="color:var(--ink-2)">Conteúdo da home</td></tr>
          <tr><td>sr-post-shell max-width</td><td><code class="code">1280px</code></td><td style="color:var(--ink-2)">Container do post</td></tr>
          <tr><td>TOC column</td><td><code class="code">180px</code></td><td style="color:var(--ink-2)">Sidebar de TOC no artigo</td></tr>
          <tr><td>Mobile breakpoint</td><td><code class="code">≤900px</code></td><td style="color:var(--ink-2)">Rail colapsa, grids → 1 coluna</td></tr>
        </tbody>
      </table>
    </section>

    <!-- MOVIMENTO -->
    <section class="ds-section" id="motion">
      <div class="ds-section-label">04 · Movimento</div>
      <h2 class="ds-h">Tokens de Motion</h2>
      <p class="ds-desc">Passe o mouse sobre os cards para ver as transições. Motion é editorial — cada animação serve ao conteúdo.</p>

      <div class="ds-motion-grid">
        <div class="ds-motion-card" style="--dur:.25s;--e:ease">
          <div class="ds-motion-preview" style="transition:transform .25s ease"></div>
          <div class="ds-motion-label">--ease</div>
          <div class="ds-motion-value">cubic-bezier(.16,1,.3,1)</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">Spring padrão</div>
        </div>
        <div class="ds-motion-card">
          <div class="ds-motion-preview" style="transition:transform .35s cubic-bezier(.22,.61,.36,1)"></div>
          <div class="ds-motion-label">--ease-s</div>
          <div class="ds-motion-value">cubic-bezier(.22,.61,.36,1)</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">Transições suaves</div>
        </div>
        <div class="ds-motion-card">
          <div class="ds-motion-preview" style="transition:transform .25s"></div>
          <div class="ds-motion-label">Hover (cor/borda)</div>
          <div class="ds-motion-value">0.25s</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">background, color, border</div>
        </div>
        <div class="ds-motion-card">
          <div class="ds-motion-preview" style="transition:transform .5s cubic-bezier(.16,1,.3,1)"></div>
          <div class="ds-motion-label">Card hover</div>
          <div class="ds-motion-value">0.5s var(--ease)</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">translateY, box-shadow</div>
        </div>
        <div class="ds-motion-card">
          <div class="ds-motion-preview" style="transition:transform .7s cubic-bezier(.16,1,.3,1)"></div>
          <div class="ds-motion-label">sr-reveal</div>
          <div class="ds-motion-value">0.7s var(--ease)</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">scroll entrance</div>
        </div>
        <div class="ds-motion-card">
          <div class="ds-motion-preview" style="transition:transform 1.1s cubic-bezier(.16,1,.3,1)"></div>
          <div class="ds-motion-label">Hero image zoom</div>
          <div class="ds-motion-value">1.1s var(--ease)</div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">scale(1.05→1.1)</div>
        </div>
      </div>

      <style>
        .ds-motion-card:hover .ds-motion-preview{transform:scaleX(1)!important}
      </style>
    </section>

    <!-- ESPAÇAMENTO -->
    <section class="ds-section" id="spacing">
      <div class="ds-section-label">05 · Espaçamento</div>
      <h2 class="ds-h">Escala Implícita</h2>
      <p class="ds-desc">Valores mais usados nos componentes. Tokens recomendados para canonizar no theme.css.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[2,4,8,12,16,20,24,32,40,56,80,120].map((v,i) => `
          <div style="display:flex;align-items:center;gap:16px">
            <span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim);min-width:80px">--space-${i+1}</span>
            <div style="height:12px;background:var(--magenta);opacity:.7;border-radius:2px;width:${Math.min(v*2,600)}px"></div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted)">${v}px</span>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- BOTÕES -->
    <section class="ds-section" id="buttons">
      <div class="ds-section-label">06 · Botões & Ações</div>
      <h2 class="ds-h">Componentes de Ação</h2>
      <div class="ds-comp-grid">
        <div class="ds-comp-item">
          <div class="ds-comp-preview"><button class="demo-btn">Quero analisar ↗</button></div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-btn</div><div class="ds-comp-desc">CTA primário magenta · Fraunces 600</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview"><button class="demo-btn" style="background:#15803d;box-shadow:0 8px 22px rgba(21,128,61,.35)">WhatsApp ↗</button></div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-btn-wa</div><div class="ds-comp-desc">Variante WhatsApp · #15803d · 5.3:1 AA</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview" style="gap:12px;display:flex;flex-direction:column">
            <div class="demo-field"><input placeholder="seu@email.com"></div>
          </div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-field</div><div class="ds-comp-desc">Input com border-focus magenta</div></div>
        </div>
      </div>
    </section>

    <!-- LABELS -->
    <section class="ds-section" id="labels">
      <div class="ds-section-label">07 · Labels & Metadados</div>
      <h2 class="ds-h">Sistema de Labels</h2>
      <div class="ds-comp-grid">
        <div class="ds-comp-item">
          <div class="ds-comp-preview"><span class="demo-eyebrow">Rastreio de Canal</span></div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-eyebrow</div><div class="ds-comp-desc">Mono · magenta · regra 30px</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview"><span class="demo-kicker">Analytics · Automotivo</span></div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-kicker</div><div class="ds-comp-desc">Mono · 10.5px · --muted</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview" style="gap:10px;display:flex;flex-wrap:wrap">
            <span class="demo-tag">Rastreio</span>
            <span class="demo-tag">Analytics</span>
            <span class="demo-tag">Portal</span>
          </div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-tag</div><div class="ds-comp-desc">Pill mono · border hair · hover magenta</div></div>
        </div>
      </div>
    </section>

    <!-- CARDS -->
    <section class="ds-section" id="cards">
      <div class="ds-section-label">08 · Cards</div>
      <h2 class="ds-h">Sistema de Cards</h2>
      <div class="ds-comp-grid">
        <div class="ds-comp-item">
          <div class="ds-comp-preview" style="padding:16px">
            <div class="demo-card-mini">
              <span class="demo-kicker">Analytics</span>
              <h3>847 leads. 9 vendas. Ninguém calculou isso.</h3>
              <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim);margin-top:12px">12 JUL 2026 · 5 MIN</div>
            </div>
          </div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-card</div><div class="ds-comp-desc">Card padrão · thumb 16:10 · hover -5px</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview">
            <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:500;font-style:italic;color:var(--ink);border-left:2px solid var(--magenta);padding-left:16px;max-width:22ch;line-height:1.22">
              "Pago oito mil por mês e ainda não sei de onde vem minha venda."
            </div>
          </div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-pull</div><div class="ds-comp-desc">Pull quote · Fraunces italic 31px</div></div>
        </div>
        <div class="ds-comp-item">
          <div class="ds-comp-preview" style="padding:16px">
            <div class="demo-tldr">
              <h4>TL;DR</h4>
              <ul>
                <li>847 leads. 9 vendas rastreadas.</li>
                <li>Indicação é o canal invisível.</li>
                <li>A solução cabe numa planilha.</li>
              </ul>
            </div>
          </div>
          <div class="ds-comp-label"><div class="ds-comp-name">.sr-tldr</div><div class="ds-comp-desc">Summary box · mono header magenta</div></div>
        </div>
      </div>
    </section>

    <!-- PROSE -->
    <section class="ds-section" id="prose">
      <div class="ds-section-label">09 · Prose & Artigo</div>
      <h2 class="ds-h">Componentes de Artigo</h2>
      <div style="background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:32px 36px">
        <div style="font-family:'Fraunces',serif;font-size:clamp(24px,4vw,40px);font-weight:500;font-variation-settings:'opsz' 144;letter-spacing:-.03em;line-height:1.05;margin-bottom:6px;color:var(--ink)">
          Uma revenda cancelou o Webmotors.
          <em style="font-style:italic;color:var(--magenta)">Não sumiu do mapa.</em>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:var(--dim);margin-bottom:28px">RASTREIO · 12 JUL 2026 · 5 MIN</div>

        <div style="font-family:'Fraunces',serif;font-weight:400;font-variation-settings:'opsz' 36;font-size:22px;line-height:1.45;font-style:italic;color:var(--ink-2);margin-bottom:28px">
          Ela descobriu que 60% das suas vendas vinham de canais que nenhuma agência estava rastreando. Esta é a história de como ela fez isso.
        </div>

        <div style="font-family:'Hanken Grotesk',sans-serif;font-size:16.5px;line-height:1.72;color:rgb(203,196,210)">
          <p>O que a maioria das revendas não sabe é que o painel da agência rastreia onde o <em>lead</em> veio, não onde a <strong style="color:var(--ink);font-weight:600">venda</strong> veio. São dois dados completamente diferentes.</p>
        </div>
      </div>
    </section>

    <!-- LEAD CAPTURE -->
    <section class="ds-section" id="lead">
      <div class="ds-section-label">10 · Lead Capture</div>
      <h2 class="ds-h">Componentes de Conversão</h2>
      <div style="border:1px solid var(--hair-mag);border-left:2px solid var(--magenta);border-radius:13px;padding:24px 26px;background:var(--surface);margin-bottom:24px">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--magenta);margin-bottom:8px">FERRAMENTA GRATUITA</div>
        <h4 style="font-family:'Fraunces',serif;font-weight:600;font-size:21px;margin-bottom:6px">Calculadora de CAC por Canal</h4>
        <p style="font-size:14.5px;color:var(--ink-2);margin-bottom:14px">Descubra quanto você paga por venda em cada canal. Leva 3 minutos.</p>
        <div style="display:flex;gap:10px;max-width:440px">
          <div class="demo-field" style="flex:1"><input placeholder="seu@email.com"></div>
          <button class="demo-btn" style="font-size:13px;padding:10px 16px;border-radius:10px">Quero →</button>
        </div>
      </div>
      <p style="font-size:13px;color:var(--dim)">↑ .sr-cu — Content Upgrade inline com border-left magenta</p>
    </section>

    <!-- WCAG -->
    <section class="ds-section" id="wcag">
      <div class="ds-section-label">11 · WCAG 2.1 AA</div>
      <h2 class="ds-h">Tabela de Contraste</h2>

      <table class="ds-table wcag-row">
        <thead><tr><th>Foreground</th><th>Background</th><th>Ratio</th><th>Status</th><th>Uso</th></tr></thead>
        <tbody>
          <tr>
            <td><span class="wcag-swatch" style="background:#f4f1f5"></span><code class="code">--ink</code></td>
            <td><span class="wcag-swatch" style="background:#131017"></span><code class="code">--surface</code></td>
            <td><strong>14.4:1</strong></td>
            <td class="pass">✅ AAA</td>
            <td style="color:var(--ink-2)">Títulos, texto principal</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#cbc4d2"></span><code class="code">--ink-2</code></td>
            <td><span class="wcag-swatch" style="background:#131017"></span><code class="code">--surface</code></td>
            <td><strong>9.8:1</strong></td>
            <td class="pass">✅ AAA</td>
            <td style="color:var(--ink-2)">Texto secundário, corpo</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#9a8fa3"></span><code class="code">--muted</code></td>
            <td><span class="wcag-swatch" style="background:#131017"></span><code class="code">--surface</code></td>
            <td><strong>4.8:1</strong></td>
            <td class="pass">✅ AA</td>
            <td style="color:var(--ink-2)">Texto de suporte, placeholders</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#6e6678"></span><code class="code">--dim</code></td>
            <td><span class="wcag-swatch" style="background:#131017"></span><code class="code">--surface</code></td>
            <td><strong>3.0:1</strong></td>
            <td class="fail">❌ FALHA</td>
            <td style="color:var(--warn)">Somente labels mono uppercase!</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#6e6678"></span><code class="code">--dim</code></td>
            <td><span class="wcag-swatch" style="background:#0b0a0d"></span><code class="code">--bg</code></td>
            <td><strong>3.4:1</strong></td>
            <td class="fail">❌ FALHA</td>
            <td style="color:var(--warn)">Somente labels mono uppercase!</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#e1379e"></span><code class="code">--magenta</code></td>
            <td><span class="wcag-swatch" style="background:#0b0a0d"></span><code class="code">--bg</code></td>
            <td><strong>4.6:1</strong></td>
            <td class="pass">✅ AA</td>
            <td style="color:var(--ink-2)">Links, CTAs sobre fundo</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#fff"></span><code class="code">#fff</code></td>
            <td><span class="wcag-swatch" style="background:#e1379e"></span><code class="code">--magenta</code></td>
            <td><strong>4.1:1</strong></td>
            <td class="pass">✅ AA (≥14px bold)</td>
            <td style="color:var(--ink-2)">Texto em botão magenta</td>
          </tr>
          <tr>
            <td><span class="wcag-swatch" style="background:#fff"></span><code class="code">#fff</code></td>
            <td><span class="wcag-swatch" style="background:#15803d"></span><code class="code">#15803d</code></td>
            <td><strong>5.3:1</strong></td>
            <td class="pass">✅ AA</td>
            <td style="color:var(--ink-2)">Botão WhatsApp</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- TOKEN GAPS -->
    <section class="ds-section" id="gaps">
      <div class="ds-section-label">12 · Token Gaps</div>
      <h2 class="ds-h">Tokens Ausentes (a adicionar)</h2>
      <p class="ds-desc">Tokens identificados nos componentes mas não definidos no theme.css. Adicionar na próxima sprint de infra (T1).</p>

      <table class="ds-table">
        <thead><tr><th>Categoria</th><th>Tokens</th><th>Prioridade</th></tr></thead>
        <tbody>
          <tr><td style="color:var(--ink-2)">Status</td><td><code class="code">--pos --neg --warn --info</code></td><td><span style="color:var(--warn)">Média</span></td></tr>
          <tr><td style="color:var(--ink-2)">Dataviz</td><td><code class="code">--chart-1 ... --chart-7</code></td><td><span style="color:var(--dim)">Baixa</span></td></tr>
          <tr><td style="color:var(--ink-2)">Escala tipográfica</td><td><code class="code">--text-xs ... --text-hero</code></td><td><span style="color:var(--warn)">Média</span></td></tr>
          <tr><td style="color:var(--ink-2)">Line-height</td><td><code class="code">--lh-tight --lh-snug --lh-normal --lh-relaxed</code></td><td><span style="color:var(--warn)">Média</span></td></tr>
          <tr><td style="color:var(--ink-2)">Pesos de fonte</td><td><code class="code">--weight-light ... --weight-bold</code></td><td><span style="color:var(--dim)">Baixa</span></td></tr>
          <tr><td style="color:var(--ink-2)">Espaçamento</td><td><code class="code">--space-1 ... --space-12</code></td><td><span style="color:var(--warn)">Média</span></td></tr>
          <tr><td style="color:var(--ink-2)">Raio de borda</td><td><code class="code">--r-xs --r-sm --r-md --r-lg --r-full</code></td><td><span style="color:var(--dim)">Baixa</span></td></tr>
          <tr><td style="color:var(--ink-2)">Duração de motion</td><td><code class="code">--duration-instant ... --duration-slower</code></td><td><span style="color:var(--dim)">Baixa</span></td></tr>
          <tr><td style="color:var(--ink-2)">Easing estendido</td><td><code class="code">--ease-out --ease-standard --ease-entrance --ease-exit</code></td><td><span style="color:var(--dim)">Baixa</span></td></tr>
          <tr><td style="color:var(--neg)">Focus ring global</td><td><code class="code">:focus-visible em showroom.css</code></td><td><span style="color:var(--neg)">Alta (WCAG)</span></td></tr>
          <tr><td style="color:var(--neg)">OG image dark</td><td><code class="code">background dark em og.png.ts</code></td><td><span style="color:var(--neg)">Alta</span></td></tr>
        </tbody>
      </table>
    </section>

    <!-- GATES -->
    <section class="ds-section" id="gates">
      <div class="ds-section-label">13 · Gates de Qualidade</div>
      <h2 class="ds-h">Checklist de Publicação</h2>

      <div class="ds-gate">
        <h3>G1 — Color Gate</h3>
        <ul>
          <li>Nenhum texto body usa --dim como cor</li>
          <li>Magenta &lt; 5% da área visual por viewport</li>
          <li>Nenhuma cor inventada fora da paleta de tokens</li>
          <li>Background sempre dark (#0b0a0d ou #131017)</li>
        </ul>
      </div>

      <div class="ds-gate">
        <h3>G2 — Typography Gate</h3>
        <ul>
          <li>H1 usa Fraunces com opsz 144, clamp(32px,5vw,58px)</li>
          <li>Corpo do artigo: Hanken Grotesk 16.5px / lh 1.72</li>
          <li>Labels técnicos: JetBrains Mono uppercase letter-spacing ≥.08em</li>
          <li>Nenhum texto abaixo de 10.5px (--text-xs)</li>
          <li>1 H1 único por página</li>
          <li>Sem pular níveis de heading (H1→H3 sem H2)</li>
        </ul>
      </div>

      <div class="ds-gate">
        <h3>G3 — Image Gate</h3>
        <ul>
          <li>Cover image ≥ 1200px de largura</li>
          <li>OG image usa fundo escuro (#0b0a0d)</li>
          <li>Todo &lt;img&gt; tem alt descritivo (≤125 chars, não vazio)</li>
          <li>Nome de arquivo: keyword-contexto-cover.webp</li>
          <li>Imagens inline em &lt;figure&gt; + &lt;figcaption&gt;</li>
        </ul>
      </div>

      <div class="ds-gate">
        <h3>G4 — Motion Gate</h3>
        <ul>
          <li>Todo .sr-reveal tem @media (prefers-reduced-motion) override</li>
          <li>Nenhuma animação duration &gt; 1s sem justificativa editorial</li>
          <li>Máximo 1 orb por página</li>
        </ul>
      </div>

      <div class="ds-gate">
        <h3>G5 — WCAG Gate</h3>
        <ul>
          <li>Nenhum texto falha WCAG AA (min 4.5:1 texto normal, 3:1 texto grande)</li>
          <li>--dim somente em labels mono uppercase</li>
          <li>Todos os elementos interativos têm :focus-visible (2px magenta)</li>
          <li>Estrutura de headings hierárquica</li>
        </ul>
      </div>

      <div class="ds-gate">
        <h3>Build & Deploy</h3>
        <ul>
          <li>Build verde: node --trace-uncaught node_modules/.bin/astro build</li>
          <li>Sprint 4 SEO pipeline intacto (cron publica a cada 30min)</li>
          <li>OG testada no WhatsApp preview</li>
        </ul>
      </div>

      <p style="text-align:center;margin-top:40px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim);letter-spacing:.1em">
        DOCS COMPLETOS → <a href="/admin" style="color:var(--magenta)">docs/design-system/</a> no repositório
      </p>
    </section>

  </main>
</div>

<script>
  // Highlight active nav link on scroll
  const sections = document.querySelectorAll('.ds-section[id]');
  const navLinks = document.querySelectorAll('.ds-nav a[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + entry.target.id ? 'var(--magenta)' : '';
          a.style.background = a.getAttribute('href') === '#' + entry.target.id ? 'rgba(225,55,158,.08)' : '';
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));
</script>
</body>
</html>`;
}
