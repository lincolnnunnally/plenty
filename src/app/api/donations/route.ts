import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { addDonation, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["food", "money", "space", "vehicle"]);

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const kind = str(body.kind);
  if (!KINDS.has(kind)) return fail("Choose food, money, space, or a vehicle.");
  const title = str(body.title);
  if (!title) return fail("Name what you are offering.");
  const dollars = str(body.amountDollars);
  const amountCents = kind === "money" && dollars ? Math.round(Number(dollars) * 100) : null;
  if (kind === "money" && amountCents != null && (!Number.isFinite(amountCents) || amountCents <= 0)) {
    return fail("Enter a gift amount we can receive later — we do not charge cards in this app yet.");
  }
  try {
    const donation = await addDonation({
      pantryId: pantry.id,
      userId: user.id,
      kind,
      title,
      description: str(body.description),
      quantity: str(body.quantity),
      amountCents,
      availableWhen: str(body.availableWhen),
      contactName: str(body.contactName) || user.name,
      contactPhone: str(body.contactPhone),
      contactEmail: str(body.contactEmail) || user.email
    });
    const message =
      kind === "money"
        ? "Gift recorded. We will contact you to receive it — we do not take card payments in this app yet."
        : "Offer received. A steward will follow up to schedule pickup or drop-off.";
    return ok({ donationId: donation.id, message });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the offer.", 503);
  }
}
