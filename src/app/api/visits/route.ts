import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { FOOD_WAIVER_VERSION } from "@/lib/legal/food-waiver";
import { getDefaultPantry, householdForUser, latestWaiverForUser, listHouseholds, recordVisit } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.some((v) => v === true || v === "true" || v === "on" || v === "1");
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);

  let householdId = str(body.householdId);
  if (!householdId) {
    const mine = await householdForUser(pantry.id, user.id);
    householdId = mine?.id || "";
  }
  if (!householdId) return fail("Register your household first.");

  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;
  if (!asSteward) {
    const mine = await householdForUser(pantry.id, user.id);
    if (!mine || mine.id !== householdId) return fail("You can only check in your own household.", 403);
  }

  const households = asSteward ? await listHouseholds(pantry.id) : [];
  const target = asSteward
    ? households.find((h) => h.id === householdId) || null
    : await householdForUser(pantry.id, user.id);
  const ownerId = target?.user_id || user.id;
  const selfReport = on(body.selfReport);
  const signedOnHousehold = Boolean(target?.food_waiver_signed_at) && target?.food_waiver_version === FOOD_WAIVER_VERSION;
  const signedRecord = await latestWaiverForUser(pantry.id, ownerId);
  const signed = signedOnHousehold || Boolean(signedRecord);
  if (!signed && !asSteward && !selfReport) {
    return fail("Please sign the food responsibility agreement first. It protects the stores that donate so we can keep giving food.", 403);
  }

  const locationId = str(body.locationId);
  try {
    const visit = await recordVisit({
      pantryId: pantry.id,
      householdId,
      userId: user.id,
      itemsSummary: str(body.itemsSummary),
      notes: selfReport ? `Self: ${str(body.notes) || "Got food here"}` : str(body.notes),
      locationId: locationId === "hub" ? pantry.id : locationId || null
    });
    return ok({
      visitId: visit.id,
      message: selfReport ? "Saved. We count how often you go — not a limit." : "Checked in. Food is never held back."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not record the visit.", 503);
  }
}
