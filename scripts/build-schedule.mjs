#!/usr/bin/env node
/**
 * build-schedule.mjs — gera schedule.json (raiz do repo, versionado).
 *
 * O Publish Watchdog (Cloudflare Worker) lê este arquivo direto do GitHub para
 * saber quais posts já deveriam estar no ar, qualquer que seja a frequência de
 * publicação do blog. Rode após criar/alterar um post (o gate-wa-preview falha
 * se o arquivo estiver desatualizado). `--check` só verifica, sem escrever.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readPosts, readSite } from './lib/posts.mjs';

const { siteUrl, blogShortTitle } = readSite();
const posts = readPosts()
  .sort((a, b) => new Date(a.pubDatetime) - new Date(b.pubDatetime) || a.slug.localeCompare(b.slug))
  .map((p) => ({
    slug: p.slug,
    title: p.title,
    pubDatetime: p.pubDatetime,
    url: `${siteUrl}posts/${p.slug}/`,
    preview: `public/wa/wa-${p.slug}.jpg`,
  }));
const out = JSON.stringify({ version: 1, blog: blogShortTitle, siteUrl, posts }, null, 2) + '\n';

if (process.argv.includes('--check')) {
  const cur = existsSync('schedule.json') ? readFileSync('schedule.json', 'utf8') : '';
  if (cur !== out) {
    console.error('schedule.json desatualizado — rode: node scripts/build-schedule.mjs');
    process.exit(1);
  }
  console.log(`schedule.json OK (${posts.length} posts)`);
} else {
  writeFileSync('schedule.json', out);
  console.log(`schedule.json gerado (${posts.length} posts)`);
}
