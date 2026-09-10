import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, recordStockMove } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireStewardFor(pantry.id);
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const direction = str(body.direction);
  if (direction !== "in" && direction !== "out") return fail("Say whether food came in or went out.");
  try {
    await recordStockMove({
      pantryId: pantry.id,
      inventoryId: str(body.inventoryId) || null,
      direction,
      quantity: Number(body.quantity) || 1,
      itemName: str(body.itemName),
      note: str(body.note),
      createdBy: user.id
    });
    return ok({ message: direction === "in" ? "Recorded as received." : "Recorded as given out." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not record that.", 503);
  }
}
