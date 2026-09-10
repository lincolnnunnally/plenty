import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addAlly, getDefaultPantry } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["pantry", "thrift", "church", "farm", "compost", "other"]);
const RELS = new Set(["to_meet", "visited", "running_own", "we_supply", "they_distribute", "share_volunteers", "paused", "closed"]);

function flag(value: unknown) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.some((v) => v === true || v === "on" || v === "true" || v === "1");
}

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const name = str(body.name);
  if (!name) return fail("Name the place.");
  const kind = str(body.kind) || "pantry";
  if (!KINDS.has(kind)) return fail("Choose pantry, thrift, church, farm, compost, or other.");
  const relationship = str(body.relationship) || "to_meet";
  if (!RELS.has(relationship)) return fail("Choose how we relate to them.");
  const listedPublicly = flag(body.listedPublicly);
  if (listedPublicly && !str(body.hoursText) && kind === "pantry" && relationship !== "closed") {
    return fail("Do not list a pantry publicly until you have confirmed hours in person.");
  }
  try {
    const ally = await addAlly({
      pantryId: pantry.id,
      kind,
      name,
      address: str(body.address),
      city: str(body.city) || pantry.city,
      state: str(body.state) || pantry.state || "GA",
      zip: str(body.zip),
      phone: str(body.phone),
      contactName: str(body.contactName),
      contactEmail: str(body.contactEmail),
      hoursHint: str(body.hoursHint),
      hoursText: str(body.hoursText),
      website: str(body.website),
      relationship,
      listedPublicly,
      wantsFood: flag(body.wantsFood),
      canHostDistribution: flag(body.canHostDistribution),
      canPickup: flag(body.canPickup),
      wantsVolunteers: flag(body.wantsVolunteers),
      hasFreezer: flag(body.hasFreezer),
      hasSpace: flag(body.hasSpace),
      visitNotes: str(body.visitNotes),
      sourceNote: str(body.sourceNote)
    });
    return ok({ allyId: ally.id, message: listedPublicly ? "Listed for neighbors to see." : "Saved on the visit list. Not public yet." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save that place.", 503);
  }
}
