import { fail, ok, readJson, requireStewardFor } from "@/lib/api";
import { getDefaultPantry, updateInventory } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const quantity = body.quantity == null || body.quantity === "" ? undefined : Number(body.quantity);
  const available =
    body.availableThisWeek == null
      ? undefined
      : body.availableThisWeek === "on" || body.availableThisWeek === true || body.availableThisWeek === "true";
  const weNeed =
    body.weNeed == null ? undefined : body.weNeed === "on" || body.weNeed === true || body.weNeed === "true";
  try {
    const imageUrl = body.imageUrl == null ? undefined : String(body.imageUrl);
    const item = await updateInventory(id, { quantity, availableThisWeek: available, weNeed, imageUrl });
    if (!item) return fail("Item not found.", 404);
    return ok({ message: "Updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the item.", 503);
  }
}
