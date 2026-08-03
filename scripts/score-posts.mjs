#!/usr/bin/env node
/**
 * score-posts.mjs — Computa scores reais SEO/GEO/AEO para cada post MDX.
 * Roda no build (antes do astro build) e gera public/posts-quality.json.
 * Dados 100% baseados no conteúdo dos arquivos — nenhum número inventado.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const POSTS_DIR = join(ROOT, 'src/content/posts');
const OUT = join(ROOT, 'public/posts-quality.json');

// Extrai frontmatter YAML como key:value simples (sem parser externo)
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  let currentKey = null;
  let inArray = false;
  const lines = m[1].split('\n');
  for (const line of lines) {
    const arrItem = line.match(/^\s+-\s+(.+)/);
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      fm[currentKey] = val || null;
      inArray = false;
    } else if (arrItem && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(arrItem[1].trim().replace(/^["']|["']$/g, ''));
    }
  }
  return fm;
}

function countWords(src) {
  // Remove frontmatter, MDX imports, component tags, count remaining words
  const body = src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^import .+$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*`_\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return body.split(' ').filter(w => w.length > 1).length;
}

function hasComponent(src, name) {
  return src.includes(`<${name}`) || src.includes(`import ${name}`);
}

function countFAQ(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
  return (fm.match(/^\s*- q:/gm) || []).length;
}

function descLen(fm) {
  return (fm.description || '').length;
}

function titleLen(fm) {
  return (fm.title || '').length;
}

function hasUniqueOG(fm) {
  const og = fm.ogImage || '';
  const cover = fm.coverImage || '';
  return og !== cover && og.startsWith('/og/');
}

// SEO: estrutura técnica e conteúdo
function scoreSEO(fm, src) {
  let s = 0;
  // Descrição 120-160 chars (20pts)
  const dl = descLen(fm);
  if (dl >= 120 && dl <= 160) s += 20;
  else if (dl >= 100 && dl < 120) s += 12;
  else if (dl > 160 && dl <= 200) s += 12;
  else if (dl > 0) s += 5;

  // OG image única em /og/ (não = coverImage) (20pts)
  if (hasUniqueOG(fm)) s += 20;
  else if (fm.ogImage && fm.ogImage !== fm.coverImage) s += 8;

  // Contagem de palavras (20pts)
  const wc = countWords(src);
  if (wc >= 1200) s += 20;
  else if (wc >= 900) s += 14;
  else if (wc >= 600) s += 8;
  else s += 2;

  // FAQ schema (20pts)
  const faqN = countFAQ(src);
  if (faqN >= 3) s += 20;
  else if (faqN === 2) s += 14;
  else if (faqN === 1) s += 7;

  // Título 40-70 chars (20pts)
  const tl = titleLen(fm);
  if (tl >= 40 && tl <= 70) s += 20;
  else if (tl >= 30 && tl < 40) s += 12;
  else if (tl > 70 && tl <= 90) s += 12;
  else if (tl > 0) s += 5;

  return Math.min(100, s);
}

// GEO: otimização para motores generativos (IA/LLMs)
function scoreGEO(fm, src) {
  let s = 0;
  // AnswerCapsule (35pts) — resposta direta para LLM snippets
  if (hasComponent(src, 'AnswerCapsule')) s += 35;

  // FAQ com ≥2 perguntas (30pts)
  const faqN = countFAQ(src);
  if (faqN >= 3) s += 30;
  else if (faqN === 2) s += 20;
  else if (faqN === 1) s += 10;

  // Cluster tag canônica definida (20pts)
  const tags = fm.tags || [];
  const tagArr = Array.isArray(tags) ? tags : [tags];
  const clusterTags = ['automotivo-metricas', 'ia-para-vendas', 'contabilidade-consultiva', 'tributacao-brasilia', 'planejamento-tributario'];
  if (tagArr.some(t => clusterTags.includes(t))) s += 20;

  // Word count ≥ 900 para conteúdo substantivo (15pts)
  const wc = countWords(src);
  if (wc >= 900) s += 15;
  else if (wc >= 600) s += 8;

  return Math.min(100, s);
}

// AEO: otimização para motores de resposta (featured snippets, AI overviews)
function scoreAEO(fm, src) {
  let s = 0;
  // AnswerCapsule (25pts)
  if (hasComponent(src, 'AnswerCapsule')) s += 25;
  // LeadForm canônico (25pts)
  if (hasComponent(src, 'LeadForm')) s += 25;
  // DimusHelp (25pts)
  if (hasComponent(src, 'DimusHelp')) s += 25;
  // FAQ schema (25pts)
  const faqN = countFAQ(src);
  if (faqN >= 2) s += 25;
  else if (faqN === 1) s += 12;

  return Math.min(100, s);
}

async function main() {
  const files = await readdir(POSTS_DIR);
  const mdxFiles = files.filter(f => f.endsWith('.mdx') && !f.includes('reddit'));

  const results = [];

  for (const file of mdxFiles) {
    const src = await readFile(join(POSTS_DIR, file), 'utf8');
    const fm = parseFrontmatter(src);
    const slug = fm.slug || basename(file, '.mdx');

    // Skip drafts
    if (fm.draft === 'true') continue;

    const wc = countWords(src);
    const faqN = countFAQ(src);
    const seo = scoreSEO(fm, src);
    const geo = scoreGEO(fm, src);
    const aeo = scoreAEO(fm, src);
    const composite = Math.round((seo + geo + aeo) / 3);

    results.push({
      slug,
      title: fm.title || slug,
      pubDatetime: fm.pubDatetime || null,
      cluster: Array.isArray(fm.tags) ? fm.tags.find(t => t === 'automotivo-metricas' || t === 'ia-para-vendas') || null : null,
      word_count: wc,
      has_cover: !!(fm.coverImage),
      has_unique_og: hasUniqueOG(fm),
      og_path: fm.ogImage || null,
      has_answer_capsule: hasComponent(src, 'AnswerCapsule'),
      has_lead_form: hasComponent(src, 'LeadForm'),
      has_dimus_help: hasComponent(src, 'DimusHelp'),
      faq_count: faqN,
      seo,
      geo,
      aeo,
      composite,
    });
  }

  // Ordenar por composite desc
  results.sort((a, b) => b.composite - a.composite);

  await writeFile(OUT, JSON.stringify({ generated_at: new Date().toISOString(), posts: results }, null, 2));
  console.log(`✓ posts-quality.json gerado: ${results.length} posts`);
  results.slice(0, 5).forEach(p => console.log(`  ${p.composite} | ${p.slug}`));
  const issues = results.filter(p => p.composite < 70);
  if (issues.length) {
    console.log(`⚠ ${issues.length} posts abaixo de 70:`);
    issues.forEach(p => console.log(`  ${p.composite} (SEO:${p.seo} GEO:${p.geo} AEO:${p.aeo}) — ${p.slug}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
