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
    "Blog de BPO financeiro e contabilidade consultiva para empresas em Brasília-DF. Foco em gestão financeira terceirizada, planejamento tributário, Reforma Tributária 2026 (IBS/CBS/Split Payment), regimes fiscais (Simples Nacional, Lucro Presumido, Lucro Real) e fornecedores do setor público federal.",
    "",
    "## Posts",
    ...posts.map(p => {
      const url = new URL(`posts/${p.id}/`, base).href;
      return `- [${p.data.title}](${url}): ${p.data.description}`;
    }),
    "",
    "## Sobre a Alínea Finanças",
    `- [Site Alínea](${config.site.profile}): BPO financeiro e contabilidade consultiva em Brasília-DF — gestão financeira, planejamento tributário e fornecedores do governo federal.`,
    `- Especialistas em BPO financeiro para PMEs no Distrito Federal, com foco em regularização fiscal e redução legal de carga tributária.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
