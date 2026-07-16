# Handoff — blog-dimus (2026-07-15)

## Active Task
Aguardando resultado do chip SEO Agency Pipeline (task_f24d1bac) rodando em sessão separada.

## Goal
blog.dimus.com.br: sistema de imagens 100% + SEO Agency com pipeline G0→G12 gerando posts reais.

## Completed Actions
- 30 covers MiniMax gerados + publicados (todos os posts wired) → commit `279066a`
- Fix: custo-por-lead-concessionaria era gráfico OG → foto MiniMax → commit `ba76626`
- `docs/design-system/image-gates.md` reescrito (coverImage vs ogImage, prompts, checklist)
- ia-skills/main `f9bda06`: image-production-contract.md + brain + gates v0.2.4 + SKILL.md wired
- Chip SEO Agency criado com LLM Council ICP + MissionBrief + G0→G12

## Active State
- Files modified: nenhum pendente
- blog-dimus branch: main (limpo)
- ia-skills branch: main (limpo, f9bda06)
- SEO pipeline: rodando independente (task_f24d1bac)

## Blocked
Aguardando conclusão de task_f24d1bac.

## Key Decisions
- coverImage (foto dark cinematic) ≠ ogImage (gráfico tipográfico) — NUNCA o mesmo arquivo
- CONT-016 GERA coverImage via MiniMax se ausente — não bloqueia publicação
- SKILL.md é porta de entrada dos agentes — adicionado leitura obrigatória do DS + image contract
- LLM Council valida compatibilidade dos ICPs (automotivo vs PME+IA) antes do MissionBrief

## Pending User Asks
Nenhum.

## Remaining Work
- [ ] Aguardar task_f24d1bac + revisar resultado (LLM Council + 1 post gerado)
- [ ] Validar 1o post do pipeline antes de escalar para mais posts
- [ ] Keyword gaps (G1) → pipeline de posts em escala

## Critical Context
- Build: SEMPRE `sh node_modules/.bin/astro build` (NUNCA npm run build)
- Push: SEMPRE `DIMUS_PUSH_AUTHORITY=1 git push`
- ia-skills: wt-new.sh antes de qualquer edição em main (worktree discipline)
- Chip SEO pipeline rodando independente — não duplicar
- Notes completo: `~/Downloads/_notes/blog-dimus/NOTES-covers-seo-wiring-2026-07-15.md`
