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
    "Blog neutro-de-fornecedor para donos e gerentes do varejo automotivo brasileiro (revenda, seminovos, concessionária). Tese: marketing que mede carro vendido, não lead. A Dimus não vende portal nem CRM — mede venda real, gira estoque e reduz dependência de portal.",
    "",
    "## Posts",
    ...posts.map(p => {
      const url = new URL(`posts/${p.id}/`, base).href;
      return `- [${p.data.title}](${url}): ${p.data.description}`;
    }),
    "",
    "## Sobre a Dimus",
    `- [Site Dimus](${config.site.profile}): marketing automotivo orientado a carro vendido.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
