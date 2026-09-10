import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { setSetting } from "@/lib/db/queries";
import { clearStripeKeyCache, probeStripeKey } from "@/lib/stripe-give";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  if (!isSuperAdminEmail(user.email)) return fail("Only the super admin can save the card key.", 403);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const secret = str(body.secret);
  if (!secret) {
    await setSetting("stripe_secret_key", "");
    clearStripeKeyCache();
    return ok({ message: "Saved key cleared. Card charging will use the host key if one is set." });
  }
  if (!secret.startsWith("sk_live_") && !secret.startsWith("rk_live_") && !secret.startsWith("sk_test_") && !secret.startsWith("rk_test_")) {
    return fail("That does not look like a Stripe secret. It should start with sk_live_ or rk_live_.");
  }
  try {
    await probeStripeKey(secret);
    await setSetting("stripe_secret_key", secret);
    clearStripeKeyCache();
    return ok({ message: "Card charging is live. Neighbors can give by card on Give and at the line." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe rejected that key.";
    return fail(msg.includes("Expired") ? "That Stripe key is expired. Create a new secret in Stripe and paste it here." : msg, 400);
  }
}
