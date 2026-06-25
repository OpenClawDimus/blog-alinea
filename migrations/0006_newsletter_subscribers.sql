-- blog.dimus.com.br — Migration 0006 — Newsletter Subscribers dedup table
-- Tabela separada para dedup rápido de newsletter: evita welcome email duplicado
-- e permite early-exit sem tocar na tabela leads.
-- Apply: wrangler d1 execute blog-tracking --remote --file=migrations/0006_newsletter_subscribers.sql

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  nome       TEXT    DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
