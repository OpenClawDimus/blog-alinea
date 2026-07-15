/**
 * Chamadas REST puras GA4 Data API + GSC Search Analytics -- sem SDK.
 * Backoff simples em 429 (1 retry, espera 2s) -- volume e baixissimo (1x/dia).
 */

async function fetchWithRetry(url, opts) {
  const resp = await fetch(url, opts);
  if (resp.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return fetch(url, opts);
  }
  return resp;
}

// GA4 runReport -- sessions/engagedSessions/generate_lead por dia e canal,
// ultimos N dias (cron roda 1x/dia, mas pede janela curta pra cobrir atraso
// de processamento do GA4 sem duplicar linha -- INSERT OR REPLACE cobre).
export async function fetchGa4Daily(accessToken, propertyId, daysBack = 3) {
  const body = {
    dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
  };
  const resp = await fetchWithRetry(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) throw new Error(`GA4 runReport failed: ${resp.status} ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  const rows = (data.rows || []).map((r) => ({
    date: `${r.dimensionValues[0].value.slice(0, 4)}-${r.dimensionValues[0].value.slice(4, 6)}-${r.dimensionValues[0].value.slice(6, 8)}`,
    channel_group: r.dimensionValues[1].value || '(all)',
    sessions: Number(r.metricValues[0].value || 0),
    engaged_sessions: Number(r.metricValues[1].value || 0),
  }));

  // generate_lead events por dia (relatorio separado -- dimensao eventName)
  const leadBody = {
    dateRanges: [{ startDate: `${daysBack}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead' } } },
  };
  const leadResp = await fetchWithRetry(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(leadBody),
    }
  );
  const leadByDate = {};
  if (leadResp.ok) {
    const leadData = await leadResp.json();
    for (const r of leadData.rows || []) {
      const d = r.dimensionValues[0].value;
      const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      leadByDate[date] = (leadByDate[date] || 0) + Number(r.metricValues[0].value || 0);
    }
  }
  return rows.map((r) => ({ ...r, generate_lead_events: leadByDate[r.date] || 0 }));
}

// GSC searchAnalytics.query -- clicks/impressions/position por dia+pagina+query.
export async function fetchGscDaily(accessToken, siteUrl, daysBack = 3) {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const body = {
    startDate: fmt(start),
    endDate: fmt(end),
    dimensions: ['date', 'page', 'query'],
    rowLimit: 5000,
  };
  const resp = await fetchWithRetry(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) throw new Error(`GSC searchAnalytics failed: ${resp.status} ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  return (data.rows || []).map((r) => ({
    date: r.keys[0],
    page: r.keys[1],
    query: r.keys[2] || '',
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    // position_sum: soma ponderavel por impressions no admin.js (SUM(position_sum)/SUM(impressions))
    position_sum: (r.position || 0) * (r.impressions || 1),
  }));
}
