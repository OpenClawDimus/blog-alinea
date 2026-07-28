import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.dimus.com.br/",
    title: "Blog Dimus — Marketing Automotivo",
    description:
      "Blog de marketing automotivo para revendas de seminovos e concessionárias. Google Ads, Meta Ads, WhatsApp, CRM e como medir ROI real em carro vendido.",
    author: "Dimus",
    profile: "https://dimus.com.br",
    ogImage: "default-og.png",
    lang: "pt-BR",
    timezone: "America/Sao_Paulo",
    dir: "ltr",

    // ── Client-specific values — troque aqui ao criar um novo blog ──
    blogShortTitle: "Blog Dimus",
    ga4Id: "G-Y7PSFTCZJL",
    metaPixelId: "998136448049534",
    whatsappNumber: "5567991992882",
    whatsappMessage: "Olá! Quero saber mais sobre marketing automotivo",
    articleSection: "Marketing Automotivo",
    organization: {
      name: "Dimus",
      logo: "logo-dimus.png",
      sameAs: [
        "https://instagram.com/dimus",
        "https://www.linkedin.com/company/dimus/",
      ],
    },
    authorPerson: {
      name: "Guilherme Ribeiro",
      url: "https://guilhermeribeiro.me",
      jobTitle: "Fundador",
      avatar: "guilherme-ribeiro.png",
      sameAs: [
        "https://www.instagram.com/guilhermeribeiro.me/",
        "https://dimus.com.br",
      ],
      knowsAbout: [
        "marketing automotivo",
        "CRM para concessionárias",
        "gestão de leads automotivos",
        "atribuição de marketing digital",
        "revenda de veículos seminovos",
        "gestão de concessionárias",
      ],
    },
  },
  posts: {
    perPage: 12,
    perIndex: 12,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: false,
    dynamicOgImage: false, // A3: redesenhar OG dark-brand via satori (woff2/ttf fix). Por ora usa default-og.jpg estático.
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "instagram", url: "https://instagram.com/dimus" },
    { name: "linkedin", url: "https://www.linkedin.com/company/dimus/" },
    { name: "mail", url: "mailto:suporte@dimus.com.br" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=Veja%20esse%20post&body=" },
  ],
});