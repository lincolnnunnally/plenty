import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { addMembership, getDefaultPantry, removeMembership } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const PEOPLE_ROLES = new Set(["neighbor", "volunteer", "donor"]);
const DESK_ROLES = new Set(["steward", "admin"]);

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireStewardFor(pantry.id);
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const userId = str(body.userId);
  const role = str(body.role);
  const action = str(body.action) || "grant";
  if (!userId) return fail("Need a person id.");
  if (!PEOPLE_ROLES.has(role) && !DESK_ROLES.has(role)) {
    return fail("Role must be receiving food, volunteer, donor, or pantry admin.");
  }
  if (DESK_ROLES.has(role) && !isSuperAdminEmail(user.email)) {
    return fail("Only the super admin can grant or remove pantry desk access.", 403);
  }
  try {
    if (action === "revoke") {
      await removeMembership(pantry.id, userId, role);
      return ok({ message: role === "steward" || role === "admin" ? "Pantry desk access removed." : "Role removed." });
    }
    await addMembership(pantry.id, userId, role);
    return ok({ message: role === "steward" || role === "admin" ? "That person can now use the pantry desk." : "Role added." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the role.", 503);
  }
}
