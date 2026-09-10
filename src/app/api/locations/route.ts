import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addLocation } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const name = str(body.name);
  if (!name) return fail("Name the location.");
  try {
    await addLocation({
      pantryId: pantry.id,
      name,
      address: str(body.address),
      hoursText: str(body.hoursText),
      notes: str(body.notes)
    });
    return ok({ message: "Location saved." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the location.", 503);
  }
}
