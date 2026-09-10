export function hasCooler(notes: string | null | undefined) {
  return /\[cooler\]/i.test(notes || "");
}

export function withCooler(notes: string, on: boolean) {
  const base = (notes || "").replace(/\[cooler\]/gi, "").replace(/\s{2,}/g, " ").trim();
  return on ? `${base} [cooler]`.trim() : base;
}
