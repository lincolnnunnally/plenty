import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { alliesForOperator, updateFoodLoad } from "@/lib/db/food-loads";
import { getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["offered", "scheduled", "picked", "received", "distributed", "composted", "cancelled"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;
  const operated = asSteward ? [] : await alliesForOperator(pantry.id, user.id);
  if (!asSteward && !operated.length) return fail("Only a pantry admin or an allied pantry operator can do that.", 403);
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const status = str(body.status);
  if (status && !STATUSES.has(status)) return fail("Choose a real load status.");
  const destAllyId = str(body.destAllyId);
  if (destAllyId && operated.length && !operated.some((a) => a.id === destAllyId) && !asSteward) {
    return fail("You can only claim food for your pantry.");
  }
  try {
    const row = await updateFoodLoad(id, pantry.id, {
      status: status || undefined,
      destAllyId: destAllyId || (body.destAllyId === "" ? null : undefined),
      destNote: body.destNote != null ? str(body.destNote) : undefined,
      pickupAt: str(body.pickupAt) ? new Date(str(body.pickupAt)).toISOString() : undefined,
      notes: body.notes != null ? str(body.notes) : undefined
    });
    if (!row) return fail("Load not found.", 404);
    return ok({ message: "Load updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the load.", 503);
  }
}
