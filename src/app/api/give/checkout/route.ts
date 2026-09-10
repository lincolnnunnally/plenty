import { fail, readJson, str } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantry, householdForUser } from "@/lib/db/queries";
import { plentyOrigin } from "@/lib/public-url";
import { createPlentyCheckout, stripeConfigured } from "@/lib/stripe-give";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return fail("Card giving is not live on this host yet. Use Cash App, Venmo, or Zelle if those are posted, or give in person.", 503);
  }
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const dollars = str(body.amountDollars);
  const cents = Math.round(Number(dollars) * 100);
  if (!Number.isFinite(cents) || cents < 100 || cents > 5_000_000) return fail("Enter an amount between $1 and $50,000.");
  const user = await getCurrentUser().catch(() => null);
  const household = user ? await householdForUser(pantry.id, user.id).catch(() => null) : null;
  try {
    const session = await createPlentyCheckout({
      amountCents: cents,
      email: str(body.email) || user?.email || "",
      name: user?.name || "",
      origin: plentyOrigin(),
      householdId: household?.id
    });
    if (!session.url) return fail("Stripe did not return a checkout page.", 503);
    return Response.json({ ok: true, url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not start card checkout.";
    if (/expired api key|invalid api key|no such api key/i.test(msg)) {
      return fail("Card charging is not live yet. Use Cash App, Venmo, or Zelle if those are posted, or give in person.", 503);
    }
    return fail(msg, 503);
  }
}
