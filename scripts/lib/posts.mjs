// Leitura mínima de frontmatter dos posts (sem dependências) — usada pelos gates
// e pelo gerador de card de WhatsApp. Roda no CI (runner) e no Mac, sem npm install.
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

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
      const slash = (c) => (c && !/^https?:/.test(c) && !c.startsWith('/') ? `/${c}` : c);
      return {
        slug: f.replace(/\.mdx?$/, ''),
        title: get('title'),
        pubDatetime: get('pubDatetime'),
        coverImage: slash(get('coverImage')),
        ogImage: slash(get('ogImage')),
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

/** Caminho em disco da imagem referenciada (sempre sob public/), ou null se não existir. */
export function resolvePublicImage(ref) {
  if (!ref || /^https?:/.test(ref)) return null;
  const p = join('public', ref.replace(/^\//, ''));
  return existsSync(p) ? p : null;
}

/** Dimensões de JPEG/PNG lidas do cabeçalho (sem dependência). */
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { type: 'jpeg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

export const fileBase = (p) => basename(p);
