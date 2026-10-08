#!/usr/bin/env node
/**
 * gate-frontmatter.mjs — frontmatter de TODO post precisa ser YAML válido,
 * inclusive posts agendados (o Astro lê todos no build). Um title/description
 * sem aspas contendo ": " derrubou o deploy do blog Alínea por ~3 semanas
 * (17/09–07/10/2026). Sem dependências: checa a classe de erro que já ocorreu
 * (escalar sem aspas com ": " ou " #"), aspas duplas sem escape dentro de valor
 * entre aspas duplas, e tabs de indentação.
 */
import { readdirSync, readFileSync } from 'fs';

const DIR = 'src/content/posts';
const errors = [];
for (const f of readdirSync(DIR).filter((x) => /\.mdx?$/.test(x))) {
  const fm = readFileSync(`${DIR}/${f}`, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (fm === undefined) { errors.push(`${f}: sem frontmatter`); continue; }
  fm.split('\n').forEach((line, i) => {
    if (/^\t/.test(line)) errors.push(`${f}:${i + 2}: tab na indentação`);
    const q = line.match(/^\s*(?:-\s+)?[A-Za-z_][\w-]*:\s+"(.*)"\s*$/);
    if (q && /(?<!\\)"/.test(q[1])) errors.push(`${f}:${i + 2}: aspas duplas sem escape dentro de valor entre aspas duplas — use aspas simples ou \\"`);
    const m = line.match(/^([A-Za-z_][\w-]*):\s+(.+)$/);
    if (!m) return;
    const v = m[2].trim();
    if (/^["'\[{|>&*!]/.test(v)) return;
    if (/:\s/.test(v) || /\s#/.test(v)) errors.push(`${f}:${i + 2}: "${m[1]}" sem aspas contém ": " ou " #" — coloque o valor entre aspas`);
  });
}
if (errors.length) { console.error('❌ gate-frontmatter:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('✅ gate-frontmatter passed — frontmatter dos posts sem escalar quebrado.');
