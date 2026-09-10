export function poundsFrom(input: { quantity?: number | string | null; unit?: string | null; note?: string | null }) {
  const tagged = String(input.note || "").match(/lb:(\d+(?:\.\d+)?)/i);
  if (tagged) return Number(tagged[1]) || 0;
  const unit = String(input.unit || "").toLowerCase();
  if (unit === "lb" || unit === "lbs" || unit === "pound" || unit === "pounds") {
    return Math.max(0, Number(input.quantity) || 0);
  }
  const qty = String(input.quantity || "");
  const inline = qty.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|pound)/i);
  if (inline) return Number(inline[1]) || 0;
  return 0;
}

export function withPoundsNote(note: string, pounds: number) {
  const base = (note || "").replace(/lb:\d+(?:\.\d+)?/gi, "").trim();
  if (!(pounds > 0)) return base;
  return `${base}${base ? " " : ""}lb:${pounds}`.trim();
}
