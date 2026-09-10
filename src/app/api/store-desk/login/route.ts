import { fail, ok, readJson, str } from "@/lib/api";
import { getDefaultPantry, listStorePartners, partnerWithPin } from "@/lib/db/queries";
import { staffPinMatches } from "@/lib/store-card/code";
import { setStoreDeskCookie } from "@/lib/store-card/store-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const partnerId = str(body.partnerId);
  const pin = str(body.pin);
  if (!partnerId || !pin) return fail("Choose your store and enter the PIN Plenty gave you.");
  const partners = await listStorePartners(pantry.id);
  const listed = partners.find((p) => p.id === partnerId);
  if (!listed || listed.status === "paused") return fail("That store is not active with Plenty.");
  const row = await partnerWithPin(partnerId);
  if (!row?.pin_hash) return fail("This store does not have a PIN yet. Call Plenty.");
  if (!staffPinMatches(pin, row.pin_hash)) return fail("That PIN did not match.");
  await setStoreDeskCookie(partnerId);
  return ok({ message: "Store desk open. You can change your option any time.", partnerId });
}
