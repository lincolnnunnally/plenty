import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { getDefaultPantry, householdForUser, recordVisit } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

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
  if (!householdId) return fail("Register your household first — food is never gated on a growth form, but we do need a household so we can welcome you.");

  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;
  if (!asSteward) {
    const mine = await householdForUser(pantry.id, user.id);
    if (!mine || mine.id !== householdId) return fail("You can only check in your own household.", 403);
  }

  try {
    const visit = await recordVisit({
      pantryId: pantry.id,
      householdId,
      userId: user.id,
      itemsSummary: str(body.itemsSummary),
      notes: str(body.notes),
      locationId: str(body.locationId) || null
    });
    return ok({ visitId: visit.id, message: "Checked in. If you want a next step beyond groceries, open A path — it is optional." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not record the visit.", 503);
  }
}
