import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { FOOD_WAIVER_VERSION } from "@/lib/legal/food-waiver";
import { getDefaultPantry, householdForUser, signFoodWaiver } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  if (!(body.agreed === true || body.agreed === "true" || body.agreed === "on")) {
    return fail("Check the box if you agree. You can still get food — we need this record so stores can keep donating.");
  }
  const household = await householdForUser(pantry.id, user.id);
  try {
    await signFoodWaiver({
      pantryId: pantry.id,
      userId: user.id,
      householdId: household?.id || null,
      version: FOOD_WAIVER_VERSION,
      signedName: str(body.signedName) || user.name
    });
    return ok({
      message: "Thank you. Your agreement is on file. You can check in and receive food.",
      version: FOOD_WAIVER_VERSION
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the agreement.", 503);
  }
}
