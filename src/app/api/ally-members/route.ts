import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { grantAllyOperator } from "@/lib/db/food-loads";
import { getDefaultPantry, listAllies } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const allyId = str(body.allyId);
  const userId = str(body.userId);
  if (!allyId || !userId) return fail("Choose the pantry and the person.");
  const allies = await listAllies(pantry.id);
  if (!allies.some((a) => a.id === allyId)) return fail("That place is not on the visit list.");
  try {
    await grantAllyOperator(allyId, userId);
    return ok({ message: "They can now manage pickups for that pantry. Hand-off is in their Serve desk." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not grant that operator.", 503);
  }
}
