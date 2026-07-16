# G2 — Technical Foundation Gate: RESULTADO
> Data: 2026-07-15 · Status: APROVADO COM RESSALVAS

## Status geral: APROVADO COM RESSALVAS

Pilares técnicos (sitemap, robots.txt, tracking, schema) sólidos.
Problema bloqueante: **30/32 posts sem links internos**.

---

## 1. coverImage — PASS
- Posts sem coverImage: 0/32 ✅
- Posts com coverImage incorreta (/og/): 0 ✅
- Todos os 32 posts têm coverImage correta

## 2. ogImage — PASS
- Posts sem ogImage: 0/32 ✅

## 3. Draft posts
- **checklist-custo-do-lead-parado.mdx** — `draft: true` (intencional ou esquecido?)

## 4. Sitemap e robots.txt — PASS
- robots.txt: configurado, permite GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- Sitemap: `@astrojs/sitemap` configurado em astro.config.ts, com filtro para `/archives/`

## 5. Tracking — PASS
- GA4: `G-Y7PSFTCZJL` — configurado em Layout.astro, evento `generate_lead` em lead.ts ✅
- Meta Pixel: ID `998136448049534` — configurado, evento `Lead` com deduplicação via eventID ✅

## 6. Schema markup — PASS
- BlogPosting, BreadcrumbList, FAQPage (condicional), Organization, WebSite ✅

## 7. Links internos — ⚠️ FAIL CRÍTICO
- Gate mínimo: ≥5 links internos
- **30/32 posts sem nenhum link interno**
- Apenas 2 posts têm links: `tempo-medio-de-venda-de-carro-usado.mdx` (5 links) e `preco-abaixo-nao-vende-mais.mdx`

Posts sem links internos (30):
atribuicao-de-origem-qual-canal-vendeu, automacao-de-email-marketing-com-ia, automacao-de-marketing-com-inteligencia-artificial, automacao-whatsapp-business-para-empresas, cac-concessionaria-como-calcular-benchmark-2025, carro-parado-quanto-custa, chatbot-para-atendimento-e-vendas-whatsapp, como-a-ia-pode-aumentar-vendas-de-pequenas-empresas, como-gerar-leads-qualificados-com-inteligencia-artificial, como-reduzir-custo-por-lead-com-ia, crm-com-inteligencia-artificial-para-pequenas-empresas, custo-estoque-parado-concessionaria-por-dia, custo-por-lead-concessionaria-benchmark-2025, custo-por-lead-ideal-para-diferentes-setores-brasil, ferramentas-de-ia-para-marketing-digital, ia-para-atendimento-ao-cliente-24-horas, indicacao-canal-mais-barato, indicacao-invisivel-revenda, inteligencia-artificial-para-funil-de-vendas, lead-fantasma-concessionaria-custo-real, lead-fantasma-quanto-custa, leads-nao-respondem-protocolo-reengajamento, marketing-de-conteudo-com-inteligencia-artificial, o-que-e-agencia-de-inteligencia-artificial, refem-do-portal, roi-de-automacao-de-marketing-digital, tempo-de-resposta-ao-lead, tempo-resposta-lead-automotivo-5-minutos, whatsapp-como-canal-de-vendas

## 8. CTA — ⚠️ NÃO-CRÍTICO
- Posts COM DimusHelp/LeadForm: 17/32
- Posts SEM CTA de conversão: 15/32 (maioria cluster IA/PME genérico)

---

## ACHADOS CRÍTICOS (bloqueantes para G7)

1. **30/32 posts sem links internos** — prejudica autoridade topical, rastreabilidade e PageRank interno. Requer retrofit priorizado no cluster automotivo.
2. **Draft post não confirmado** — `checklist-custo-do-lead-parado.mdx` com `draft: true` — confirmar se intencional.

## ACHADOS NÃO-CRÍTICOS

1. 15/32 posts sem CTA de conversão (cluster IA genérico principalmente)
2. Meta Pixel ID hardcoded como fallback em Layout.astro linha 71
3. Schema não tem campo `related:` — todo linking é manual

---

## REGRAS PARA NOVO POST (obrigatórias)

1. ✅ Mínimo **3 links internos** para posts do mesmo cluster
2. ✅ Componente **DimusHelp ou LeadForm** antes do último bloco
3. ✅ coverImage via MiniMax (foto dark cinematic) + ogImage distinto
4. ✅ `draft: false` no frontmatter
5. ✅ meta description 120-160 chars começando com ação
