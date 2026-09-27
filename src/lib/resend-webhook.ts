import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_MS = 5 * 60 * 1000;

export type ResendEmailEvent = {
  type: string;
  emailId: string;
  to: string[];
  reason: string;
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

function emailsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(emailsFrom);
  if (value && typeof value === "object" && "email" in value) return emailsFrom((value as { email?: unknown }).email);
  if (typeof value !== "string") return [];
  return value.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || [];
}

/** Bounce and failure text from a Resend webhook. Empty when the event has no reason. */
export function emailReasonFromEvent(data: { bounce?: unknown; reason?: unknown; message?: unknown } | null | undefined): string {
  const parts: string[] = [];
  const bounce = data?.bounce;
  if (bounce && typeof bounce === "object") {
    const row = bounce as { type?: unknown; subType?: unknown; message?: unknown };
    for (const bit of [row.type, row.subType, row.message]) {
      const text = String(bit ?? "").trim();
      if (text) parts.push(text);
    }
  } else if (typeof bounce === "string" && bounce.trim()) {
    parts.push(bounce.trim());
  }
  for (const bit of [data?.reason, data?.message]) {
    const text = String(bit ?? "").trim();
    if (text && !parts.includes(text)) parts.push(text);
  }
  return parts.join(" · ").slice(0, 400);
}

export function readResendEmailEvent(payload: string): ResendEmailEvent | null {
  try {
    const body = JSON.parse(payload) as {
      type?: unknown;
      data?: { email_id?: unknown; to?: unknown; cc?: unknown; email?: unknown; recipient?: unknown; bounce?: unknown; reason?: unknown; message?: unknown };
    };
    const type = String(body.type || "");
    const emailId = String(body.data?.email_id || "").trim();
    const to = [...new Set([
      ...emailsFrom(body.data?.to),
      ...emailsFrom(body.data?.cc),
      ...emailsFrom(body.data?.email),
      ...emailsFrom(body.data?.recipient)
    ])];
    if (!type || !emailId) return null;
    return { type, emailId, to, reason: emailReasonFromEvent(body.data) };
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

/** Only rows whose address is named in the event. A shared provider id must not update the other recipient. */
export function rowsForEmailEvent<T extends { to_email: string; status: string }>(rows: T[], next: string, recipients: string[]): T[] {
  const wanted = new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean));
  if (!wanted.size) return [];
  return rows.filter((row) => shouldApplyEmailStatus(row.status, next) && wanted.has(row.to_email.trim().toLowerCase()));
}

/** A later delivery can replace accepted or delayed. A bounce or failure replaces anything still open. */
export function shouldApplyEmailStatus(current: string, next: string) {
  if (next === "bounced" || next === "failed") return current !== "bounced" && current !== "failed";
  if (current === "delivered" || current === "bounced" || current === "failed") return false;
  if (next === "delivered") return true;
  if (next === "delayed") return current === "accepted";
  return false;
}
