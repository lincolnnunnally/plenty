import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { recordStockMove } from "@/lib/db/queries";
import { withPoundsNote } from "@/lib/pounds";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
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
      note: withPoundsNote(str(body.note), Number(body.pounds) || 0),
      createdBy: user.id
    });
    return ok({ message: direction === "in" ? "Recorded as received." : "Recorded as given out." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not record that.", 503);
  }
}
