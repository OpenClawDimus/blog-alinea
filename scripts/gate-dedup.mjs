#!/usr/bin/env node
/**
 * gate-dedup.mjs
 *
 * GATE: nenhum post pode ter o mesmo tema de outro publicado a menos de 10 posições.
 * Dois posts são "mesmo tema" se score de similaridade ≥ 0.40 (tags + title keywords).
 *
 * Rodado por gate-post-pipeline.mjs e pelo pre-commit hook diretamente.
 */

import { readdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const POSTS_DIR = 'src/content/posts';
const SIMILARITY_THRESHOLD = 0.40;
const MIN_POSTS_GAP = 10;

// ─── Frontmatter parser (sem dependência externa) ────────────────────────────

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = m[1];
  const titleM = fm.match(/title:\s*["'](.+?)["']/);
  const pubM   = fm.match(/pubDatetime:\s*(.+)/);
  const tagsM  = fm.match(/tags:\s*\n((?:\s+-\s+.+\n?)*)/);
  const tags   = tagsM
    ? (tagsM[1].match(/- ["']?(.+?)["']?\s*$/mg) || []).map(t => t.replace(/^- ["']?|["']?\s*$/g, '').trim())
    : [];
  return {
    title: titleM?.[1] || '',
    pub:   pubM?.[1]?.trim() || '',
    tags,
  };
}

// ─── Topic signature ─────────────────────────────────────────────────────────

const STOP_PT = new Set([
  'de','do','da','dos','das','no','na','nos','nas','em','e','o','a','os','as',
  'um','uma','uns','umas','para','com','que','por','se','não','é','são','ao',
  'à','ou','seu','sua','como','qual','quais','mais','bem','vs','entre',
  'sobre','onde','quando','também','isso','este','esta','estes','estas',
  'real','reais','br','brasil','brasileiro','brasileira','guia',
  '2024','2025','2026','parte','zero','novo','nova',
]);

// Stemming leve PT: normaliza variações verbais e plurais
function stem(w) {
  return w
    .replace(/mente$/, '')       // rapidamente → rapid
    .replace(/ções$/, 'cao')     // conversões → conversao
    .replace(/ção$/, 'cao')      // conversão → conversao
    .replace(/idades$/, 'idade') // velocidades → velocidade
    .replace(/mente$/, '')
    .replace(/ndo$/, '')         // respondendo → respond
    .replace(/ram$/, '')         // responderam → responde
    .replace(/iem$/, '')         // respondem → respond
    .replace(/iem$/, 'i')
    .replace(/[ae]m$/, '')       // definem → defin, respondem → respond
    .replace(/ais$/, 'al')       // digitais → digital
    .replace(/eis$/, 'el')
    .replace(/ns$/, 'm')         // bons → bom
    .replace(/s$/, '');          // leads → lead, posts → post
}

function titleKeywords(title) {
  const words = title.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_PT.has(w))
    .map(stem);

  // bigrams de 2 palavras adjacentes (pega "resposta lead", "tempo resposta", etc.)
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) bigrams.push(`${words[i]}+${words[i+1]}`);

  return [...words, ...bigrams];
}

function topicSignature(tags, title) {
  const kwds = titleKeywords(title);
  const normalizedTags = tags.map(t => stem(t.toLowerCase().replace(/-/g, '')));
  return new Set([...normalizedTags, ...kwds]);
}

// ─── Jaccard similarity ───────────────────────────────────────────────────────

function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = new Set([...setA, ...setB]).size;
  return inter / union;
}

// Jaccard apenas sobre bigrams do título — mais sensível a frases compartilhadas
function titleBigramJaccard(titleA, titleB) {
  function bigrams(t) {
    const words = t.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_PT.has(w))
      .map(stem);
    const bg = new Set();
    for (let i = 0; i < words.length - 1; i++) bg.add(`${words[i]}+${words[i+1]}`);
    return bg;
  }
  return jaccard(bigrams(titleA), bigrams(titleB));
}

// Conta tags em comum (sem stemming — tags são controladas)
function sharedTagCount(tagsA, tagsB) {
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  return tagsA.filter(t => setB.has(t.toLowerCase())).length;
}

// ─── Load all posts sorted by pubDatetime ────────────────────────────────────

function loadAllPosts(excludeSlugs = new Set()) {
  const files = readdirSync(POSTS_DIR).filter(
    f => f.endsWith('.mdx') && !f.includes('reddit')
  );
  return files
    .map(f => {
      const slug = f.replace('.mdx', '');
      if (excludeSlugs.has(slug)) return null;
      const raw = readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const { title, pub, tags } = parseFrontmatter(raw);
      if (!title || !pub) return null;
      return { slug, title, pub, tags, sig: topicSignature(tags, title) };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.pub) - new Date(b.pub));
}

// ─── Get staged post slugs ───────────────────────────────────────────────────

function getStagedPosts() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return out.trim().split('\n').filter(
      f => f.startsWith('src/content/posts/') && f.endsWith('.mdx') && !f.includes('reddit')
    ).map(f => path.basename(f, '.mdx'));
  } catch {
    return [];
  }
}

// ─── Check one post for dedup violations ─────────────────────────────────────

function checkPost(slug, existingPosts) {
  const raw = readFileSync(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
  const { title, pub, tags } = parseFrontmatter(raw);
  const sig = topicSignature(tags, title);
  const allSorted = [...existingPosts, { slug, title, pub, tags, sig }]
    .sort((a, b) => new Date(a.pub) - new Date(b.pub));

  const myIdx = allSorted.findIndex(p => p.slug === slug);
  const errors = [];

  for (let i = 0; i < allSorted.length; i++) {
    if (i === myIdx) continue;
    const other = allSorted[i];
    const gap = Math.abs(myIdx - i);

    // Check 1: similaridade de assinatura completa (tags + keywords)
    const sigSim = jaccard(sig, other.sig);

    // Check 2: bigrams do título — captura frases iguais ("resposta ao lead", "5 minutos")
    const titleSim = titleBigramJaccard(title, other.title);

    // Check 3: tags em comum ≥ 2 E dentro do gap
    const commonTags = sharedTagCount(tags, other.tags);

    // Regra 1: NUNCA IGUAIS — tópico idêntico bloqueia independente de gap
    const isIdentical =
      sigSim >= 0.55 ||         // 55%+ da assinatura completa
      titleSim >= 0.18;         // 18%+ bigrams do título = mesma frase/ângulo (ex: "resposta+lead")

    // Regra 2: MUITO PARECIDO + dentro do gap mínimo
    const isTooClose =
      gap < MIN_POSTS_GAP && (
        sigSim >= SIMILARITY_THRESHOLD ||  // 40%+ assinatura
        (titleSim >= 0.18) ||             // frases de título similares
        (commonTags >= 3)                 // 3+ tags específicas iguais
      );

    if (isIdentical || isTooClose) {
      const reason = isIdentical ? 'TÓPICO IDÊNTICO (bloqueado independente de gap)' : `distância: ${gap}/${MIN_POSTS_GAP}`;
      errors.push(
        `Similar ao post "${other.slug}"` +
        ` [sig:${(sigSim*100).toFixed(0)}% title:${(titleSim*100).toFixed(0)}% tags:${commonTags}]` +
        ` — ${reason}.`
      );
    }
  }

  return { slug, title, errors, passed: errors.length === 0 };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const stagedSlugs = getStagedPosts();

if (stagedSlugs.length === 0) process.exit(0);

const stagedSet = new Set(stagedSlugs);
const existingPosts = loadAllPosts(stagedSet);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  GATE DEDUP: temas únicos + gap mínimo de 10 posts           ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let blocked = 0;

for (const slug of stagedSlugs) {
  const result = checkPost(slug, existingPosts);
  if (result.passed) {
    console.log(`  ✅ ${slug} — sem tema duplicado\n`);
  } else {
    console.log(`  ❌ BLOQUEADO — ${slug}`);
    for (const e of result.errors) console.log(`     • ${e}`);
    console.log();
    blocked++;
  }
}

if (blocked > 0) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  🚫 COMMIT BLOQUEADO — ${blocked} post(s) com tema duplicado         ║`);
  console.log('║  Regras: similaridade < 40% OU gap ≥ 10 posts entre temas.  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}

process.exit(0);
