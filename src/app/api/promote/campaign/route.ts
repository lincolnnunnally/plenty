import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, saveCampaign } from "@/lib/db/queries";
import { kitFor } from "@/lib/promote/facts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireStewardFor(pantry.id);
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const audience = str(body.audience) || "families";
  const extra = str(body.extra);
  try {
    const { kit } = await kitFor(pantry, audience, extra);
    await saveCampaign({
      pantryId: pantry.id,
      audience,
      extra,
      kit: kit as unknown as Record<string, unknown>,
      createdBy: user.id
    });
    return ok({ message: "Campaign saved. Every channel below was generated from this one entry." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the campaign.", 503);
  }
}
