import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addOpsNeed } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["freezer", "cooler", "warehouse", "shelves", "van", "pallets", "other"]);

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const kind = str(body.kind);
  if (!KINDS.has(kind)) return fail("Choose freezer, cooler, warehouse, shelves, van, pallets, or other.");
  const title = str(body.title);
  if (!title) return fail("Name what we need.");
  try {
    const need = await addOpsNeed({ pantryId: pantry.id, kind, title, details: str(body.details) });
    return ok({ needId: need.id, message: "Need posted. Neighbors will see it on Give." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not post the need.", 503);
  }
}
