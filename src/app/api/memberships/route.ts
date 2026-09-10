import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addMembership, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const ROLES = new Set(["neighbor", "volunteer", "donor", "steward"]);

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const userId = str(body.userId);
  const role = str(body.role);
  if (!userId) return fail("Need a person id.");
  if (!ROLES.has(role)) return fail("Role must be neighbor, volunteer, donor, or steward.");
  try {
    await addMembership(pantry.id, userId, role);
    return ok({ message: "Role added." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not add the role.", 503);
  }
}
