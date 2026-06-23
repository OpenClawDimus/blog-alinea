-- blog.dimus.com.br — Tracking KROB (Cloudflare D1)
-- Migration 0001 — schema consolidado (greenfield).
-- Apply: node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply blog-tracking --remote
--
-- Padrão KROB herdado do dimus-usa (live-verified), adaptado ao blog:
--   • mercado BR (telefone normalizado com DDI 55 no tracker)
--   • dimensões editoriais: post_slug, cluster, magnet_slug
--   • tabela magnet_downloads = biblioteca FINITA de lead magnets (downloads por magnet)

-- ── Sessões: uma por visitante único (_krob_sid cookie), first-touch lock-in ──
CREATE TABLE IF NOT EXISTS sessions (
  session_id   TEXT PRIMARY KEY,
  external_id  TEXT DEFAULT '',
  fbclid       TEXT DEFAULT '',
  gclid        TEXT DEFAULT '',
  msclkid      TEXT DEFAULT '',
  fbc          TEXT DEFAULT '',
  fbp          TEXT DEFAULT '',
  ip_address   TEXT DEFAULT '',
  user_agent   TEXT DEFAULT '',
  referrer     TEXT DEFAULT '',
  landing_url  TEXT DEFAULT '',
  utm_source   TEXT DEFAULT '',
  utm_medium   TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  utm_content  TEXT DEFAULT '',
  utm_term     TEXT DEFAULT '',
  campaign_id  TEXT DEFAULT '',
  adset_id     TEXT DEFAULT '',
  ad_id        TEXT DEFAULT '',
  placement    TEXT DEFAULT '',
  country      TEXT DEFAULT '',
  region       TEXT DEFAULT '',
  city         TEXT DEFAULT '',
  postal_code  TEXT DEFAULT '',
  timezone     TEXT DEFAULT '',
  asn          TEXT DEFAULT '',
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);

-- ── Leads: um por submit do form-first→WhatsApp ──────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id         TEXT    DEFAULT '',
  lead_ref           TEXT    NOT NULL,         -- ID visível no WhatsApp "[ID:XXXX]"
  event_id           TEXT    NOT NULL,         -- dedup pixel↔CAPI
  event_time         INTEGER NOT NULL,
  event_name         TEXT    NOT NULL DEFAULT '',
  lead_name          TEXT    DEFAULT '',       -- PII texto plano (admin)
  lead_phone         TEXT    DEFAULT '',       -- PII texto plano (admin)
  wa_phone           TEXT    DEFAULT '',       -- telefone normalizado E.164 (dígitos)
  -- dimensões editoriais do blog
  post_slug          TEXT    DEFAULT '',
  cluster            TEXT    DEFAULT '',
  magnet_slug        TEXT    DEFAULT '',
  -- identidade / device
  ip_address         TEXT    DEFAULT '',
  user_agent         TEXT    DEFAULT '',
  fbp                TEXT    DEFAULT '',
  fbc                TEXT    DEFAULT '',
  -- atribuição
  utm_source         TEXT    DEFAULT '',
  utm_medium         TEXT    DEFAULT '',
  utm_campaign       TEXT    DEFAULT '',
  utm_content        TEXT    DEFAULT '',
  utm_term           TEXT    DEFAULT '',
  ctwa_clid          TEXT    DEFAULT '',
  campaign_id        TEXT    DEFAULT '',
  adset_id           TEXT    DEFAULT '',
  ad_id              TEXT    DEFAULT '',
  placement          TEXT    DEFAULT '',
  -- diagnóstico CAPI
  page_url           TEXT    DEFAULT '',
  meta_status_code   INTEGER DEFAULT 0,
  meta_response_ok   INTEGER DEFAULT 0,
  meta_response_body TEXT    DEFAULT '',
  meta_payload_sent  TEXT    DEFAULT '',
  -- device/geo (enriquecimento CF edge)
  device_type        TEXT    DEFAULT '',
  browser            TEXT    DEFAULT '',
  os                 TEXT    DEFAULT '',
  country            TEXT    DEFAULT '',
  city               TEXT    DEFAULT '',
  -- confirmação WhatsApp (loop KROB [ID])
  confirmed_at       INTEGER DEFAULT 0,
  capi_confirmed_at  INTEGER DEFAULT 0,
  created_at         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ref     ON leads(lead_ref);
CREATE INDEX IF NOT EXISTS idx_leads_post    ON leads(post_slug);
CREATE INDEX IF NOT EXISTS idx_leads_cluster ON leads(cluster);
CREATE INDEX IF NOT EXISTS idx_leads_magnet  ON leads(magnet_slug);

-- ── Magnet downloads: biblioteca FINITA de lead magnets (downloads por magnet) ─
-- Cada submit com magnet_slug grava 1 row aqui → admin lê downloads/magnet sem
-- planilha externa. magnet_slug é a chave canônica (catálogo finito, anti-proliferação).
CREATE TABLE IF NOT EXISTS magnet_downloads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_ref    TEXT    NOT NULL,
  magnet_slug TEXT    NOT NULL,
  post_slug   TEXT    DEFAULT '',
  cluster     TEXT    DEFAULT '',
  session_id  TEXT    DEFAULT '',
  wa_phone    TEXT    DEFAULT '',
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_magnet_dl_slug    ON magnet_downloads(magnet_slug);
CREATE INDEX IF NOT EXISTS idx_magnet_dl_created ON magnet_downloads(created_at DESC);
