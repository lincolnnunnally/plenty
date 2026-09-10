import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addInventory, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const name = str(body.name);
  if (!name) return fail("Name the item.");
  try {
    const item = await addInventory({
      pantryId: pantry.id,
      name,
      category: str(body.category) || "staple",
      quantity: Math.max(0, Number(body.quantity) || 0),
      unit: str(body.unit) || "item",
      availableThisWeek: body.availableThisWeek === "on" || body.availableThisWeek === true || body.availableThisWeek === "true",
      weNeed: body.weNeed === "on" || body.weNeed === true || body.weNeed === "true",
      lowAt: body.lowAt === "" || body.lowAt == null ? null : Number(body.lowAt),
      notes: str(body.notes)
    });
    return ok({ itemId: item.id, message: "Shelf updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the item.", 503);
  }
}
