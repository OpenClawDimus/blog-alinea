-- Migration 0009: tabelas de pre-agregacao GA4/GSC (Wave 4)
-- Populadas 1x/dia por um Worker cron separado (Cloudflare Pages nao expoe
-- scheduled()). O admin.js NUNCA chama googleapis.com diretamente -- sempre
-- le destas tabelas. Ver estudo de tracking wf_f26e1b8f-44a.
CREATE TABLE IF NOT EXISTS ga4_daily (
  date              TEXT    NOT NULL,
  channel_group     TEXT    NOT NULL DEFAULT '(all)',
  sessions          INTEGER NOT NULL DEFAULT 0,
  engaged_sessions  INTEGER NOT NULL DEFAULT 0,
  generate_lead_events INTEGER NOT NULL DEFAULT 0,
  fetched_at        INTEGER NOT NULL,
  PRIMARY KEY (date, channel_group)
);

CREATE TABLE IF NOT EXISTS gsc_daily (
  date          TEXT    NOT NULL,
  page          TEXT    NOT NULL,
  query         TEXT    NOT NULL DEFAULT '',
  clicks        INTEGER NOT NULL DEFAULT 0,
  impressions   INTEGER NOT NULL DEFAULT 0,
  position_sum  REAL    NOT NULL DEFAULT 0,
  fetched_at    INTEGER NOT NULL,
  PRIMARY KEY (date, page, query)
);

CREATE INDEX IF NOT EXISTS idx_ga4_daily_date ON ga4_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_date ON gsc_daily(date DESC);
