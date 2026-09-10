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

export function withReach(notes: string, on: boolean) {
  const base = (notes || "").replace(/\[reach\]/gi, "").replace(/\s{2,}/g, " ").trim();
  return on ? `${base} [reach]`.trim() : base;
}
