import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addDistribution, getDefaultPantry, setDistributionStatus } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  if (str(body.id) && str(body.status)) {
    try {
      const row = await setDistributionStatus(str(body.id), str(body.status));
      if (!row) return fail("Distribution not found.", 404);
      return ok({ message: "Distribution updated." });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Could not update.", 503);
    }
  }
  const title = str(body.title);
  const startsAt = str(body.startsAt);
  if (!title || !startsAt) return fail("A distribution day needs a name and a start time.");
  try {
    await addDistribution({
      pantryId: pantry.id,
      title,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: str(body.endsAt) ? new Date(str(body.endsAt)).toISOString() : null,
      notes: str(body.notes)
    });
    return ok({ message: "Distribution day posted." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the distribution day.", 503);
  }
}
