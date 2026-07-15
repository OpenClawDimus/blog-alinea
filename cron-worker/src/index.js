import { getAccessToken } from './google-auth.js';
import { fetchGa4Daily, fetchGscDaily } from './ga4-gsc-fetch.js';

async function runSync(env) {
  const accessToken = await getAccessToken(env);
  const nowSec = Math.floor(Date.now() / 1000);

  const [ga4Rows, gscRows] = await Promise.all([
    fetchGa4Daily(accessToken, env.GA4_PROPERTY_ID),
    fetchGscDaily(accessToken, env.GSC_SITE_URL),
  ]);

  let ga4Written = 0;
  for (const r of ga4Rows) {
    await env.DB.prepare(`
      INSERT INTO ga4_daily (date, channel_group, sessions, engaged_sessions, generate_lead_events, fetched_at)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(date, channel_group) DO UPDATE SET
        sessions=excluded.sessions, engaged_sessions=excluded.engaged_sessions,
        generate_lead_events=excluded.generate_lead_events, fetched_at=excluded.fetched_at
    `).bind(r.date, r.channel_group, r.sessions, r.engaged_sessions, r.generate_lead_events, nowSec).run();
    ga4Written++;
  }

  let gscWritten = 0;
  for (const r of gscRows) {
    await env.DB.prepare(`
      INSERT INTO gsc_daily (date, page, query, clicks, impressions, position_sum, fetched_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(date, page, query) DO UPDATE SET
        clicks=excluded.clicks, impressions=excluded.impressions,
        position_sum=excluded.position_sum, fetched_at=excluded.fetched_at
    `).bind(r.date, r.page, r.query, r.clicks, r.impressions, r.position_sum, nowSec).run();
    gscWritten++;
  }

  return { ga4Written, gscWritten, ga4Rows: ga4Rows.length, gscRows: gscRows.length };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env).catch((e) => console.error('[cron-sync]', e && e.message)));
  },

  // Trigger manual pra smoke-test (GET /?token=<GSC_GA4_ENABLED>) -- nao
  // exposto ao publico, so pra validar o pipeline uma vez antes de confiar
  // no cron diario.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.MANUAL_TRIGGER_TOKEN || url.searchParams.get('token') !== env.MANUAL_TRIGGER_TOKEN) {
      return new Response('forbidden', { status: 403 });
    }
    try {
      const result = await runSync(env);
      return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  },
};
