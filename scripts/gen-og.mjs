#!/usr/bin/env node
/**
 * gen-og.mjs [--all | <slug>]  — gera o OG (1200x630) APENAS dos posts cujo ogImage está declarado e
 * NÃO existe em public/ (nunca sobrescreve OG desenhado à mão). Mesmo visual do card: cover + título
 * + marca. Evita meta og:image quebrada no compartilhamento. Verificado por gate-images.mjs.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { readPosts, resolvePublicImage } from './lib/posts.mjs';
import { loadBrand, renderCard } from './lib/card.mjs';

const arg = process.argv[2] ?? '--all';
const { brand, host, logoPath } = loadBrand();
let made = 0, skipped = 0, failed = 0;
for (const p of readPosts().filter((x) => arg === '--all' || x.slug === arg)) {
  if (!p.ogImage || /^https?:/.test(p.ogImage)) continue;
  const out = join('public', p.ogImage.replace(/^\//, ''));
  if (existsSync(out)) { skipped++; continue; }
  const cover = resolvePublicImage(p.coverImage);
  if (!cover) { console.error(`❌ ${p.slug}: sem cover para gerar o OG`); failed++; continue; }
  const jpg = await renderCard({ title: p.title, coverPath: cover, W: 1200, H: 630, brand, host, logoPath, showLabel: false });
  // o ogImage declarado costuma ser .png: converte mantendo o nome
  const sharp = (await import('sharp')).default;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, /\.png$/i.test(out) ? await sharp(jpg).png().toBuffer() : jpg);
  made++;
}
console.log(`OGs gerados: ${made} | já existiam: ${skipped}${failed ? ` | ${failed} sem cover` : ''}`);
process.exit(failed ? 1 : 0);
