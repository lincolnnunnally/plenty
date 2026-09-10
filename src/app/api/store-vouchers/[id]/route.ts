import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { setStoreVoucherStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["void", "redeemed", "issued"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
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
