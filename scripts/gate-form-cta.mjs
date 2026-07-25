#!/usr/bin/env node
/**
 * gate-form-cta.mjs — Hormozi CTA Spacing Gate
 *
 * Prevents the "double-form-at-end" anti-pattern:
 *   BAD  → both <LeadForm> and <DimusHelp> in the last 20% of the article
 *   BAD  → two forms within 15% of each other anywhere
 *
 * Posts with 0 or 1 form component pass automatically.
 * Posts with ≥2 forms must have them separated by ≥20% of total lines,
 * and the first form must appear before the 80% mark.
 *
 * Usage: node scripts/gate-form-cta.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const mdxDir = join(ROOT, "src/content/posts");
const files = readdirSync(mdxDir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => join(mdxDir, f));

const FORM_RE = /^<(LeadForm|DimusHelp)[\s\/>]/;
const violations = [];

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  const total = lines.length;
  const formLines = lines
    .map((l, i) => (FORM_RE.test(l.trim()) ? i + 1 : null))
    .filter(Boolean);

  if (formLines.length < 2) continue; // 0 or 1 form: no spacing issue possible

  const first = formLines[0];
  const last = formLines[formLines.length - 1];
  const firstPct = Math.round((first / total) * 100);
  const gap = Math.round(((last - first) / total) * 100);
  const slug = file.split("/").pop();

  if (firstPct > 80) {
    violations.push(
      `${slug}: first form at ${firstPct}% (line ${first}/${total}) — both forms clustered at end. Move first form to ≤75% (mid-article soft ask).`
    );
  } else if (gap < 20) {
    violations.push(
      `${slug}: forms only ${gap}% apart (lines ${first}→${last}) — too close. Need ≥20% separation between mid and end CTA.`
    );
  }
}

if (violations.length > 0) {
  console.error("\n❌ gate-form-cta — CTA spacing violations:\n");
  violations.forEach((v) => console.error("  •", v));
  console.error(
    "\nHormozi rule: mid-article = diagnostic/soft ask (≤75%), end = implementation/hard ask. Gap ≥20%.\n"
  );
  process.exit(1);
}

console.log(`✅ gate-form-cta: ${files.length} posts checked — all pass`);
