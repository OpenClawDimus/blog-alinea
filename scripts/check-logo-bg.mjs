/**
 * check-logo-bg.mjs
 * Validates that every logo usage in the codebase uses the correct variant
 * (dark logo on light bg, white logo on dark bg).
 *
 * Run: node scripts/check-logo-bg.mjs
 * Returns exit code 1 if any violation is found.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const SRC_DIR = "./src";
const PUBLIC_DIR = "./public";

// Known background contexts (dark = true means dark background)
const DARK_BG_CLASSES = [
  "site-nav", "nav-inner", "nav-logo",       // navbar — always dark
  "about-cta-section", "about-cta-copy",     // about CTA — dark page bg
  "about-page", "sr-wrap",                   // about/post pages — dark
  "sb-expert-card",                          // sidebar card — dark
  "archive-cta",                             // archive CTA — dark
];

const LIGHT_BG_CLASSES = [
  // None in this project — the site is fully dark themed
];

const LOGO_DARK  = "logo-alinea.png";        // navy text — for LIGHT backgrounds
const LOGO_WHITE = "logo-alinea-branco.png"; // white text — for DARK backgrounds

const violations = [];
const ok = [];

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    // Check for dark-logo usage in known dark-bg contexts
    if (line.includes(LOGO_DARK)) {
      const nearbyContext = lines.slice(Math.max(0, i - 5), i + 5).join(" ");
      const isInDarkContext = DARK_BG_CLASSES.some(cls => nearbyContext.includes(cls));

      if (isInDarkContext) {
        violations.push({
          file: filePath,
          line: lineNo,
          issue: `Dark logo (${LOGO_DARK}) used in dark-background context`,
          fix: `Replace with ${LOGO_WHITE}`,
          snippet: line.trim(),
        });
      } else {
        ok.push({ file: filePath, line: lineNo, logo: LOGO_DARK, bg: "unknown/light" });
      }
    }

    // Check for white-logo on light backgrounds (future-proofing)
    if (line.includes(LOGO_WHITE)) {
      const nearbyContext = lines.slice(Math.max(0, i - 5), i + 5).join(" ");
      const isInLightContext = LIGHT_BG_CLASSES.some(cls => nearbyContext.includes(cls));

      if (isInLightContext) {
        violations.push({
          file: filePath,
          line: lineNo,
          issue: `White logo (${LOGO_WHITE}) used in light-background context`,
          fix: `Replace with ${LOGO_DARK}`,
          snippet: line.trim(),
        });
      } else {
        ok.push({ file: filePath, line: lineNo, logo: LOGO_WHITE, bg: "dark" });
      }
    }
  });
}

function walkDir(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".astro", ".git", "dist"].includes(entry.name)) continue;
      walkDir(fullPath);
    } else if (entry.name.match(/\.(astro|tsx?|jsx?|html|css|mdx?)$/)) {
      scanFile(fullPath);
    }
  }
}

console.log("🔍 Checking logo/background contrast across codebase...\n");
walkDir(SRC_DIR);

console.log(`✅ ${ok.length} correct logo usages:`);
ok.forEach(r => console.log(`   [ok] ${r.file}:${r.line} — ${r.logo} on ${r.bg} bg`));

if (violations.length === 0) {
  console.log("\n✅ PASS — All logo usages have correct contrast.\n");
  process.exit(0);
} else {
  console.log(`\n❌ FAIL — ${violations.length} contrast violation(s):\n`);
  violations.forEach(v => {
    console.log(`  📍 ${v.file}:${v.line}`);
    console.log(`     Issue: ${v.issue}`);
    console.log(`     Fix:   ${v.fix}`);
    console.log(`     Code:  ${v.snippet}\n`);
  });
  process.exit(1);
}
