import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { addDonation, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["food", "money", "space", "vehicle", "equipment"]);
const TENURES = new Set(["donated", "loaned", "leased", "rented", "owned"]);
const SPACE_KINDS = new Set(["warehouse", "distribution_site"]);
const EQUIP_KINDS = new Set(["freezer", "cooler", "shelves", "pallets", "other"]);

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const kind = str(body.kind);
  if (!KINDS.has(kind)) return fail("Choose food, money, space, a vehicle, or equipment.");
  const title = str(body.title);
  if (!title) return fail("Name what you are offering.");
  const dollars = str(body.amountDollars);
  const amountCents = kind === "money" && dollars ? Math.round(Number(dollars) * 100) : null;
  if (kind === "money" && amountCents != null && (!Number.isFinite(amountCents) || amountCents <= 0)) {
    return fail("Enter a gift amount we can receive later — we do not charge cards in this app yet.");
  }
  const tenure = str(body.tenure);
  if ((kind === "space" || kind === "vehicle" || kind === "equipment") && tenure && !TENURES.has(tenure)) {
    return fail("Say whether this is donated, loaned, leased, rented, or owned by the pantry.");
  }
  const assetKind = str(body.assetKind);
  if (kind === "space" && assetKind && !SPACE_KINDS.has(assetKind)) {
    return fail("Is this a warehouse or a place to distribute food?");
  }
  if (kind === "equipment" && assetKind && !EQUIP_KINDS.has(assetKind)) {
    return fail("Is this a freezer, cooler, shelves, pallets, or other equipment?");
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
      contactEmail: str(body.contactEmail) || user.email,
      tenure: kind === "space" || kind === "vehicle" || kind === "equipment" ? tenure || "donated" : "",
      assetKind: kind === "space" ? assetKind || "distribution_site" : kind === "vehicle" ? "vehicle" : kind === "equipment" ? assetKind || "other" : ""
    });
    const message =
      kind === "money"
        ? "Gift recorded. We will contact you to receive it — we do not take card payments in this app yet."
        : "Offer received. A pantry admin will follow up to schedule pickup or drop-off.";
    return ok({ donationId: donation.id, message });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the offer.", 503);
  }
}
