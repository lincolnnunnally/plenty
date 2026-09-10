import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, updateAlly } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const KINDS = new Set(["pantry", "thrift", "church", "other"]);
const RELS = new Set(["to_meet", "visited", "running_own", "we_supply", "they_distribute", "share_volunteers", "paused"]);

function flag(value: unknown) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.some((v) => v === true || v === "on" || v === "true" || v === "1");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const kind = str(body.kind);
  if (kind && !KINDS.has(kind)) return fail("Choose pantry, thrift, church, or other.");
  const relationship = str(body.relationship);
  if (relationship && !RELS.has(relationship)) return fail("Choose how we relate to them.");
  const listedPublicly = body.listedPublicly != null ? flag(body.listedPublicly) : undefined;
  if (listedPublicly && !str(body.hoursText)) {
    return fail("Do not list a place publicly until you have confirmed hours in person.");
  }
  try {
    const row = await updateAlly(id, pantry.id, {
      kind: kind || undefined,
      name: str(body.name) || undefined,
      address: body.address != null ? str(body.address) : undefined,
      city: body.city != null ? str(body.city) : undefined,
      phone: body.phone != null ? str(body.phone) : undefined,
      contactName: body.contactName != null ? str(body.contactName) : undefined,
      hoursHint: body.hoursHint != null ? str(body.hoursHint) : undefined,
      hoursText: body.hoursText != null ? str(body.hoursText) : undefined,
      website: body.website != null ? str(body.website) : undefined,
      relationship: relationship || undefined,
      listedPublicly,
      wantsFood: body.wantsFood != null ? flag(body.wantsFood) : undefined,
      canHostDistribution: body.canHostDistribution != null ? flag(body.canHostDistribution) : undefined,
      canPickup: body.canPickup != null ? flag(body.canPickup) : undefined,
      wantsVolunteers: body.wantsVolunteers != null ? flag(body.wantsVolunteers) : undefined,
      hasFreezer: body.hasFreezer != null ? flag(body.hasFreezer) : undefined,
      hasSpace: body.hasSpace != null ? flag(body.hasSpace) : undefined,
      visitNotes: body.visitNotes != null ? str(body.visitNotes) : undefined,
      lastVisitedAt: flag(body.markVisited) ? new Date().toISOString() : undefined
    });
    if (!row) return fail("Place not found.", 404);
    return ok({ message: "Visit notes saved. We do not force a partnership." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that place.", 503);
  }
}
