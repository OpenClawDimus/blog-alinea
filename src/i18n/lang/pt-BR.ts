import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Início",
    posts: "Posts",
    tags: "Tags",
    about: "Sobre",
    archives: "Arquivo",
    search: "Buscar",
  },
  post: {
    publishedAt: "Publicado em",
    updatedAt: "Atualizado",
    sharePostIntro: "Compartilhe este post:",
    sharePostOn: "Compartilhar no {{platform}}",
    sharePostViaEmail: "Compartilhar por e-mail",
    tagLabel: "Tags",
    backToTop: "Voltar ao topo",
    goBack: "Voltar",
    editPage: "Editar página",
    previousPost: "Post anterior",
    nextPost: "Próximo post",
  },
  pagination: {
    prev: "Anterior",
    next: "Próximo",
    page: "Página",
  },
  home: {
    socialLinks: "Redes",
    featured: "Em destaque",
    recentPosts: "Mais recentes",
    allPosts: "Todos os posts",
  },
  footer: {
    copyright: "Alínea Finanças",
    allRightsReserved: "Todos os direitos reservados.",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "Todos os artigos com a tag",

    tagsTitle: "Tags",
    tagsDesc: "Todas as tags usadas nos posts.",

    postsTitle: "Posts",
    postsDesc: "Todos os artigos publicados.",

    archivesTitle: "Arquivo",
    archivesDesc: "Todos os artigos arquivados.",

    searchTitle: "Buscar",
    searchDesc: "Busque qualquer artigo…",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    toggleTheme: "Alternar tema",
    searchPlaceholder: "Buscar posts…",
    noResults: "Nenhum resultado encontrado",
    goToPreviousPage: "Ir para a página anterior",
    goToNextPage: "Ir para a próxima página",
  },
  notFound: {
    title: "404 Não encontrado",
    message: "Página não encontrada",
    goHome: "Voltar para o início",
  },
} satisfies UIStrings;
