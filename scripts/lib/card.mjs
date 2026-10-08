// Renderização do card "Apple TV" (cover em tela cheia + degradê + título) e carregamento da marca.
// Usado por gen-wa-preview (1280x720, WhatsApp), gen-og (1200x630, só quando o OG não existe) e
// pelo gate (mesmo hash de marca → o gate nunca "diverge" do gerador).
import { readFileSync } from 'fs';
import satori from 'satori';
import sharp from 'sharp';

export { loadBrand, sha } from './brand.mjs';

const h = (type, style, children) => ({ type, props: { style, children } });
let FONT;

export async function renderCard({ title, coverPath, W, H, brand, host, showLabel = true }) {
  FONT ??= readFileSync('scripts/assets/fonts/GothamBold.ttf');
  let src = sharp(readFileSync(coverPath));
  // covers geradas por IA costumam vir com tarja preta em cima/embaixo: remove antes do enquadramento
  try { src = sharp(await src.trim({ background: '#000000', threshold: 22 }).toBuffer()); } catch { src = sharp(readFileSync(coverPath)); }
  const cover = await src.resize(W, H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 88 }).toBuffer();
  const k = W / 1280; // escala relativa ao card de 1280 px
  const long = title.length > 62;
  const tree = h('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: '#0D0415' }, [
    { type: 'img', props: { src: `data:image/jpeg;base64,${cover.toString('base64')}`, width: W, height: H, style: { position: 'absolute', top: 0, left: 0 } } },
    h('div', { position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundImage: 'linear-gradient(to top, rgba(8,4,16,0.96) 0%, rgba(8,4,16,0.84) 36%, rgba(8,4,16,0.28) 64%, rgba(8,4,16,0) 82%)' }),
    h('div', { position: 'absolute', top: 0, left: 0, width: W, height: 150 * k, backgroundImage: 'linear-gradient(to bottom, rgba(8,4,16,0.72) 0%, rgba(8,4,16,0) 100%)' }),
    h('div', { position: 'absolute', top: 44 * k, left: 72 * k, display: 'flex', alignItems: 'center', fontSize: 24 * k, letterSpacing: 5, color: '#FFFFFF' }, [
      h('div', { width: 14 * k, height: 14 * k, borderRadius: 7 * k, backgroundColor: brand.accent, marginRight: 16 * k }),
      h('div', {}, String(brand.name).toUpperCase()),
    ]),
    h('div', { position: 'absolute', left: 72 * k, bottom: 52 * k, width: 1136 * k, display: 'flex', flexDirection: 'column' }, [
      ...(showLabel ? [h('div', { fontSize: 24 * k, letterSpacing: 4, color: brand.accent, marginBottom: 20 * k }, brand.label)] : []),
      h('div', { fontSize: (long ? 56 : 66) * k, lineHeight: 1.1, color: '#FFFFFF', lineClamp: 3, letterSpacing: -1 }, title),
      h('div', { width: 140 * k, height: 5, marginTop: 26 * k, marginBottom: 20 * k, backgroundImage: `linear-gradient(to right, ${brand.accent}, ${brand.accent2})` }),
      h('div', { fontSize: 24 * k, color: '#C9C2D0', letterSpacing: 1 }, host),
    ]),
  ]);
  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Gotham', data: FONT, weight: 700, style: 'normal' }] });
  return sharp(Buffer.from(svg)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
