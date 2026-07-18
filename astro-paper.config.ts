import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.dimus.com.br/",
    title: "Blog Dimus",
    description:
      "Marketing que mede carro vendido, não lead. Conteúdo neutro-de-fornecedor para donos e gerentes de revenda, seminovos e concessionária.",
    author: "Dimus",
    profile: "https://dimus.com.br",
    ogImage: "default-og.png",
    lang: "pt-BR",
    timezone: "America/Sao_Paulo",
    dir: "ltr",
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