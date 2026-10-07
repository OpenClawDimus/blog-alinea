#!/usr/bin/env node
/**
 * gate-wa-preview.mjs — REGRA PERMANENTE (blogs atuais e futuros).
 * Todo post precisa de public/wa/wa-<slug>.jpg (card horizontal do WhatsApp,
 * gerado por gen-wa-preview.mjs) e o schedule.json precisa estar em dia
 * (lido pelo Publish Watchdog). Sai com 1 se algo faltar.
 */
import { existsSync } from 'fs';
import { readPosts } from './lib/posts.mjs';

const missing = readPosts().filter((p) => !existsSync(`public/wa/wa-${p.slug}.jpg`));
let ok = true;
if (missing.length) {
  ok = false;
  console.error(`❌ gate-wa-preview: ${missing.length} post(s) sem card de WhatsApp:`);
  missing.slice(0, 10).forEach((p) => console.error(`   - ${p.slug}`));
  console.error('   Corrija: node scripts/gen-wa-preview.mjs <slug>   (ou --all)');
}
if (!ok) process.exit(1);
console.log('✅ gate-wa-preview passed — cards de WhatsApp presentes.');
