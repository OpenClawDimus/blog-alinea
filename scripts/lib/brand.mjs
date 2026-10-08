// Marca + versão do renderizador dos cards. SEM dependências pesadas: o gate (roda no CI) importa daqui.
// Mudou o visual do card? Aumente RENDER_VERSION: todos os cards ficam "velhos" e o gate exige regenerar.
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { readSite } from './posts.mjs';

export const RENDER_VERSION = '2';
export const sha = (b) => createHash('sha1').update(b).digest('hex').slice(0, 12);

export function loadBrand() {
  const { siteUrl, blogShortTitle } = readSite();
  const host = new URL(siteUrl).host;
  const brand = { accent: '#FF007F', accent2: '#00E5FF', label: 'NOVO POST', name: blogShortTitle, ...(existsSync('wa-brand.json') ? JSON.parse(readFileSync('wa-brand.json', 'utf8')) : {}) };
  return { brand, host, brandHash: sha(JSON.stringify(brand) + host + RENDER_VERSION) };
}
