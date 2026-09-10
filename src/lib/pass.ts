import { randomBytes } from "crypto";
import { plentyOrigin } from "@/lib/public-url";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newHouseholdPass() {
  const bytes = randomBytes(5);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `HH-${out}`;
}

export function normalizePass(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function passPath(code: string) {
  return `/pass/${encodeURIComponent(normalizePass(code))}`;
}

export function passUrl(code: string) {
  return `${plentyOrigin()}${passPath(code)}`;
}
