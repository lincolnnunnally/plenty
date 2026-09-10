import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addPromo, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireStewardFor(pantry.id);
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const title = str(body.title);
  const text = str(body.body);
  if (!title || !text) return fail("A promo needs a title and the words you will actually post.");
  try {
    await addPromo({
      pantryId: pantry.id,
      channel: str(body.channel) || "social",
      title,
      body: text,
      createdBy: user.id
    });
    return ok({ message: "Saved. Copy it out to the channel — we do not auto-post yet." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the promo.", 503);
  }
}
