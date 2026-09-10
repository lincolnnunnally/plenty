import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, setStoreVoucherStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["void", "redeemed", "issued"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const status = str(body.status);
  if (!STATUSES.has(status)) return fail("Choose void, redeemed, or issued.");
  try {
    const row = await setStoreVoucherStatus(id, pantry.id, status, str(body.note));
    if (!row) return fail("Card not found.", 404);
    return ok({ message: status === "void" ? "Card voided." : status === "redeemed" ? "Marked collected." : "Card restored." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the card.", 503);
  }
}
