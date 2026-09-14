/**
 * Lead capture — form-first → WhatsApp (padrão validado no mockup blog/v2.2.0).
 * Delegado: 1 listener para todos os <form data-lead> da página.
 * Dispara GA4 generate_lead + Meta Pixel Lead (eventID = lead_ref), POST /tracker
 * (sendBeacon → D1 + Meta CAPI + forward Supabase blueprint), depois abre o WhatsApp com [ID:ref].
 */
const WA_NUMBER = "556130606757"; // Alínea Finanças — Brasília-DF

const fmtBR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");

/**
 * CONVENÇÃO DE NOMENCLATURA DE ORIGEM (lê o nome → sabe de onde veio):
 *   <propriedade>-<superfície>-<cluster>   ex.: blog-calc-estoque
 *     propriedade: blog (vs usa, blueprint, infofast)
 *     superfície : calc | quiz | post  (onde na página o lead nasceu)
 *     cluster    : estoque | atribuicao | portal
 *   lead_ref = <origem>-<base36(tempo)>-<rand>  → prefixo legível + sufixo único.
 * O `origem` (idTag) é o MESMO valor em lead_ref, content_name (Pixel+CAPI) e
 * param GA4 lead_origin. Eventos de plataforma seguem padrão (Meta Lead / GA4
 * generate_lead) p/ não perder otimização — a origem vive nos rótulos.
 */
function makeRef(origin: string): string {
  let rand = "";
  try {
    const a = new Uint8Array(4);
    (self.crypto || window.crypto).getRandomValues(a);
    rand = Array.from(a, b => b.toString(36)).join("").slice(0, 6);
  } catch {
    rand = Math.random().toString(36).slice(2, 8);
  }
  return `${origin}-${Date.now().toString(36)}-${rand}`;
}

// summary = frase pronta p/ o WhatsApp (cada calculadora monta a sua).
// Campos da calculadora de carro parado mantidos p/ retrocompat (fallback).
type CalcState = {
  summary?: string;
  valor?: number;
  dias?: number;
  dia?: number;
  acc?: number;
};

function handleSubmit(form: HTMLFormElement) {
  const data = new FormData(form);
  const nome = String(data.get("nome") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const wa = String(data.get("whatsapp") ?? "").replace(/\D/g, "");
  const website = String(data.get("website") ?? "").trim(); // honeypot
  if (nome.length < 2) {
    (form.querySelector('[name="nome"]') as HTMLInputElement)?.focus();
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    (form.querySelector('[name="email"]') as HTMLInputElement)?.focus();
    return;
  }
  if (wa.length < 10) {
    (form.querySelector('[name="whatsapp"]') as HTMLInputElement)?.focus();
    return;
  }

  const origin = form.dataset.idtag || "blog-lead"; // origem canônica (ver makeRef)
  const ref = makeRef(origin); // lead_ref / event_id — prefixo legível + sufixo único

  const withCalc = form.dataset.withcalc !== undefined;
  const calc = withCalc
    ? ((window as unknown as { __calc?: CalcState }).__calc ?? null)
    : null;
  const magnet = form.dataset.magnet || (withCalc ? "calc-carro-parado" : null);

  // GA4 — recommended event (funil) + evento específico para Google Ads import
  try {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("event", "generate_lead", {
        lead_source: "blog",
        lead_type: "form_principal",
        lead_origin: origin,
        method: "form-first-whatsapp",
        post_slug: form.dataset.postSlug || "",
        cluster: form.dataset.cluster || "",
        magnet_slug: magnet,
        lead_ref: ref,
      });
      // Evento específico para importar no Google Ads como "Blog - Lead WhatsApp"
      gtag("event", "blog_whatsapp_lead", {
        lead_source: "blog",
        lead_origin: origin,
        post_slug: form.dataset.postSlug || "",
        lead_ref: ref,
      });
    }
  } catch {
    /* noop */
  }

  // Meta Pixel — Advanced Matching (email hashed) + Lead event com dedup CAPI
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    const pid = (window as unknown as { __fbpid?: string }).__fbpid;
    if (fbq) {
      // Advanced Matching: re-init com email hash antes do track
      if (pid && email) {
        crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.toLowerCase().trim()))
          .then(buf => {
            const em = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
            fbq("init", pid, { em });
          })
          .catch(() => { /* noop */ });
      }
      fbq("track", "Lead", { content_name: origin }, { eventID: ref });
    }
  } catch {
    /* noop */
  }

  // Server-side tracking (KROB): D1 + Meta CAPI + forward Supabase blueprint.
  // sendBeacon = fire-and-forget, sobrevive ao window.open do WhatsApp.
  // event_id = ref → dedup com o pixel acima. Same-origin: sem CORS/preflight.
  try {
    const payload = {
      event_name: "Lead",
      event_id: ref,
      event_source_url: location.href,
      lead_ref: ref,
      source: "blog",
      lead_origin: origin, // origem canônica → content_name no CAPI (server)
      nome,
      email,
      whatsapp: wa,
      post_slug: form.dataset.postSlug || "",
      cluster: form.dataset.cluster || "",
      magnet_slug: magnet || "",
      page_url: location.href,
      website, // honeypot — preenchido = bot → tracker.js descarta
    };
    const data = JSON.stringify(payload);
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/tracker", new Blob([data], { type: "text/plain" }));
    if (!sent) {
      void fetch("/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* noop */
  }

  const extra = calc
    ? calc.summary
      ? ` ${calc.summary}`
      : calc.valor != null
        ? ` Meu carro de ${fmtBR(calc.valor)} parado há ${calc.dias} dias já custou ${fmtBR(calc.acc!)} (${fmtBR(calc.dia!)}/dia).`
        : ""
    : "";
  const intent =
    form.dataset.intent || "Quero o diagnóstico de giro do meu estoque.";
  const msg = `Olá! Sou ${nome}. ${intent}${extra} [ID:${ref}]`;
  const waUrl = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  form.reset();

  // Popup de confirmação com countdown de 3s antes do redirect
  showWAPopup(waUrl, nome);
}

function showWAPopup(waUrl: string, nome: string): void {
  const existing = document.getElementById("sr-wa-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "sr-wa-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-label", "Redirecionando para WhatsApp");
  popup.innerHTML = `
    <div id="sr-wa-popup-inner">
      <div id="sr-wa-popup-icon">✓</div>
      <p id="sr-wa-popup-ok">Recebemos! Abrindo WhatsApp…</p>
      <p id="sr-wa-popup-name">${nome}, vamos continuar no WhatsApp.</p>
      <div id="sr-wa-popup-count" aria-live="polite">3</div>
      <button id="sr-wa-popup-go" type="button">Ir agora →</button>
      <p id="sr-wa-popup-skip">ou <button id="sr-wa-popup-cancel" type="button">fechar</button></p>
    </div>
  `;
  Object.assign(popup.style, {
    position: "fixed", inset: "0", zIndex: "9999",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(11,10,13,.88)", backdropFilter: "blur(10px)",
  } as CSSStyleDeclaration);

  const inner = popup.querySelector<HTMLElement>("#sr-wa-popup-inner")!;
  Object.assign(inner.style, {
    background: "#131017",
    border: "1px solid rgba(225,55,158,.3)",
    borderRadius: "20px",
    padding: "36px 40px 28px",
    maxWidth: "380px",
    width: "calc(100% - 40px)",
    textAlign: "center",
    boxShadow: "0 32px 80px rgba(0,0,0,.7)",
  } as CSSStyleDeclaration);

  document.body.appendChild(popup);

  // inline styles for inner elements
  const icon = document.getElementById("sr-wa-popup-icon")!;
  Object.assign(icon.style, { fontSize: "32px", marginBottom: "12px", color: "#25D366" });
  const okEl = document.getElementById("sr-wa-popup-ok")!;
  Object.assign(okEl.style, { fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "17px", color: "var(--ink)", margin: "0 0 6px" });
  const nameEl = document.getElementById("sr-wa-popup-name")!;
  Object.assign(nameEl.style, { fontSize: "14px", color: "var(--ink-2)", margin: "0 0 20px" });
  const countEl = document.getElementById("sr-wa-popup-count")!;
  Object.assign(countEl.style, { fontSize: "44px", fontWeight: "700", color: "var(--magenta)", margin: "0 0 20px", lineHeight: "1", fontFamily: "var(--font-mono)" });
  const goBtn = document.getElementById("sr-wa-popup-go")!;
  Object.assign(goBtn.style, {
    display: "block", width: "100%", padding: "12px 20px", borderRadius: "999px",
    background: "#25D366", border: "none", color: "#fff", fontWeight: "700",
    fontSize: "15px", cursor: "pointer", marginBottom: "14px", fontFamily: "var(--font-body)",
  });
  const skipEl = document.getElementById("sr-wa-popup-skip")!;
  Object.assign(skipEl.style, { fontSize: "12px", color: "var(--dim)", margin: "0" });
  const cancelBtn = document.getElementById("sr-wa-popup-cancel")!;
  Object.assign(cancelBtn.style, { background: "none", border: "none", color: "var(--dim)", cursor: "pointer", textDecoration: "underline", font: "inherit" });

  let count = 3;
  function openWA() {
    clearInterval(timer);
    popup.remove();
    window.open(waUrl, "_blank", "noopener");
  }
  function closePopup() {
    clearInterval(timer);
    popup.remove();
  }

  goBtn.addEventListener("click", openWA);
  cancelBtn.addEventListener("click", closePopup);
  popup.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Escape") closePopup(); });

  const timer = setInterval(() => {
    count--;
    countEl.textContent = String(count);
    if (count <= 0) openWA();
  }, 1000);
}

function init() {
  document.addEventListener("submit", e => {
    const form = e.target as HTMLElement;
    if (form instanceof HTMLFormElement && form.matches("[data-lead]")) {
      e.preventDefault();
      handleSubmit(form);
    }
  });
}

init();
// Astro ClientRouter: re-bind não é necessário (listener no document persiste), mas garante após swaps.
document.addEventListener("astro:after-swap", () => {});
