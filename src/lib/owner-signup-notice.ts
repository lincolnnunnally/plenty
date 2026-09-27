/**
 * Owner attention mail for a new pantry desk.
 * Recipient is the super admin. This app has no owner-notification env var
 * (PLENTY_SUPER_ADMIN_EMAILS only grants access). One address, defaulted.
 */
export const OWNER_ATTENTION_EMAIL = "lincoln@unitedundergod.org";

/** Live pantry desk. Owner mail points at production even from a preview host. */
export const OWNER_REVIEW_URL = "https://plenty.unitedundergod.org/run";

export type MailSender = (to: string, subject: string, text: string) => Promise<{ ok: boolean; error: string }>;

export type OwnerPantrySignupInput = {
  /** Ally kind. Pantry and church both open a Plenty desk. Volunteer, neighbor, donor, and store do not. */
  kind: string;
  pantryName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  signedUpAt: string;
};

export type OwnerPantrySignupNotice = {
  to: string;
  subject: string;
  text: string;
};

/** Church claims open the same pantry desk as a food pantry. Other roles do not. */
export function isOwnerPantrySignup(kind: string) {
  const normalized = kind.trim().toLowerCase();
  return normalized === "pantry" || normalized === "church";
}

function line(value: string) {
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  return clean || "not given";
}

function locationLine(address: string, city: string, state: string) {
  const parts = [address, city, state].map((part) => part.replace(/[\r\n]+/g, " ").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : "not given";
}

export function ownerNoticeFailureReason(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error || "");
  if (/not configured|RESEND_API_KEY/i.test(text) && !/@/.test(text)) return "email not configured";
  if (/@/.test(text) || /\d{7,}/.test(text) || /re_[A-Za-z0-9]{4,}/.test(text) || /Bearer\s+/i.test(text)) {
    return "mailer rejected";
  }
  const cleaned = text.replace(/re_[A-Za-z0-9]+/g, "[redacted]").replace(/\s+/g, " ").trim().slice(0, 140);
  return cleaned || "mailer failed";
}

export function composeOwnerPantrySignupNotice(input: OwnerPantrySignupInput): OwnerPantrySignupNotice | null {
  if (!isOwnerPantrySignup(input.kind)) return null;
  const name = line(input.pantryName) === "not given" ? "Unnamed pantry" : line(input.pantryName);
  const subject = `New food pantry signup needs your attention: ${name}`;
  const text = [
    `Pantry: ${name}`,
    `Contact: ${line(input.contactName)}`,
    `Email: ${line(input.email)}`,
    `Phone: ${line(input.phone)}`,
    `Location: ${locationLine(input.address, input.city, input.state)}`,
    `Signed up: ${line(input.signedUpAt)}`,
    `Review: ${OWNER_REVIEW_URL}`
  ].join("\n");
  return { to: OWNER_ATTENTION_EMAIL, subject, text };
}

export async function deliverOwnerPantrySignupNotice(
  input: OwnerPantrySignupInput,
  send: MailSender
): Promise<{ ok: boolean; skipped: boolean }> {
  const message = composeOwnerPantrySignupNotice(input);
  if (!message) return { ok: true, skipped: true };
  try {
    const result = await send(message.to, message.subject, message.text);
    if (!result.ok) {
      console.error("[plenty] owner pantry signup notice failed:", ownerNoticeFailureReason(result.error));
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    console.error("[plenty] owner pantry signup notice failed:", ownerNoticeFailureReason(err));
    return { ok: false, skipped: false };
  }
}

/** Signup response is returned even when the owner email throws or the key is missing. */
export async function withOwnerPantrySignupNotice<T>(
  input: OwnerPantrySignupInput,
  send: MailSender,
  succeed: () => T | Promise<T>
): Promise<T> {
  await deliverOwnerPantrySignupNotice(input, send);
  return succeed();
}
