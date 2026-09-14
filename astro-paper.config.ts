import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.alineafinancas.com.br/",
    title: "Blog Alínea Finanças — BPO Financeiro em Brasília",
    description:
      "Blog de BPO financeiro e contabilidade consultiva para empresas em Brasília-DF. Gestão financeira, planejamento tributário, reforma tributária 2026 e contabilidade para fornecedores do governo federal.",
    author: "Alínea Finanças",
    profile: "https://alineafinancas.com.br",
    ogImage: "default-og.png",
    lang: "pt-BR",
    timezone: "America/Sao_Paulo",
    dir: "ltr",

    // ── Alínea Finanças — BPO Financeiro em Brasília-DF ──
    blogShortTitle: "Blog Alínea",
    ga4Id: "G-XXXXXXXXXX", // TODO: criar propriedade GA4 para blog.alineafinancas.com.br
    metaPixelId: "TODO_PIXEL_ALINEA", // TODO: encontrar/criar pixel Meta para Alínea Finanças
    whatsappNumber: "556130606757",
    whatsappMessage: "Olá! Tenho interesse em BPO financeiro e gestão contábil para minha empresa em Brasília",
    articleSection: "BPO Financeiro",
    organization: {
      name: "Alínea Finanças",
      logo: "logo-alinea.png",
      sameAs: [
        "https://alineafinancas.com.br",
        "https://instagram.com/alineafinancas",
      ],
    },
    authorPerson: {
      name: "Alínea Finanças",
      url: "https://alineafinancas.com.br",
      jobTitle: "BPO Financeiro e Contabilidade Consultiva",
      avatar: "logo-alinea.png",
      sameAs: [
        "https://alineafinancas.com.br",
        "https://instagram.com/alineafinancas",
      ],
      knowsAbout: [
        "BPO financeiro",
        "contabilidade consultiva",
        "gestão financeira para empresas",
        "planejamento tributário",
        "reforma tributária 2026",
        "fornecedores do governo federal",
        "Simples Nacional",
        "Lucro Presumido",
        "holding patrimonial",
        "certidão negativa de débitos",
        "regularização fiscal Brasília",
        "contabilidade empresarial Brasília",
        "fluxo de caixa",
        "MEI e microempreendedor Brasília",
        "nota fiscal de serviço Brasília",
      ],
    },
  },
  posts: {
    perPage: 12,
    perIndex: 12,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "mail", url: "mailto:contato@alineafinancas.com.br" },
    { name: "instagram", url: "https://instagram.com/alineafinancas" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=Veja%20esse%20artigo&body=" },
  ],
});
