import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addLocation, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
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
