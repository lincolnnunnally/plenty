import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, markReceiptSent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  try {
    await markReceiptSent(str(body.id));
    return ok({ message: "Marked as receipt sent." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the receipt.", 503);
  }
}
