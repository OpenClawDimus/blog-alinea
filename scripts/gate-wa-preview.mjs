#!/usr/bin/env node
/**
 * gate-wa-preview.mjs — REGRA PERMANENTE (blogs atuais e futuros).
 * Todo post precisa de card de WhatsApp (public/wa/wa-<slug>.jpg) que:
 *  - exista, seja JPEG 1280x720 e tenha tamanho razoável;
 *  - esteja EM DIA com o título, a cover e a marca atuais (manifest.json);
 *  - tenha sido gerado com a cover real do post.
 * Sem dependências: roda no pre-commit e no CI do servidor (quality-gates.yml).
 */
import { existsSync, readFileSync, statSync } from 'fs';
import { readPosts, resolvePublicImage, imageSize } from './lib/posts.mjs';
import { loadBrand, sha } from './lib/brand.mjs';
const { brandHash } = loadBrand();
const manifest = existsSync('public/wa/manifest.json') ? JSON.parse(readFileSync('public/wa/manifest.json', 'utf8')) : {};

const errors = [];
for (const p of readPosts()) {
  const f = `public/wa/wa-${p.slug}.jpg`;
  if (!existsSync(f)) { errors.push(`${p.slug}: card ausente`); continue; }
  const buf = readFileSync(f);
  const sz = imageSize(buf);
  if (!sz || sz.type !== 'jpeg' || sz.width !== 1280 || sz.height !== 720) errors.push(`${p.slug}: card precisa ser JPEG 1280x720 (é ${sz ? `${sz.type} ${sz.width}x${sz.height}` : 'inválido'})`);
  if (statSync(f).size < 20_000) errors.push(`${p.slug}: card pequeno demais (${statSync(f).size} bytes)`);
  const cover = resolvePublicImage(p.coverImage);
  if (!cover) { errors.push(`${p.slug}: sem cover real (${p.coverImage ?? 'sem coverImage'}) — o card exige a cover do post`); continue; }
  const m = manifest[p.slug];
  if (!m) errors.push(`${p.slug}: card sem registro no manifest (gere com gen-wa-preview.mjs)`);
  else {
    if (m.title !== sha(p.title)) errors.push(`${p.slug}: título mudou — card desatualizado`);
    if (m.cover !== sha(readFileSync(cover))) errors.push(`${p.slug}: cover mudou — card desatualizado`);
    if (m.brand !== brandHash) errors.push(`${p.slug}: marca/domínio mudou — card desatualizado`);
  }
}
if (errors.length) {
  console.error(`❌ gate-wa-preview: ${errors.length} problema(s):`);
  errors.slice(0, 15).forEach((e) => console.error(`   - ${e}`));
  console.error('   Corrija: node scripts/gen-wa-preview.mjs --all   (cover ausente: gere a cover primeiro)');
  process.exit(1);
}
console.log('✅ gate-wa-preview passed — todos os posts têm card 1280x720 em dia, com cover real e título atual.');
