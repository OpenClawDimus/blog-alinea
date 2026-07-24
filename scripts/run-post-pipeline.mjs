#!/usr/bin/env node
/**
 * run-post-pipeline.mjs <slug>
 *
 * Orquestrador do pipeline SEO completo de um post.
 * Gera .post-audits/<slug>.audit.json ao final se tudo passar.
 *
 * NÃO rode este script — ele é chamado automaticamente pela skill
 * /blog-post-pipeline que executa os agentes Claude Code via SDK.
 *
 * Este arquivo documenta o contrato do pipeline.
 * A skill real vive em: ~/Downloads/_IA-Skills/blog-post-pipeline/SKILL.md
 *
 * PIPELINE CANÔNICO (ordem obrigatória):
 *
 * 1. DataForSEO SERP Research
 *    - keywords: volume, dificuldade, CPC, location_code: 2076 (BR), language: pt
 *    - SERP analysis: featured snippets, PAA, AI Overview presença
 *    - Intent check: 100% transactional/informational relevante, 0% contaminação
 *
 * 2. MiroFish ICP Validation
 *    - Personas automotivas (10 personas BR definidas em MiroFish)
 *    - Pergunta: essa persona busca esse conteúdo? resolve um job-to-be-done real?
 *    - Score mínimo: 3/5 personas validam o tópico
 *
 * 3. Deduplication Check
 *    - rg nas titles e descriptions de todos os posts existentes
 *    - Semantic check: o ângulo é genuinamente diferente dos posts publicados?
 *    - PROIBIDO: dois posts cobrindo o mesmo ângulo (não só a mesma keyword)
 *
 * 4. SEO Agent (análise do rascunho do post)
 *    - H1 = título exato (40-70 chars, keyword principal)
 *    - H2s: cobrem entidades semânticas necessárias para o cluster
 *    - Keyword density: primary keyword 1-2%, secondary 0.5-1%
 *    - Internal links: mínimo 3 links para posts do mesmo cluster
 *    - Image alt text: coverImage tem alt descritivo (não nome de arquivo)
 *    - Meta description: 120-160 chars, keyword principal nos primeiros 120 chars
 *    - Title tag logic: keyword principal no início, benefit no final
 *
 * 5. AEO Agent (Answer Engine Optimization)
 *    - AnswerCapsule: resposta direta em ≤ 2 frases nos primeiros 100 chars
 *    - FAQ schema: ≥3 perguntas reais que aparecem no People Also Ask do SERP
 *    - Featured snippet candidato: tabela ou lista no formato correto
 *    - Resposta direta a query principal nos primeiros 300 chars do corpo
 *
 * 6. GEO Agent (Generative Engine Optimization)
 *    - Citabilidade: o post seria citado por ChatGPT/Gemini/Claude?
 *    - Dados com fonte: toda estatística tem citação rastreável
 *    - Definições claras: entidades definidas explicitamente no texto
 *    - Formato LLM-friendly: parágrafos curtos, sem jargão não definido
 *
 * 7. EEAT Check
 *    - Experience: dados de campo, casos reais, "em revendas que acompanhamos"
 *    - Expertise: autor identificado com credencial relevante
 *    - Authoritativeness: fontes primárias citadas (HBR, FIPE, Monitor Mercantil)
 *    - Trust: disclaimer "sem conflito de interesse" presente, links funcionam
 *    - Para post de marca pessoal: Guilherme Ribeiro citado como autor com bio
 *
 * 8. Image SEO Check
 *    - coverImage: filename descritivo (não image_0_dark_cin_...), alt text definido
 *    - OG image: 1200x630, texto legível em 600px preview, padrão visual Dimus
 *    - Todos os <img> no MDX têm alt text não vazio
 *
 * 9. LLM Council (editorial red team)
 *    - 5 advisors: Contrarian, First Principles, Expansionist, Outsider, Executor
 *    - Peer review anônimo entre advisors
 *    - Chairman synthesis: recomendação final com "one thing to do first"
 *    - BLOQUEANTE se council identificar factual error ou angle fraco
 *
 * 10. gate-covers.mjs
 *     - 0 duplicate coverImage, 0 duplicate title, 0 og- em cover, 0 /og/ em cover
 *
 * 11. score-posts.mjs
 *     - composite ≥ 95, GEO ≥ 90, AEO = 100
 *
 * OUTPUT: .post-audits/<slug>.audit.json
 * {
 *   "slug": "...",
 *   "audited_at": "ISO8601",
 *   "keyword": "keyword principal",
 *   "pipeline": {
 *     "dataforseo_serp":     { "passed": true, "volume": 320, "difficulty": 18, "intent": "informational" },
 *     "serp_intent_clear":   { "passed": true },
 *     "mirofish_icp":        { "passed": true, "personas_matched": 4 },
 *     "no_content_duplicate": { "passed": true },
 *     "seo_agent":           { "passed": true, "h2_count": 6, "internal_links": 4 },
 *     "aeo_agent":           { "passed": true, "faq_count": 3 },
 *     "geo_agent":           { "passed": true, "citability": "high" },
 *     "eeat_check":          { "passed": true },
 *     "image_seo_cover":     { "passed": true },
 *     "image_seo_og":        { "passed": true },
 *     "gate_covers_pass":    { "passed": true },
 *     "llm_council":         { "passed": true, "council_verdict": "..." },
 *     "score_gate":          { "passed": true, "composite": 98, "geo": 100, "aeo": 100 }
 *   }
 * }
 */

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/run-post-pipeline.mjs <slug>');
  console.error('');
  console.error('Este script documenta o contrato. A execução real usa:');
  console.error('  /blog-post-pipeline <slug>   (skill Claude Code)');
  process.exit(1);
}

console.log(`\n📋 Pipeline para: ${slug}`);
console.log(`\nEste script é o contrato. A skill real que executa os agentes:`);
console.log(`  ~/Downloads/_IA-Skills/blog-post-pipeline/SKILL.md`);
console.log(`\nRode via Claude Code:\n  /blog-post-pipeline ${slug}\n`);
