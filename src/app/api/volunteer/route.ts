import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { getDefaultPantry, isVolunteerRole, upsertVolunteer } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const rolesRaw = body.roles;
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.map(String)
    : str(rolesRaw)
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
  const cleaned = [...new Set(roles.filter(isVolunteerRole))];
  if (cleaned.length === 0) return fail("Pick at least one role: pickup, setup, serve, delivery, or meet families at a store.");
  try {
    await upsertVolunteer({
      pantryId: pantry.id,
      userId: user.id,
      roles: cleaned,
      hasVehicle: body.hasVehicle === "on" || body.hasVehicle === true || body.hasVehicle === "true",
      notes: str(body.notes)
    });
    return ok({ message: "You are on the volunteer list. Pick a shift when one is posted." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save your volunteer profile.", 503);
  }
}
