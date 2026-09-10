import { recordPromoSend } from "@/lib/db/queries";

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function resendFrom() {
  return process.env.RESEND_FROM || "Plenty food pantry <no-reply@emails.unitedundergod.org>";
}

export async function sendCampaignEmail(input: {
  pantryId: string;
  audience: string;
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  attachment?: { filename: string; content: Uint8Array; contentType: string };
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await recordPromoSend({
      pantryId: input.pantryId,
      channel: "email",
      audience: input.audience,
      toCount: 0,
      status: "failed",
      error: "RESEND_API_KEY is not set. Email is not sent."
    });
    throw new Error("Email sending is not configured yet. You can still copy the message or use mailto.");
  }
  if (!input.to.length) {
    throw new Error("No email addresses to send to.");
  }

  const attachments = input.attachment
    ? [
        {
          filename: input.attachment.filename,
          content: Buffer.from(input.attachment.content).toString("base64"),
          contentType: input.attachment.contentType
        }
      ]
    : undefined;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: input.to.map((row) => row.email),
      subject: input.subject,
      html: input.html,
      attachments
    })
  });
  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: { message?: string } };
  if (!response.ok) {
    const message = payload.error?.message || payload.message || `Resend returned ${response.status}`;
    await recordPromoSend({
      pantryId: input.pantryId,
      channel: "email",
      audience: input.audience,
      toCount: input.to.length,
      status: "failed",
      error: message
    });
    throw new Error(message);
  }
  await recordPromoSend({
    pantryId: input.pantryId,
    channel: "email",
    audience: input.audience,
    toCount: input.to.length,
    status: "sent"
  });
  return { id: payload.id, count: input.to.length };
}
