import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_MS = 5 * 60 * 1000;

export type ResendEmailEvent = {
  type: string;
  emailId: string;
  to: string[];
};

export function verifyResendWebhook(input: {
  secret: string;
  payload: string;
  id: string;
  timestamp: string;
  signature: string;
  now?: number;
}): { ok: true } | { ok: false; reason: "unconfigured" | "timestamp" | "signature" } {
  const secret = input.secret.trim();
  if (!secret) return { ok: false, reason: "unconfigured" };
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "timestamp" };
  const now = input.now ?? Date.now();
  if (Math.abs(now - ts * 1000) > TOLERANCE_MS) return { ok: false, reason: "timestamp" };
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    return { ok: false, reason: "signature" };
  }
  if (!key.length) return { ok: false, reason: "signature" };
  const expected = createHmac("sha256", key).update(`${input.id}.${input.timestamp}.${input.payload}`).digest("base64");
  const match = input.signature.split(" ").some((part) => {
    if (!part.startsWith("v1,")) return false;
    const value = part.slice(3);
    const left = Buffer.from(value);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  });
  return match ? { ok: true } : { ok: false, reason: "signature" };
}

export function readResendEmailEvent(payload: string): ResendEmailEvent | null {
  try {
    const body = JSON.parse(payload) as { type?: unknown; data?: { email_id?: unknown; to?: unknown } };
    const type = String(body.type || "");
    const emailId = String(body.data?.email_id || "").trim();
    const to = Array.isArray(body.data?.to) ? body.data.to.map((item) => String(item).trim().toLowerCase()).filter(Boolean) : [];
    if (!type || !emailId) return null;
    return { type, emailId, to };
  } catch {
    return null;
  }
}

export function emailStatusFromEvent(type: string): "delivered" | "bounced" | "failed" | "delayed" | null {
  if (type === "email.delivered") return "delivered";
  if (type === "email.bounced") return "bounced";
  if (type === "email.failed") return "failed";
  if (type === "email.delivery_delayed") return "delayed";
  return null;
}

/** A later delivery can replace accepted or delayed. A bounce or failure replaces anything still open. */
export function shouldApplyEmailStatus(current: string, next: string) {
  if (next === "bounced" || next === "failed") return current !== "bounced" && current !== "failed";
  if (current === "delivered" || current === "bounced" || current === "failed") return false;
  if (next === "delivered") return true;
  if (next === "delayed") return current === "accepted";
  return false;
}
