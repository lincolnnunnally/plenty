import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addShift, getDefaultPantry, isVolunteerRole } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireStewardFor(pantry.id);
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const title = str(body.title);
  const startsAt = str(body.startsAt);
  if (!title || !startsAt) return fail("A shift needs a name and a start time.");
  const role = str(body.role) || "serve";
  if (!isVolunteerRole(role)) return fail("Role must be pickup, setup, serve, delivery, or meet families at a store.");
  const endsAt = str(body.endsAt) || null;
  const capacityRaw = str(body.capacity);
  try {
    await addShift({
      pantryId: pantry.id,
      title,
      role,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      location: str(body.location) || pantry.address || pantry.city,
      capacity: capacityRaw ? Number(capacityRaw) : null,
      notes: str(body.notes),
      createdBy: user.id
    });
    return ok({ message: "Shift posted." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not post the shift.", 503);
  }
}
