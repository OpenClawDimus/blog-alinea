#!/usr/bin/env node
/**
 * gen-wa-preview.mjs <slug>|--all [--force]
 *
 * Gera public/wa/wa-<slug>.jpg (1280x720, HORIZONTAL) — o card enviado nos
 * avisos de WhatsApp. Estilo "Apple TV": a cover do post em tela cheia
 * (estática, a mesma do post), degradê escuro embaixo e o TÍTULO em destaque.
 * REGRA PERMANENTE: todo post precisa ter este arquivo (gate-wa-preview.mjs).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import satori from 'satori';
import sharp from 'sharp';
import { readPosts, readSite } from './lib/posts.mjs';

const W = 1280, H = 720;
const FONT = readFileSync('scripts/assets/fonts/GothamBold.ttf');
const { siteUrl, blogShortTitle } = readSite();
const host = new URL(siteUrl).host;
// Cores de marca do card: wa-brand.json opcional na raiz do blog ({"accent","accent2","label"}).
const brand = { accent: '#FF007F', accent2: '#00E5FF', label: 'NOVO POST', ...(existsSync('wa-brand.json') ? JSON.parse(readFileSync('wa-brand.json', 'utf8')) : {}) };

const h = (type, style, children) => ({ type, props: { style, children } });

async function render(post) {
  const coverPath = `public${post.coverImage}`;
  // as covers do MiniMax vêm com tarja preta em cima/embaixo: remove antes do enquadramento
  let src = sharp(readFileSync(coverPath));
  try { src = sharp(await src.trim({ background: '#000000', threshold: 22 }).toBuffer()); } catch { src = sharp(readFileSync(coverPath)); }
  const cover = await src.resize(W, H, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
  const tree = h('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#0D0415' }, [
    { type: 'img', props: { src: `data:image/jpeg;base64,${cover.toString('base64')}`, width: W, height: H, style: { position: 'absolute', top: 0, left: 0 } } },
    h('div', { position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundImage: 'linear-gradient(to top, rgba(8,4,16,0.96) 0%, rgba(8,4,16,0.82) 34%, rgba(8,4,16,0.25) 62%, rgba(8,4,16,0) 80%)' }),
    h('div', { position: 'absolute', top: 44, left: 56, display: 'flex', alignItems: 'center', fontSize: 24, letterSpacing: 5, color: '#FFFFFF' }, [
      h('div', { width: 14, height: 14, borderRadius: 7, backgroundColor: brand.accent, marginRight: 16 }),
      h('div', {}, blogShortTitle.toUpperCase()),
    ]),
    h('div', { position: 'absolute', left: 56, bottom: 52, width: 1100, display: 'flex', flexDirection: 'column' }, [
      h('div', { fontSize: 24, letterSpacing: 4, color: brand.accent, marginBottom: 18 }, brand.label),
      h('div', { fontSize: 66, lineHeight: 1.08, color: '#FFFFFF', lineClamp: 3, letterSpacing: -1 }, post.title),
      h('div', { width: 140, height: 5, marginTop: 26, marginBottom: 20, backgroundImage: `linear-gradient(to right, ${brand.accent}, ${brand.accent2})` }),
      h('div', { fontSize: 24, color: '#C9C2D0', letterSpacing: 1 }, host),
    ]),
  ]);
  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Gotham', data: FONT, weight: 700, style: 'normal' }] });
  return sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

const arg = process.argv[2];
const force = process.argv.includes('--force');
if (!arg) { console.error('uso: gen-wa-preview.mjs <slug>|--all [--force]'); process.exit(2); }
mkdirSync('public/wa', { recursive: true });
const posts = readPosts().filter((p) => arg === '--all' || p.slug === arg);
if (!posts.length) { console.error(`post não encontrado: ${arg}`); process.exit(2); }
let made = 0;
for (const p of posts) {
  const out = `public/wa/wa-${p.slug}.jpg`;
  if (existsSync(out) && !force) continue;
  if (!p.coverImage || !existsSync(`public${p.coverImage}`)) { console.error(`SEM COVER: ${p.slug}`); process.exitCode = 1; continue; }
  writeFileSync(out, await render(p));
  made++;
}
console.log(`previews gerados: ${made}/${posts.length}`);
