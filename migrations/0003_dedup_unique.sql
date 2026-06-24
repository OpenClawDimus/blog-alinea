-- blog.dimus.com.br — Migration 0003 — Dedup no banco (anti-duplicação)
-- Apply: wrangler d1 execute blog-tracking --remote --file=migrations/0003_dedup_unique.sql
--
-- Por que: leads.event_id é o id de dedup (pixel↔CAPI). Sem UNIQUE, um retry de
-- sendBeacon, double-click ou (futuro) reenvio cria linhas duplicadas com o mesmo
-- event_id → infla leads/downloads no admin. UNIQUE + ON CONFLICT DO NOTHING no
-- tracker.js fecha o buraco. magnet_downloads dedupa por lead_ref (1 download/submit).
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_event_id      ON leads(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_magnet_dl_lead_ref  ON magnet_downloads(lead_ref);
