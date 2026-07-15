/**
 * JWT-bearer OAuth2 pra Google APIs (GA4 Data API + Search Console API) via
 * crypto.subtle -- sem SDK Node (Workers nao rodam googleapis npm package).
 * Token cacheado em KV (~55min) pra nao mintar um novo a cada chamada.
 */

function base64url(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

async function signJwt(clientEmail, privateKeyPem, scopes) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const encHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encClaim = base64url(new TextEncoder().encode(JSON.stringify(claim)));
  const signingInput = `${encHeader}.${encClaim}`;

  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64url(signature)}`;
}

// Retorna um access_token valido, do cache KV ou mintado na hora.
// Escopos combinados (GA4 readonly + GSC readonly) -- 1 token serve os dois.
export async function getAccessToken(env) {
  const CACHE_KEY = 'google_access_token';
  if (env.TOKEN_CACHE) {
    const cached = await env.TOKEN_CACHE.get(CACHE_KEY);
    if (cached) return cached;
  }

  const jwt = await signJwt(env.GA4_SA_CLIENT_EMAIL, env.GA4_SA_PRIVATE_KEY, [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ]);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`token exchange failed: ${resp.status} ${t.slice(0, 300)}`);
  }
  const { access_token, expires_in } = await resp.json();
  if (env.TOKEN_CACHE) {
    await env.TOKEN_CACHE.put(CACHE_KEY, access_token, { expirationTtl: Math.max(60, (expires_in || 3600) - 300) });
  }
  return access_token;
}
