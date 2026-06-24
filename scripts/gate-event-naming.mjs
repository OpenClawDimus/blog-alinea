#!/usr/bin/env node
/**
 * GATE OBRIGATÓRIO — Nomenclatura de origem de eventos (blog.dimus.com.br).
 * Lê o nome → sabe de onde veio. Roda no astro:build:start (build/deploy
 * bloqueado se violar) e via `npm run gate:naming`. Fonte: event-origins.json.
 *
 * Valida:
 *  1. Todo idTag="…" em src/ casa a convenção (ou é singleton blog-lead).
 *  2. Nenhum token legado (CALC-/QUIZ-/POST-/GATE-/…) aparece como string literal.
 *  3. O ref do DimusHelp usa o prefixo de convenção blog-gate-.
 * Exit 1 com relatório em qualquer violação.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(ROOT, "event-origins.json"), "utf8"));
const ORIGIN_RE = new RegExp(cfg.regex);
const isValid = (o) => ORIGIN_RE.test(o) || cfg.singletons.includes(o);

const SRC = join(ROOT, "src");
const files = readdirSync(SRC, { recursive: true })
  .map((f) => join(SRC, f))
  .filter((f) => /\.(astro|mdx|ts|js|tsx)$/.test(f));

const violations = [];
let idTagCount = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");

  // 1. idTag="…" literais
  for (const m of src.matchAll(/idTag=["']([^"']+)["']/g)) {
    idTagCount++;
    if (!isValid(m[1])) violations.push(`${rel}: idTag="${m[1]}" fora da convenção (${cfg.regex} ou ${cfg.singletons.join("/")})`);
  }

  // 2. tokens legados como string literal
  for (const tok of cfg.forbidden) {
    const re = new RegExp('["\'\\[]' + tok.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    if (re.test(src)) violations.push(`${rel}: token legado "${tok}" — use a convenção blog-<superfície>-<cluster>`);
  }
}

// 3. DimusHelp deve montar o ref com prefixo de convenção
const dh = join(SRC, "components/blog/DimusHelp.astro");
try {
  if (!/["']blog-gate-["']|"blog-gate-"|'blog-gate-'/.test(readFileSync(dh, "utf8")))
    violations.push("components/blog/DimusHelp.astro: ref do gate não usa prefixo blog-gate-");
} catch { /* arquivo pode não existir em outros contextos */ }

if (violations.length) {
  console.error(`\n❌ GATE de nomenclatura FALHOU (${violations.length}):`);
  for (const v of violations) console.error("  • " + v);
  console.error("\nConvenção: <propriedade>-<superfície>-<cluster> (ex.: blog-calc-estoque). Ver docs/EVENT-NAMING.md.\n");
  process.exit(1);
}

console.log(`✅ GATE de nomenclatura OK — ${idTagCount} idTags + DimusHelp + zero token legado. Toda origem é reconhecível pelo nome.`);
