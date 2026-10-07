// Leitura mínima de frontmatter dos posts (sem dependências) — usada por
// build-schedule, gen-wa-preview e gate-wa-preview.
import { readdirSync, readFileSync } from 'fs';

export const POSTS_DIR = 'src/content/posts';

const unq = (s) => s.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"');

export function readPosts() {
  return readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const raw = readFileSync(`${POSTS_DIR}/${f}`, 'utf8');
      const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const get = (k) => {
        const m = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
        return m ? unq(m[1]) : undefined;
      };
      return {
        slug: f.replace(/\.mdx?$/, ''),
        title: get('title'),
        pubDatetime: get('pubDatetime'),
        coverImage: (() => { const c = get('coverImage'); return c && !/^https?:/.test(c) && !c.startsWith('/') ? `/${c}` : c; })(),
        draft: get('draft') === 'true',
      };
    })
    .filter((p) => p.title && p.pubDatetime && !p.draft);
}

export function readSite() {
  const cfg = readFileSync('astro-paper.config.ts', 'utf8');
  const url = cfg.match(/url:\s*"([^"]+)"/)?.[1] ?? '';
  const short = cfg.match(/blogShortTitle:\s*"([^"]+)"/)?.[1] ?? 'Blog';
  return { siteUrl: url.endsWith('/') ? url : `${url}/`, blogShortTitle: short };
}
