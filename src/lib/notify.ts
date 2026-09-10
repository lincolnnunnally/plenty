import { listPeople, recordPromoSend } from "@/lib/db/queries";
import { resendConfigured, resendFrom } from "@/lib/promote/email";

export function twilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

function digits(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (phone.trim().startsWith("+") && d.length >= 11) return `+${d}`;
  return "";
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_PHONE_NUMBER || "";
  if (!sid || !token || !from) return { ok: false, error: "Twilio is not configured." };
  const dest = digits(to);
  if (!dest) return { ok: false, error: "Phone number is not usable." };
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: dest, From: from, Body: body.slice(0, 1500) });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });
  const json = (await res.json().catch(() => ({}))) as { message?: string; code?: number; sid?: string };
  if (!res.ok) return { ok: false, error: json.message || `Twilio ${res.status}` };
  return { ok: true, error: "" };
}

export async function sendPlainEmail(to: string, subject: string, text: string): Promise<{ ok: boolean; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email sending is not configured." };
  const html = `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.5;white-space:pre-wrap">${text.replace(/</g, "<")}</p>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: resendFrom(), to: [to], subject, html, text })
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string; error?: { message?: string } };
    return { ok: false, error: payload.error?.message || payload.message || `Resend ${res.status}` };
  }
  return { ok: true, error: "" };
}

export type CrewMember = { email: string | null; phone: string | null; name: string | null; roles: string[] };

export async function notifyPeople(input: {
  pantryId: string;
  people: CrewMember[];
  subject: string;
  text: string;
  audience: string;
}): Promise<{ emailed: number; texted: number; failed: number; detail: string }> {
  let emailed = 0;
  let texted = 0;
  let failed = 0;
  const errors: string[] = [];
  const mailReady = resendConfigured();
  const smsReady = twilioConfigured();
  if (!mailReady && input.people.some((p) => p.email)) errors.push("Email sending is not configured on this host.");
  if (!smsReady && input.people.some((p) => p.phone)) errors.push("SMS is not configured on this host. Email still goes out.");
  for (const person of input.people) {
    let reached = false;
    if (person.email && mailReady) {
      const r = await sendPlainEmail(person.email, input.subject, input.text);
      if (r.ok) {
        emailed += 1;
        reached = true;
      } else {
        failed += 1;
        errors.push(`${person.email}: ${r.error}`);
      }
    }
    if (person.phone && smsReady) {
      const r = await sendSms(person.phone, `${input.subject}\n${input.text}`.slice(0, 1400));
      if (r.ok) {
        texted += 1;
        reached = true;
      } else {
        failed += 1;
        errors.push(`${person.phone}: ${r.error}`);
      }
    }
    if (!reached) failed += 1;
  }
  const status = emailed + texted > 0 ? (failed ? "partial" : "sent") : "failed";
  const detail = errors.slice(0, 8).join("; ");
  await recordPromoSend({
    pantryId: input.pantryId,
    channel: smsReady ? "crew" : "email",
    audience: input.audience,
    toCount: emailed + texted,
    status: !mailReady && !smsReady ? "failed" : status,
    error: !mailReady && !smsReady ? "Email and SMS are not configured on this host." : detail
  });
  return { emailed, texted, failed, detail };
}

export async function notifyCrew(input: {
  pantryId: string;
  crew: CrewMember[];
  roles: string[];
  subject: string;
  text: string;
}): Promise<{ emailed: number; texted: number; failed: number; detail: string }> {
  const wanted = input.crew.filter((c) => c.roles.some((r) => input.roles.includes(r)));
  return notifyPeople({
    pantryId: input.pantryId,
    people: wanted,
    subject: input.subject,
    text: input.text,
    audience: input.roles.join(",")
  });
}

/** Email pantry admins that a pickup or store request landed. */
export async function notifyDesk(input: {
  pantryId: string;
  pantryEmail?: string | null;
  pantryPhone?: string | null;
  subject: string;
  text: string;
}): Promise<{ emailed: number; texted: number; failed: number; detail: string }> {
  const people = await listPeople(input.pantryId).catch(() => []);
  const desk: CrewMember[] = people
    .filter((p) => p.roles.includes("steward") || p.roles.includes("admin"))
    .map((p) => ({ email: p.email, phone: null, name: p.name, roles: p.roles }));
  const extra = String(input.pantryEmail || "").trim().toLowerCase();
  if (extra && !desk.some((p) => (p.email || "").toLowerCase() === extra)) {
    desk.push({
      email: input.pantryEmail || null,
      phone: input.pantryPhone || null,
      name: "Pantry desk",
      roles: ["steward"]
    });
  }
  if (!desk.length) return { emailed: 0, texted: 0, failed: 0, detail: "No desk contacts yet." };
  return notifyPeople({
    pantryId: input.pantryId,
    people: desk,
    subject: input.subject,
    text: input.text,
    audience: "desk"
  });
}
