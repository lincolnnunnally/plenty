import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { addPath, getDefaultPantry, householdForUser } from "@/lib/db/queries";
import { suggestHandoffs } from "@/lib/handoffs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const whatsHard = str(body.whatsHard);
  const who = str(body.whoTheyWantToBecome);
  const nextStep = str(body.nextStep);
  if (!whatsHard && !who) {
    return fail("Tell us what is hard, or who you want to become. Food is never required to answer this — this path is extra.");
  }
  const combined = `${whatsHard} ${who} ${nextStep}`;
  const suggested = suggestHandoffs(combined);
  const handoff = str(body.handoffApp) || suggested[0]?.id || "";
  const household = await householdForUser(pantry.id, user.id);
  try {
    const path = await addPath({
      pantryId: pantry.id,
      householdId: household?.id ?? null,
      userId: user.id,
      whatsHard,
      whoTheyWantToBecome: who,
      nextStep: nextStep || "Take one faithful next step this week.",
      handoffApp: handoff
    });
    return ok({
      pathId: path.id,
      message: "Written down. The next step is yours — we will not turn this into a score.",
      handoffs: suggested
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the path.", 503);
  }
}
