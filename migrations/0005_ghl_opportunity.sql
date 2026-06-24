-- Migration 0005: adiciona coluna ghl_opportunity_id em leads (blog-dimus, 2026-06-24)
ALTER TABLE leads ADD COLUMN ghl_opportunity_id TEXT DEFAULT '';
