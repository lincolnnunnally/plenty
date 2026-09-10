import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { setOpsNeedStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "pledged", "filled"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const status = str(body.status);
  if (!STATUSES.has(status)) return fail("Choose open, pledged, or filled.");
  try {
    const row = await setOpsNeedStatus(id, pantry.id, status);
    if (!row) return fail("Need not found.", 404);
    return ok({ message: status === "filled" ? "Marked filled." : "Need updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the need.", 503);
  }
}
