import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { saveCampaign } from "@/lib/db/queries";
import { kitFor } from "@/lib/promote/facts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
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
