import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { addVolunteerHours, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const hours = Number(str(body.hours));
  if (!Number.isFinite(hours) || hours <= 0) return fail("Enter the hours you served.");
  const workedOn = str(body.workedOn) || new Date().toISOString().slice(0, 10);
  let userId = user.id;
  const forUserId = str(body.userId);
  if (forUserId && forUserId !== user.id) {
    const steward = await requireStewardFor(pantry.id);
    if (steward.error) return steward.error;
    userId = forUserId;
  }
  try {
    await addVolunteerHours({
      pantryId: pantry.id,
      userId,
      shiftId: str(body.shiftId) || null,
      hours,
      workedOn,
      notes: str(body.notes)
    });
    return ok({ message: "Hours recorded. Thank you." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save hours.", 503);
  }
}
