#!/usr/bin/env node
/**
 * gen-wa-preview.mjs <slug>|--all [--force]
 *
 * Gera public/wa/wa-<slug>.jpg (1280x720, HORIZONTAL) — o card enviado nos avisos
 * de WhatsApp. Estilo "Apple TV": a cover do post em tela cheia (a mesma do post),
 * degradê escuro embaixo e o TÍTULO do post em destaque. Cores/nome por blog em
 * wa-brand.json ({"accent","accent2","label","name"}).
 *
 * REGRAS (verificadas por gate-wa-preview.mjs, no pre-commit E no CI do servidor):
 *  - todo post tem card; o card USA a cover real do post (sem cover = erro, sem fundo sólido);
 *  - o card mostra o título do post (manifest guarda título + hash da cover + da marca;
 *    se algum mudar, o card fica "velho" e o gate falha até regenerar).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { readPosts, resolvePublicImage } from './lib/posts.mjs';
import { loadBrand, renderCard, sha } from './lib/card.mjs';

const W = 1280, H = 720;
const { brand, host, brandHash } = loadBrand();

const arg = process.argv[2];
const force = process.argv.includes('--force');
if (!arg) { console.error('uso: gen-wa-preview.mjs <slug>|--all [--force]'); process.exit(2); }
mkdirSync('public/wa', { recursive: true });
const manPath = 'public/wa/manifest.json';
const manifest = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
const posts = readPosts().filter((p) => arg === '--all' || p.slug === arg);
if (!posts.length) { console.error(`post não encontrado: ${arg}`); process.exit(2); }
let made = 0, failed = 0;
for (const p of posts) {
  const coverPath = resolvePublicImage(p.coverImage);
  if (!coverPath) { console.error(`❌ SEM COVER: ${p.slug} (coverImage: ${p.coverImage ?? 'ausente'}) — gere a cover antes (npm run gen-cover ${p.slug})`); failed++; continue; }
  const want = { title: sha(p.title), cover: sha(readFileSync(coverPath)), brand: brandHash };
  const out = `public/wa/wa-${p.slug}.jpg`;
  const cur = manifest[p.slug];
  if (!force && existsSync(out) && cur && cur.title === want.title && cur.cover === want.cover && cur.brand === want.brand) continue;
  writeFileSync(out, await renderCard({ title: p.title, coverPath, W, H, brand, host }));
  manifest[p.slug] = want;
  made++;
}
writeFileSync(manPath, JSON.stringify(manifest, null, 1) + '\n');
console.log(`cards gerados: ${made}/${posts.length}${failed ? ` | ${failed} SEM COVER` : ''}`);
process.exit(failed ? 1 : 0);
