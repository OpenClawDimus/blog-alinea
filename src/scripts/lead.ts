/**
 * Lead capture — form-first → WhatsApp (padrão validado no mockup blog/v2.2.0).
 * Delegado: 1 listener para todos os <form data-lead> da página.
 * Dispara GA4 generate_lead + Meta Pixel Lead (eventID = lead_ref), depois abre o WhatsApp com [ID:ref].
 * Produção (Sprint 2): navigator.sendBeacon('/tracker', …) para D1 + Meta CAPI + forward Supabase.
 */
const WA_NUMBER = "5567991992882"; // receptor de leads (padrão tracking Dimus)

const fmtBR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");

type CalcState = { valor: number; dias: number; dia: number; acc: number };

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

  const idTag = form.dataset.idtag || "BLOG-LEAD";
  const ref = idTag + "-" + String(Date.now()).slice(-5); // lead_ref / event_id

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
    method: "form-first-whatsapp",
    post_slug: form.dataset.postSlug || "",
    cluster: form.dataset.cluster || "",
    magnet_slug: magnet,
    lead_ref: ref,
  });

  // Meta Pixel (mesmo eventID para dedupe com CAPI no Sprint 2)
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (fbq) fbq("track", "Lead", { content_name: "blog_lead" }, { eventID: ref });
  } catch {
    /* noop */
  }

  const extra = calc
    ? ` Meu carro de ${fmtBR(calc.valor)} parado há ${calc.dias} dias já custou ${fmtBR(calc.acc)} (${fmtBR(calc.dia)}/dia).`
    : "";
  const msg = `Olá! Sou ${nome}. Quero o diagnóstico de giro do meu estoque.${extra} [ID:${ref}]`;
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
