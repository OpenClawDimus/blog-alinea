/**
 * Lead capture — form-first → WhatsApp (padrão validado no mockup blog/v2.2.0).
 * Delegado: 1 listener para todos os <form data-lead> da página.
 * Dispara GA4 generate_lead + Meta Pixel Lead (eventID = lead_ref), POST /tracker
 * (sendBeacon → D1 + Meta CAPI + forward Supabase blueprint), depois abre o WhatsApp com [ID:ref].
 */
const WA_NUMBER = "5567991992882"; // receptor de leads (padrão tracking Dimus)

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
  const wa = String(data.get("whatsapp") ?? "").replace(/\D/g, "");
  if (nome.length < 2) {
    (form.querySelector('[name="nome"]') as HTMLInputElement)?.focus();
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

  // GA4 (recommended event)
  (
    (window as unknown as { dataLayer: unknown[] }).dataLayer =
      (window as unknown as { dataLayer?: unknown[] }).dataLayer || []
  ).push({
    event: "generate_lead",
    lead_source: "blog",
    lead_origin: origin, // origem canônica legível (ex.: blog-calc-estoque)
    method: "form-first-whatsapp",
    post_slug: form.dataset.postSlug || "",
    cluster: form.dataset.cluster || "",
    magnet_slug: magnet,
    lead_ref: ref,
  });

  // Meta Pixel (mesmo eventID para dedupe com CAPI server-side)
  // content_name = origem canônica (idêntica ao CAPI → sem divergência de relatório)
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (fbq) fbq("track", "Lead", { content_name: origin }, { eventID: ref });
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
      whatsapp: wa,
      post_slug: form.dataset.postSlug || "",
      cluster: form.dataset.cluster || "",
      magnet_slug: magnet || "",
      page_url: location.href,
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
  window.open(
    "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg),
    "_blank",
    "noopener"
  );
  form.reset();
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
