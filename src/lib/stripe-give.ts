import { EIN } from "@/lib/legal/org";

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function form(params: Record<string, string | number | undefined>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.append(k, String(v));
  }
  return body.toString();
}

async function stripe(path: string, init?: RequestInit) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Card giving is not configured yet.");
  const res = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers || {})
    }
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error || {}) as { message?: string };
    throw new Error(err.message || `Stripe ${res.status}`);
  }
  return json;
}

export async function createPlentyCheckout(input: {
  amountCents: number;
  email?: string;
  name?: string;
  origin: string;
  householdId?: string;
}): Promise<{ id: string; url: string }> {
  const email = (input.email || "").trim();
  const session = await stripe("/checkout/sessions", {
    method: "POST",
    body: form({
      mode: "payment",
      success_url: `${input.origin}/donate/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/donate?cancelled=1`,
      customer_email: email && email.includes("@") ? email : undefined,
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": input.amountCents,
      "line_items[0][price_data][product_data][name]": "Gift to Plenty food pantry",
      "line_items[0][price_data][product_data][metadata][app]": "plenty",
      "line_items[0][price_data][product_data][metadata][kind]": "donation",
      "metadata[app]": "plenty",
      "metadata[kind]": "donation",
      "metadata[ein]": EIN,
      "metadata[donor_name]": (input.name || "").slice(0, 200),
      "metadata[household_id]": input.householdId || "",
      "payment_intent_data[metadata][app]": "plenty",
      "payment_intent_data[metadata][kind]": "donation"
    })
  });
  return { id: String(session.id), url: String(session.url) };
}

export async function readPlentySession(sessionId: string) {
  const s = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const details = (s.customer_details || {}) as { email?: string; name?: string };
  return {
    paid: s.payment_status === "paid" || s.payment_status === "no_payment_required",
    amountCents: Number(s.amount_total || 0),
    email: details.email || (s.customer_email as string) || null,
    name: details.name || "",
    paymentId: (s.payment_intent as string) || null
  };
}
