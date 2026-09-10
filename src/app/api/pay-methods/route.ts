import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, upsertPayMethod } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["venmo", "cashapp", "zelle", "cash"]);

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const kind = str(body.kind);
  if (!KINDS.has(kind)) return fail("Choose Venmo, Cash App, Zelle, or cash.");
  const handle = str(body.handle);
  const posted = body.posted === true || body.posted === "on" || body.posted === "1" || (Array.isArray(body.posted) && body.posted.includes("1"));
  if (posted && !handle && kind !== "cash") return fail("Do not post a payment method until the handle is real.");
  try {
    await upsertPayMethod({ pantryId: pantry.id, kind, handle, posted: Boolean(posted && (handle || kind === "cash")) });
    return ok({ message: posted ? "Neighbors can see this way to give." : "Saved. Not public yet." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save that payment method.", 503);
  }
}
