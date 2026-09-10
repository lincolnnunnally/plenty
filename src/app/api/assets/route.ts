import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addAsset, setAssetStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["vehicle", "warehouse", "distribution_site", "equipment"]);
const TENURES = new Set(["donated", "loaned", "leased", "rented", "owned"]);

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  if (str(body.id) && str(body.status)) {
    try {
      await setAssetStatus(str(body.id), str(body.status));
      return ok({ message: "Asset updated." });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not update the asset.", 503);
    }
  }
  const kind = str(body.kind);
  const tenure = str(body.tenure) || "donated";
  const title = str(body.title);
  if (!KINDS.has(kind)) return fail("Choose vehicle, warehouse, distribution site, or equipment.");
  if (!TENURES.has(tenure)) return fail("Say whether this is donated, loaned, leased, rented, or owned.");
  if (!title) return fail("Name the vehicle, building, or space.");
  try {
    await addAsset({
      pantryId: pantry.id,
      kind,
      title,
      description: str(body.description),
      tenure,
      donorUserId: str(body.donorUserId) || user.id,
      donorName: str(body.donorName) || user.name,
      notes: str(body.notes)
    });
    return ok({ message: "Recorded. This stays on the pantry's books, not in one person's pocket." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the asset.", 503);
  }
}
