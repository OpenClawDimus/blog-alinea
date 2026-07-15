-- Migration 0008: filtro de bot em sessions/page_views (blog-dimus)
-- Achado 2026-07-14: ~94% das sessions vinham de user-agents axios/curl (scripts
-- automatizados, não leitores reais) — _middleware.js gravava toda request sem
-- filtro. Nunca DELETE — coluna is_bot marca, raw fica preservado pra auditoria.
ALTER TABLE sessions ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0;
ALTER TABLE page_views ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sessions_is_bot ON sessions(is_bot, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_is_bot ON page_views(is_bot, created_at DESC);

-- Backfill retroativo: marca como bot os padrões literais de tooling/scripts
-- conhecidos (axios, curl — responsáveis por ~94% da poluição confirmada).
UPDATE sessions SET is_bot = 1
WHERE user_agent LIKE 'axios/%'
   OR user_agent LIKE 'curl/%'
   OR user_agent LIKE '%python-requests%'
   OR user_agent LIKE '%python-urllib%'
   OR user_agent LIKE '%Go-http-client%'
   OR user_agent LIKE '%Scrapy%'
   OR user_agent LIKE '%HeadlessChrome%'
   OR user_agent LIKE '%bot%'
   OR user_agent LIKE '%spider%'
   OR user_agent LIKE '%crawler%'
   OR user_agent LIKE '%Postman%'
   OR user_agent LIKE '%Insomnia%';

-- Propaga a marcação pra page_views via join por session_id.
UPDATE page_views SET is_bot = 1
WHERE session_id IN (SELECT session_id FROM sessions WHERE is_bot = 1);
