-- blog.dimus.com.br — Migration 0004 — GHL/Avantto (CRM source of truth)
-- Adiciona o ID cruzado do contato GHL ao lead D1 (mirror).
-- GHL/Avantto = CRM source of truth; Supabase = camada de dados; D1 = mirror.
-- Apply: wrangler d1 execute blog-tracking --remote --file=migrations/0004_ghl.sql

ALTER TABLE leads ADD COLUMN ghl_contact_id TEXT DEFAULT '';
