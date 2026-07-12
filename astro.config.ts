import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { execFileSync } from "node:child_process";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  integrations: [
    // GATE OBRIGATÓRIO de nomenclatura de origem — bloqueia o build (e portanto
    // o deploy) se algum evento/idTag fugir da convenção. Ver event-origins.json.
    {
      name: "event-naming-gate",
      hooks: {
        "astro:build:start": ({ logger }) => {
          try {
            const out = execFileSync("node", ["scripts/gate-event-naming.mjs"]);
            logger.info(out.toString().trim());
          } catch (e: unknown) {
            const err = e as { stdout?: Buffer; stderr?: Buffer };
            if (err.stdout) logger.error(err.stdout.toString());
            if (err.stderr) logger.error(err.stderr.toString());
            throw new Error("Gate de nomenclatura de eventos FALHOU — build bloqueado.");
          }
        },
      },
    },
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["pt-BR"],
    defaultLocale: "pt-BR",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any], // type-skew Tailwind vite plugin × rolldown-vite (Astro 6)
  },
  fonts: [
    {
      name: "Playfair Display",
      cssVariable: "--font-fraunces",
      provider: fontProviders.google(),
      fallbacks: ["Georgia", "serif"],
      weights: [400, 500, 600, 700, 800, 900],
      styles: ["normal", "italic"],
      formats: ["woff2", "woff", "ttf"],
    },
    {
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken-grotesk",
      provider: fontProviders.google(),
      fallbacks: ["system-ui", "sans-serif"],
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      formats: ["woff2", "woff"],
    },
    {
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      provider: fontProviders.google(),
      fallbacks: ["ui-monospace", "monospace"],
      weights: [400, 500],
      styles: ["normal"],
      formats: ["woff2", "woff"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
