#!/usr/bin/env node
/**
 * gate-post-components.mjs — valida props de componentes nos posts, INCLUSIVE
 * posts agendados (que ficam fora do build até a data e escondem erro: o post
 * com variant inválido derrubou o deploy no dia da publicação, 07/10/2026).
 */
import { readdirSync, readFileSync } from 'fs';

const DIR = 'src/content/posts';
const VARIANTS = new Set(['estoque', 'atribuicao', 'portal', 'atendimento', 'default']);
const errors = [];
for (const f of readdirSync(DIR).filter((x) => /\.mdx?$/.test(x))) {
  const s = readFileSync(`${DIR}/${f}`, 'utf8');
  for (const m of s.matchAll(/<DimusHelp\b([\s\S]*?)\/>/g)) {
    const v = m[1].match(/\bvariant="([^"]*)"/)?.[1];
    if (v && !VARIANTS.has(v)) errors.push(`${f}: DimusHelp variant="${v}" inválido (use ${[...VARIANTS].join('|')})`);
  }
}
if (errors.length) { console.error('❌ gate-post-components:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('✅ gate-post-components passed — variant de DimusHelp válido em todos os posts.');
