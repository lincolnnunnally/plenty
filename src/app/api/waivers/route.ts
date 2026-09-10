import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { FOOD_WAIVER_VERSION } from "@/lib/legal/food-waiver";
import { VOLUNTEER_WAIVER_VERSION } from "@/lib/legal/volunteer-waiver";
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
    return fail("Check the box if you agree.");
  }
  const kind = str(body.kind) === "volunteer" ? "volunteer" : "food";
  const version = kind === "volunteer" ? VOLUNTEER_WAIVER_VERSION : FOOD_WAIVER_VERSION;
  const household = kind === "food" ? await householdForUser(pantry.id, user.id) : null;
  try {
    await signFoodWaiver({
      pantryId: pantry.id,
      userId: user.id,
      householdId: household?.id || null,
      version,
      signedName: str(body.signedName) || user.name
    });
    return ok({
      message: kind === "volunteer"
        ? "Thank you. Your volunteer agreement is on file."
        : "Thank you. Your agreement is on file. You can check in and receive food.",
      version
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the agreement.", 503);
  }
}
