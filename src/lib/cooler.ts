export function hasCooler(notes: string | null | undefined) {
  return /\[cooler\]/i.test(notes || "");
}

export function withCooler(notes: string, on: boolean) {
  const base = (notes || "").replace(/\[cooler\]/gi, "").replace(/\s{2,}/g, " ").trim();
  return on ? `${base} [cooler]`.trim() : base;
}

export function hasReach(notes: string | null | undefined) {
  return /\[reach\]/i.test(notes || "");
}

export function mayText(notes: string | null | undefined) {
  if (/\[noreach\]/i.test(notes || "")) return false;
  return true;
}

export function withReach(notes: string, on: boolean) {
  const base = (notes || "").replace(/\[reach\]/gi, "").replace(/\[noreach\]/gi, "").replace(/\s{2,}/g, " ").trim();
  return on ? `${base} [reach]`.trim() : `${base} [noreach]`.trim();
}
