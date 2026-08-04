import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import config from "@/config";

/**
 * llms.txt — guia de descoberta para LLMs/agentes (padrão llmstxt.org).
 * Lista os posts e o posicionamento do blog para citação em respostas de IA.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = site?.href ?? config.site.url;
  const posts = (await getCollection("posts"))
    .filter(p => !p.data.draft)
    .sort(
      (a, b) =>
        +new Date(b.data.pubDatetime) - +new Date(a.data.pubDatetime)
    );

  const lines = [
    `# ${config.site.title}`,
    "",
    `> ${config.site.description}`,
    "",
    "Blog de contabilidade consultiva para empresas em Brasília-DF. Foco em planejamento tributário estratégico, Reforma Tributária 2026 (IBS/CBS), regimes fiscais (Simples Nacional, Lucro Presumido, Lucro Real), holdings patrimoniais e fornecedores do setor público federal. Jocivane Brito é tributarista com atuação exclusiva no DF.",
    "",
    "## Posts",
    ...posts.map(p => {
      const url = new URL(`posts/${p.id}/`, base).href;
      return `- [${p.data.title}](${url}): ${p.data.description}`;
    }),
    "",
    "## Sobre a Monumental Contabilidade",
    `- [Site Monumental](${config.site.profile}): contabilidade consultiva em Brasília-DF — planejamento tributário, holdings e fornecedores do governo federal.`,
    `- Autor: Jocivane Brito, tributarista CRC-DF, especialista em redução de carga tributária para PMEs no Distrito Federal.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
