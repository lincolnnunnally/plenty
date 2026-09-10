import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addDistribution, getDefaultPantry, listVolunteers, setDistributionStatus } from "@/lib/db/queries";
import { notifyCrew } from "@/lib/notify";

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
    const startIso = new Date(startsAt).toISOString();
    const notes = str(body.notes);
    await addDistribution({
      pantryId: pantry.id,
      title,
      startsAt: startIso,
      endsAt: str(body.endsAt) ? new Date(str(body.endsAt)).toISOString() : null,
      notes
    });
    const crew = await listVolunteers(pantry.id);
    const ping = await notifyCrew({
      pantryId: pantry.id,
      crew,
      roles: ["serve", "setup"],
      subject: `Plenty distribution: ${title}`,
      text: `${title}\nWhere: ${pantry.address || pantry.city}\nWhen: ${new Date(startIso).toLocaleString()}\n${notes}\nhttps://plenty.unitedundergod.org/volunteer`
    });
    return ok({
      message: `Distribution day posted. Emailed ${ping.emailed}, texted ${ping.texted}${ping.failed ? `. ${ping.failed} could not be reached.` : "."}`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the distribution day.", 503);
  }
}
