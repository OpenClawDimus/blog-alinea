-- blog.dimus.com.br — Migration 0002 — Admin: catálogo finito de magnets + page_views
-- Apply: via wrangler d1 migrations apply blog-tracking --remote (ou CF MCP).

-- ── Catálogo FINITO de lead magnets (anti-proliferação) ──────────────────────
-- Fonte de verdade do que existe. Admin lê downloads/magnet fazendo JOIN com
-- magnet_downloads. Novo magnet = nova linha aqui (deliberado), nunca string solta.
CREATE TABLE IF NOT EXISTS lead_magnets (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  cluster    TEXT DEFAULT '',
  type       TEXT DEFAULT '',          -- calc | quiz | checklist | mini-aula
  active     INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- ── Page views: 1 por request de página HTML (analytics views/post) ──────────
CREATE TABLE IF NOT EXISTS page_views (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT DEFAULT '',
  post_slug   TEXT DEFAULT '',          -- derivado de /posts/<slug>/ (vazio p/ não-post)
  path        TEXT DEFAULT '',
  referrer    TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  country     TEXT DEFAULT '',
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pv_post    ON page_views(post_slug);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at DESC);

-- ── Seed do catálogo FINITO (anti-proliferação). 3 magnets canônicos. ────────
-- slugs batem com magnet="…" nos componentes (Calculator/CalculatorCAC/QuizPortal).
INSERT OR IGNORE INTO lead_magnets (slug, title, cluster, type, active, created_at) VALUES
  ('calc-carro-parado',      'Calculadora de Custo do Carro Parado', 'estoque-giro', 'calc', 1, unixepoch('now')),
  ('calc-cac-carro-vendido', 'Calculadora de CAC por Carro Vendido', 'atribuicao',   'calc', 1, unixepoch('now')),
  ('quiz-refem-portal',      'Diagnóstico: Você é Refém do Portal?', 'portal',       'quiz', 1, unixepoch('now'));
