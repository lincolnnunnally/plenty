import { fail, ok, readJson, requireUser, str } from "@/lib/api";
import { withCooler } from "@/lib/cooler";
import { getDefaultPantry, isVolunteerRole, setUserPhone, upsertVolunteer } from "@/lib/db/queries";

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
      notes: withCooler(str(body.notes), body.hasCooler === "on" || body.hasCooler === true || body.hasCooler === "true")
    });
    const phone = str(body.phone);
    if (phone) await setUserPhone(user.id, phone);
    return ok({
      message: phone
        ? "You are on the volunteer list. We will email and text you when a shift is posted."
        : "You are on the volunteer list. Add a phone number if you want a text. We will still email you."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save your volunteer profile.", 503);
  }
}
