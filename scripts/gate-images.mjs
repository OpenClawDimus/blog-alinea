#!/usr/bin/env node
/**
 * gate-images.mjs — REGRA PERMANENTE: as imagens que o post declara têm que EXISTIR
 * e ter tamanho válido. Em 07/10/2026 metade dos posts do Alínea apontava para covers
 * que não existiam (imagem quebrada no site e card impossível).
 *  - coverImage: existe em public/, é JPEG/PNG, largura ≥ 1000 px;
 *  - ogImage (quando declarado): existe e é 1200x630.
 */
import { readFileSync } from 'fs';
import { readPosts, resolvePublicImage, imageSize } from './lib/posts.mjs';

const errors = [];
for (const p of readPosts()) {
  if (!p.coverImage) { errors.push(`${p.slug}: sem coverImage`); continue; }
  const c = resolvePublicImage(p.coverImage);
  if (!c) { errors.push(`${p.slug}: cover NÃO EXISTE em public${p.coverImage}`); }
  else {
    const sz = imageSize(readFileSync(c));
    if (!sz) errors.push(`${p.slug}: cover inválida (${c})`);
    else if (sz.width < 1000) errors.push(`${p.slug}: cover pequena (${sz.width}x${sz.height}); mínimo 1000 px de largura`);
  }
  if (p.ogImage) {
    const o = resolvePublicImage(p.ogImage);
    if (!o) errors.push(`${p.slug}: OG NÃO EXISTE em public${p.ogImage}`);
    else {
      const sz = imageSize(readFileSync(o));
      if (!sz || sz.width !== 1200 || sz.height !== 630) errors.push(`${p.slug}: OG precisa ser 1200x630 (é ${sz ? `${sz.width}x${sz.height}` : 'inválida'})`);
    }
  }
}
if (errors.length) {
  console.error(`❌ gate-images: ${errors.length} problema(s):`);
  errors.slice(0, 20).forEach((e) => console.error(`   - ${e}`));
  process.exit(1);
}
console.log('✅ gate-images passed — covers e OGs existem e têm tamanho válido em todos os posts.');
