import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { addPickup, getDefaultPantry, setPickupStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  if (str(body.id) && str(body.status)) {
    const steward = await requireStewardFor(pantry.id);
    if (steward.error) return steward.error;
    try {
      await setPickupStatus(str(body.id), str(body.status));
      return ok({ message: "Pickup updated." });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not update the pickup.", 503);
    }
  }
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const kind = str(body.kind);
  if (kind !== "donation_pickup" && kind !== "household_delivery") {
    return fail("Say whether this is a donation pickup or a delivery to a household.");
  }
  const address = str(body.address);
  if (!address) return fail("We need an address.");
  try {
    await addPickup({
      pantryId: pantry.id,
      kind,
      scheduledFor: str(body.scheduledFor) ? new Date(str(body.scheduledFor)).toISOString() : null,
      address,
      contactName: str(body.contactName) || user.name,
      contactPhone: str(body.contactPhone),
      notes: str(body.notes),
      createdBy: user.id
    });
    return ok({ message: "Request received. We will confirm a time." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the request.", 503);
  }
}
