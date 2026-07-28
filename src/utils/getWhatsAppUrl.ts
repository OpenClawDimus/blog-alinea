import type { ResolvedAstroPaperConfig } from "@/types/config";

export function getWhatsAppUrl(config: ResolvedAstroPaperConfig): string {
  const num = config.site.whatsappNumber;
  if (!num) return "#";
  const msg = encodeURIComponent(config.site.whatsappMessage ?? "");
  return `https://wa.me/${num}${msg ? `?text=${msg}` : ""}`;
}
