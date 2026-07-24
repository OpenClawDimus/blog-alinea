#!/usr/bin/env node
/**
 * gate-post-pipeline.mjs
 *
 * GATE INVIOLÁVEL — bloqueia qualquer commit de post .mdx que não tenha
 * passado pelo pipeline SEO completo da Dimus.
 *
 * NÃO EXISTE bypass. NÃO EXISTE --force. NÃO EXISTE --no-verify neste repo.
 *
 * Para criar o audit trail: rode a skill /blog-post-pipeline <slug>
 * Ela executa todos os agentes e escreve .post-audits/<slug>.audit.json
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ─── PIPELINE CANÔNICO ───────────────────────────────────────────────────────
// Cada item DEVE estar presente e passed:true no arquivo .audit.json
// Adicionar nova etapa aqui → automaticamente obrigatória em todos os futuros posts

const REQUIRED_PIPELINE_STEPS = [
  // 1. Pesquisa de keyword
  { key: 'dataforseo_serp',        label: 'DataForSEO: volume + intent + dificuldade' },
  { key: 'serp_intent_clear',      label: 'Intent SERP: 0% contaminação de intent (ex: veículo apreendido)' },

  // 2. Validação de audiência
  { key: 'mirofish_icp',          label: 'MiroFish ICP: persona automotiva validou o tópico' },
  { key: 'no_content_duplicate',  label: 'Deduplicação: não existe post similar no blog' },

  // 3. Agentes SEO
  { key: 'seo_agent',             label: 'SEO Agent: H1/H2/H3, keyword density, entidades, internal links, title logic' },
  { key: 'aeo_agent',             label: 'AEO Agent: FAQ schema, featured snippet, answer boxes' },
  { key: 'geo_agent',             label: 'GEO Agent: citabilidade por LLMs, semântica profunda' },
  { key: 'eeat_check',            label: 'EEAT: Experience/Expertise/Authority/Trust — fontes, autoria, dados reais' },

  // 4. Imagem SEO
  { key: 'image_seo_cover',       label: 'Image SEO: coverImage — filename descritivo, alt text, dimensão' },
  { key: 'image_seo_og',         label: 'Image SEO: OG 1200x630, texto legível, padrão Dimus' },
  { key: 'gate_covers_pass',      label: 'gate-covers.mjs: 0 violações (sem duplicate, sem og- em cover)' },

  // 5. Editorial
  { key: 'llm_council',          label: 'LLM Council: red team editorial (5 advisors + peer review + chairman)' },

  // 6. Scores mínimos
  { key: 'score_gate',           label: 'score-posts.mjs: composite ≥ 95, GEO ≥ 90, AEO = 100' },
];

const SCORE_THRESHOLDS = { composite: 95, geo: 90, aeo: 100 };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getStagedPosts() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return out.trim().split('\n').filter(
      f => f.startsWith('src/content/posts/') && f.endsWith('.mdx') && !f.includes('reddit')
    );
  } catch {
    return [];
  }
}

function slugFromPath(fp) { return path.basename(fp, '.mdx'); }

function checkAudit(slug) {
  const auditPath = `.post-audits/${slug}.audit.json`;
  const errors = [];

  if (!existsSync(auditPath)) {
    return {
      passed: false,
      errors: [
        `AUDIT FILE AUSENTE: ${auditPath}`,
        `Execute a skill completa: /blog-post-pipeline ${slug}`,
        `Ela roda todos os agentes e escreve o audit trail.`,
      ],
    };
  }

  let audit;
  try {
    audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  } catch {
    return { passed: false, errors: [`Audit JSON inválido: ${auditPath}`] };
  }

  const age = audit.audited_at
    ? Math.round((Date.now() - new Date(audit.audited_at).getTime()) / 3600000)
    : 9999;
  if (age > 48) {
    errors.push(`Audit expirado: ${age}h atrás (máx 48h). Re-rode /blog-post-pipeline ${slug}`);
  }

  for (const step of REQUIRED_PIPELINE_STEPS) {
    const r = audit.pipeline?.[step.key];
    if (!r) {
      errors.push(`Etapa não executada: ${step.label}`);
    } else if (!r.passed) {
      errors.push(`Etapa FALHOU: ${step.label}\n       Motivo: ${r.reason || 'sem detalhe'}`);
    }
  }

  const s = audit.pipeline?.score_gate;
  if (s) {
    if ((s.composite ?? 0) < SCORE_THRESHOLDS.composite)
      errors.push(`composite ${s.composite} < ${SCORE_THRESHOLDS.composite}`);
    if ((s.geo ?? 0) < SCORE_THRESHOLDS.geo)
      errors.push(`GEO ${s.geo} < ${SCORE_THRESHOLDS.geo}`);
    if ((s.aeo ?? 0) < SCORE_THRESHOLDS.aeo)
      errors.push(`AEO ${s.aeo} < ${SCORE_THRESHOLDS.aeo} (exige 100)`);
  }

  return { passed: errors.length === 0, errors, audit };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const staged = getStagedPosts();

if (staged.length === 0) process.exit(0);

console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
console.log(`║  GATE INVIOLÁVEL: pipeline SEO completo exigido por post     ║`);
console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

let blocked = 0;

for (const file of staged) {
  const slug = slugFromPath(file);
  console.log(`► Verificando: ${slug}`);
  const { passed, errors, audit } = checkAudit(slug);

  if (passed) {
    const s = audit.pipeline?.score_gate;
    console.log(`  ✅ PASSED — ${REQUIRED_PIPELINE_STEPS.length} etapas • composite:${s?.composite} GEO:${s?.geo} AEO:${s?.aeo}\n`);
  } else {
    console.log(`  ❌ BLOQUEADO — ${errors.length} problema(s):\n`);
    for (const e of errors) console.log(`     • ${e}`);
    console.log(`\n     ↳ Comando para rodar o pipeline completo:`);
    console.log(`       node scripts/run-post-pipeline.mjs ${slug}\n`);
    blocked++;
  }
}

if (blocked > 0) {
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  🚫 COMMIT BLOQUEADO — ${blocked} post(s) sem pipeline completo    ║`);
  console.log(`║  Este gate não tem bypass. Não existe --no-verify aqui.      ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
  process.exit(1);
}

console.log(`✅ Todos os posts passaram no gate completo. Commit liberado.\n`);
process.exit(0);
