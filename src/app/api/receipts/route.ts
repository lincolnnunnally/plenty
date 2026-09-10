import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { markReceiptSent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  try {
    await markReceiptSent(str(body.id));
    return ok({ message: "Marked as receipt sent." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the receipt.", 503);
  }
}
