/**
 * Gate: Cover image integrity validation
 *
 * RULES (hard fail — build aborts):
 *   R1. No two posts may share the same coverImage path.
 *   R2. No two posts may share the same title (normalized).
 *   R3. coverImage must NOT point to a file in /og/ directory.
 *   R4. coverImage filename must NOT start with "og-".
 *
 * Run: node scripts/gate-covers.mjs
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const POSTS_DIR = new URL("../src/content/posts", import.meta.url).pathname;

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".mdx"));

const covers = new Map(); // coverPath → [slugs]
const titles = new Map(); // normalizedTitle → [slugs]
const errors = [];

function extractFrontmatterField(content, field) {
  const match = content.match(
    new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, "m")
  );
  return match?.[1]?.trim() ?? null;
}

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const content = await readFile(join(POSTS_DIR, file), "utf8");

  // --- coverImage ---
  const cover = extractFrontmatterField(content, "coverImage");
  if (!cover) {
    errors.push(`[${slug}] MISSING coverImage field`);
    continue;
  }

  // R3: must not be in /og/ directory
  if (cover.startsWith("/og/")) {
    errors.push(
      `[${slug}] R3 FAIL — coverImage is in /og/ (OG template): ${cover}`
    );
  }

  // R4: filename must not start with "og-"
  const filename = cover.split("/").pop() ?? "";
  if (filename.startsWith("og-")) {
    errors.push(
      `[${slug}] R4 FAIL — coverImage filename starts with "og-" (OG template): ${cover}`
    );
  }

  // R1: collect for duplicate check
  if (!covers.has(cover)) covers.set(cover, []);
  covers.get(cover).push(slug);

  // --- title ---
  const title = extractFrontmatterField(content, "title");
  if (title) {
    const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!titles.has(normalized)) titles.set(normalized, []);
    titles.get(normalized).push(slug);
  }
}

// R1: duplicate covers
for (const [cover, slugs] of covers) {
  if (slugs.length > 1) {
    errors.push(
      `[R1 FAIL] Duplicate coverImage "${cover}" used by: ${slugs.join(", ")}`
    );
  }
}

// R2: duplicate titles
for (const [, slugs] of titles) {
  if (slugs.length > 1) {
    errors.push(`[R2 FAIL] Duplicate title in: ${slugs.join(", ")}`);
  }
}

if (errors.length > 0) {
  console.error("\n❌ gate-covers FAILED:\n");
  errors.forEach((e) => console.error("  •", e));
  console.error(
    "\nFix all violations above before building. See TRACKING-NOTES.md §Cover Rules.\n"
  );
  process.exit(1);
}

console.log(`✅ gate-covers passed — ${files.length} posts, 0 violations.`);
