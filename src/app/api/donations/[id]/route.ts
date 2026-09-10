import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, setDonationStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["offered", "scheduled", "received", "declined"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const status = str(body.status);
  if (!STATUSES.has(status)) return fail("Choose offered, scheduled, received, or declined.");
  try {
    const row = await setDonationStatus(id, status, str(body.stewardNotes));
    if (!row) return fail("Offer not found.", 404);
    return ok({ message: "Offer updated." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the offer.", 503);
  }
}
