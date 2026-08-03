#!/usr/bin/env node
/**
 * IndexNow — notifica Bing/Yandex/Seznam (e indiretamente ajuda a fila de
 * crawl geral) sobre todas as URLs do sitemap a cada deploy. Achado real
 * (2026-07-16): a chave `dimus-blog-indexnow-key` estava provisionada no
 * GSM desde antes, mas nunca tinha sido usada em código nenhum — indexação
 * de post novo dependia 100% do Google recrawlear por conta própria, sem
 * nenhum push ativo. Isso corrige isso.
 *
 * IndexNow != Google diretamente (Google não participa do protocolo), mas
 * Bing/Yandex participam e o próprio ecossistema de crawl se beneficia.
 * Reenviar URLs que não mudaram é seguro pelo protocolo (não é penalizado).
 *
 * Uso: node scripts/indexnow-ping.mjs (rodar depois de `astro build`, já
 * que lê dist/sitemap-0.xml).
 */

const HOST = "blog.monumentalcontabilidade.com.br";
const KEY = process.env.INDEXNOW_KEY;

if (!KEY) {
  console.error("❌ INDEXNOW_KEY não setada no ambiente — pulando ping (não falha o build).");
  process.exit(0);
}

const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  const fs = await import("node:fs/promises");
  let sitemapXml;
  try {
    sitemapXml = await fs.readFile(new URL("../dist/sitemap-0.xml", import.meta.url), "utf-8");
  } catch {
    console.error("❌ dist/sitemap-0.xml não encontrado — rode `astro build` antes deste script.");
    process.exit(0);
  }

  const urlList = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!urlList.length) {
    console.error("❌ Nenhuma URL encontrada no sitemap — nada pra notificar.");
    process.exit(0);
  }

  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  });

  const resp = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  });

  // IndexNow retorna 200 ou 202 em sucesso (202 = aceito, processamento assíncrono).
  if (resp.ok || resp.status === 202) {
    console.log(`✅ IndexNow: ${urlList.length} URLs notificadas (HTTP ${resp.status}).`);
  } else {
    const text = await resp.text().catch(() => "");
    console.error(`⚠️  IndexNow retornou HTTP ${resp.status}: ${text.slice(0, 300)}`);
    // Nunca falha o build por causa de indexação — best-effort.
  }
}

main().catch((e) => {
  console.error("⚠️  IndexNow ping falhou (best-effort, não bloqueia build):", e.message);
});
