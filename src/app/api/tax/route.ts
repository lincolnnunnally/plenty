import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { upsertTaxProfile } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  try {
    await upsertTaxProfile({
      pantry_id: pantry.id,
      legal_name: str(body.legalName),
      ein: str(body.ein),
      letter_url: str(body.letterUrl),
      letter_text: str(body.letterText),
      posted: body.posted === "on" || body.posted === true || body.posted === "true"
    });
    return ok({ message: "Tax info saved. It only shows to the public if you mark it posted." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save tax info.", 503);
  }
}
