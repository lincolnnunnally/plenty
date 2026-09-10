import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { getDefaultPantry, upsertHousehold } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const displayName = str(body.displayName) || user.name;
  const size = Math.max(1, Number(body.householdSize) || 1);
  try {
    const household = await upsertHousehold({
      pantryId: pantry.id,
      userId: user.id,
      displayName,
      householdSize: size,
      dietaryNotes: str(body.dietaryNotes),
      phone: str(body.phone),
      preferredContact: str(body.preferredContact) || "in_person"
    });
    return ok({ householdId: household.id, message: "Your household is on the list. Come when we are open." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the household.", 503);
  }
}
