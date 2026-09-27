import { NextResponse } from "next/server";
import { updatePickupEmailsByProvider } from "@/lib/db/pickup-desk";
import { emailStatusFromEvent, readResendEmailEvent, verifyResendWebhook } from "@/lib/resend-webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = (process.env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    return NextResponse.json({ ok: false, message: "Webhook secret is not configured." }, { status: 503 });
  }
  const payload = await request.text();
  const verified = verifyResendWebhook({
    secret,
    payload,
    id: request.headers.get("svix-id") || "",
    timestamp: request.headers.get("svix-timestamp") || "",
    signature: request.headers.get("svix-signature") || ""
  });
  if (!verified.ok) {
    return NextResponse.json({ ok: false, message: "Invalid webhook." }, { status: verified.reason === "unconfigured" ? 503 : 400 });
  }
  const event = readResendEmailEvent(payload);
  const status = event ? emailStatusFromEvent(event.type) : null;
  if (!event || !status) return NextResponse.json({ ok: true, updated: 0 });
  const updated = await updatePickupEmailsByProvider({
    providerId: event.emailId,
    status,
    recipients: event.to
  });
  return NextResponse.json({ ok: true, updated });
}
