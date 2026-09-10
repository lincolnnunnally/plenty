import { createHash, randomBytes, timingSafeEqual } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PIN_PREFIX = "plenty-store-pin:v1:";

export function newCardCode() {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `PL-${out}`;
}

export function normalizeCardCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashStaffPin(pin: string) {
  return createHash("sha256").update(`${PIN_PREFIX}${pin.trim()}`).digest("hex");
}

export function staffPinMatches(pin: string, hash: string) {
  if (!hash) return false;
  const a = Buffer.from(hashStaffPin(pin));
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function validStaffPin(pin: string) {
  return /^\d{4,8}$/.test(pin.trim());
}
