-- Migration 0007: adiciona coluna ghl_sync_pending em leads (blog-dimus, DA-002)
-- Sinaliza leads onde o GHL upsert falhou e o ghl_contact_id ficou vazio.
ALTER TABLE leads ADD COLUMN ghl_sync_pending INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_leads_ghl_sync_pending ON leads(ghl_sync_pending, created_at DESC);
