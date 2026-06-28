-- Migration: Blog → Blueprint leads forward (anon key, INSERT/UPSERT only)
--
-- Context: CF Worker tracker.js forwards blog leads to Supabase project
-- tllelzquwdfcjjlsurai using POST /rest/v1/leads?on_conflict=email with
-- Prefer: resolution=merge-duplicates. Previously required service_role key,
-- which bypasses all RLS. This migration replaces that with anon key + RLS
-- policy that is INSERT/UPDATE-only, scoped to blog submissions.
--
-- After applying:
--   1. Rotate BLUEPRINT_SUPABASE_KEY secret to the Supabase anon (public) key.
--      wrangler pages secret put BLUEPRINT_SUPABASE_KEY --project-name blog-dimus
--   2. Verify smoke: POST /rest/v1/leads?on_conflict=email with anon key and
--      ig_data_source='form_submitted' must return 201/200.
--   3. Revoke / delete the service_role key that was previously set as secret.

-- Enable RLS on leads table (safe to run if already enabled).
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anon role to INSERT blog leads.
-- Condition: ig_data_source must be 'form_submitted' and source must be 'blog'.
-- This is enforced both on the WITH CHECK clause AND the row values sent by the
-- Worker, providing defence-in-depth.
CREATE POLICY blog_anon_insert ON leads
  FOR INSERT
  TO anon
  WITH CHECK (
    ig_data_source = 'form_submitted'
    AND source = 'blog'
  );

-- Allow anon role to UPDATE existing leads on conflict (UPSERT).
-- Restrict to rows that were originally sourced from blog to prevent
-- anon from overwriting leads that arrived via other channels.
CREATE POLICY blog_anon_update ON leads
  FOR UPDATE
  TO anon
  USING (source = 'blog')
  WITH CHECK (
    ig_data_source = 'form_submitted'
    AND source = 'blog'
  );

-- Deny SELECT to anon (no read access for blog Worker).
-- Authenticated roles retain their existing access.
-- No explicit SELECT policy for anon = denied by default.
