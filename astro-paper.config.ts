import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.monumentalcontabilidade.com.br/",
    title: "Blog Monumental Contabilidade — Tributarista em Brasília",
    description:
      "Blog de contabilidade consultiva para empresas em Brasília-DF. Planejamento tributário, reforma tributária 2026, IBS, CBS, Simples Nacional, Lucro Presumido e gestão fiscal inteligente.",
    author: "Jocivane Brito",
    profile: "https://monumentalcontabilidade.com.br",
    ogImage: "default-og.png",
    lang: "pt-BR",
    timezone: "America/Sao_Paulo",
    dir: "ltr",

    // ── Monumental Contabilidade — Brasília-DF ──
    blogShortTitle: "Blog Monumental",
    ga4Id: "G-715ZBSK42X",
    metaPixelId: "1310601837950029",
    whatsappNumber: "556120990889",
    whatsappMessage: "Olá! Quero saber mais sobre contabilidade e planejamento tributário para minha empresa",
    articleSection: "Contabilidade",
    organization: {
      name: "Monumental Contabilidade",
      logo: "logo-monumental.png",
      sameAs: [
        "https://monumentalcontabilidade.com.br",
      ],
    },
    authorPerson: {
      name: "Jocivane Brito",
      url: "https://monumentalcontabilidade.com.br",
      jobTitle: "Tributarista",
      avatar: "jocivane-brito.jpg",
      sameAs: [
        "https://monumentalcontabilidade.com.br",
      ],
      knowsAbout: [
        "planejamento tributário",
        "contabilidade consultiva",
        "reforma tributária 2026",
        "IBS e CBS",
        "Simples Nacional",
        "Lucro Presumido",
        "Lucro Real",
        "holding patrimonial",
        "fornecedores governo federal",
        "contabilidade empresarial Brasília",
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
    dynamicOgImage: false, // A3: redesenhar OG dark-brand via satori (woff2/ttf fix). Por ora usa default-og.jpg estático.
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "mail", url: "mailto:contato@monumentalcontabilidade.com.br" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=Veja%20esse%20artigo&body=" },
  ],
});