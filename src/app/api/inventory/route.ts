import { fail, ok, readJson, requireDeskPantry, str } from "@/lib/api";
import { addInventory } from "@/lib/db/queries";
import { withUseBy } from "@/lib/use-by";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
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
      notes: withUseBy(str(body.notes), str(body.useBy)),
      imageUrl: str(body.imageUrl)
    });
    return ok({ itemId: item.id, message: "Shelf updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the item.", 503);
  }
}
