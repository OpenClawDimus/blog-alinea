#!/usr/bin/env node
/**
 * gen-cover.mjs <slug> [--scene "..."]   (Blog Alínea — gerador canônico de covers)
 *
 * Gera a cover (foto realista, luz natural quente, escritório brasileiro) no caminho que o
 * próprio post declara em `coverImage` (public/<coverImage>), para o post nunca ficar com
 * imagem quebrada. Cena: --scene, ou `coverScene` do frontmatter, ou docs/cover-scenes.json.
 * Chave MiniMax: env MINIMAX_API_KEY (CI) ou GSM (Mac). Estilo travado abaixo.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';

const STYLE_SUFFIX =
  'realistic editorial photograph, natural warm window light, Brazilian small business office, ' +
  'earthy tones of terracotta, wood and green plants, shallow depth of field, candid professional moment, ' +
  'high detail, no text, no numbers, no logos, no readable writing on papers or screens';
const MIN_BYTES = 185 * 1024;
const slug = process.argv[2];
if (!slug || slug.startsWith('--')) { console.error('Uso: node scripts/gen-cover.mjs <slug> [--scene "..."]'); process.exit(1); }
const post = readFileSync(`src/content/posts/${slug}.mdx`, 'utf8');
const fm = post.match(/^---\n([\s\S]*?)\n---/)[1];
const cover = fm.match(/^coverImage:\s*["']?(.+?)["']?\s*$/m)?.[1];
if (!cover) { console.error('❌ post sem coverImage no frontmatter'); process.exit(1); }
const out = `public/${cover.replace(/^\//, '')}`;
const i = process.argv.indexOf('--scene');
let scene = i !== -1 ? process.argv[i + 1] : fm.match(/^coverScene:\s*["']?(.+?)["']?\s*$/m)?.[1];
if (!scene && existsSync('docs/cover-scenes.json')) scene = JSON.parse(readFileSync('docs/cover-scenes.json', 'utf8'))[slug];
if (!scene) { console.error('❌ sem cena (use --scene, coverScene ou docs/cover-scenes.json)'); process.exit(1); }
let key = process.env.MINIMAX_API_KEY?.trim();
if (!key) key = execSync('python3 ~/scripts/gsm get dimus-minimax-api-key', { encoding: 'utf8', shell: '/bin/zsh' }).trim();
const jpeg = /\.jpe?g$/i.test(out);
for (let attempt = 1; attempt <= 3; attempt++) {
  const r = await fetch('https://api.minimaxi.chat/v1/image_generation', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'image-01', prompt: `${scene}, ${STYLE_SUFFIX}`, aspect_ratio: '3:2', n: 1, output_format: jpeg ? 'jpeg' : 'png' }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) { console.error(`tentativa ${attempt}: API ${r.status}`); continue; }
  const url = (await r.json())?.data?.image_urls?.[0];
  if (!url) { console.error(`tentativa ${attempt}: sem image_url`); continue; }
  const buf = Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(60_000) })).arrayBuffer());
  if (buf.length < MIN_BYTES) { console.error(`tentativa ${attempt}: ${Math.round(buf.length / 1024)}KB < 185KB`); continue; }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(`✅ ${slug}: ${out} (${Math.round(buf.length / 1024)}KB)`);
  process.exit(0);
}
console.error(`❌ ${slug}: falhou após 3 tentativas`);
process.exit(1);
