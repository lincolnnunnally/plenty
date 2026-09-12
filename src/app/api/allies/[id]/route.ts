import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { alliesForOperator } from "@/lib/db/food-loads";
import { getAlly, getDefaultPantry, listHouseholds, updateAlly } from "@/lib/db/queries";
import { withDoorPhoto } from "@/lib/door-photo";
import { followsPlace, inviteCopy, wantsPlaceAlerts } from "@/lib/invite";
import { notifyNeighbors } from "@/lib/notify";

export const dynamic = "force-dynamic";

const KINDS = new Set(["pantry", "thrift", "church", "farm", "compost", "other"]);
const RELS = new Set(["to_meet", "visited", "running_own", "we_supply", "they_distribute", "share_volunteers", "paused", "closed"]);

function flag(value: unknown) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.some((v) => v === true || v === "on" || v === "true" || v === "1");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { id } = await context.params;
  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;
  if (!asSteward) {
    const { error, user } = await requireUser();
    if (error || !user) return error || fail("Sign in first.", 401);
    const operated = await alliesForOperator(pantry.id, user.id);
    if (!operated.some((a) => a.id === id)) return fail("Only a pantry admin or that pantry's operator can do that.", 403);
  }
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const kind = str(body.kind);
  if (kind && !KINDS.has(kind)) return fail("Choose pantry, thrift, church, farm, compost, or other.");
  const relationship = str(body.relationship);
  if (relationship && !RELS.has(relationship)) return fail("Choose how we relate to them.");
  const listedPublicly = body.listedPublicly != null ? flag(body.listedPublicly) : undefined;
  if (listedPublicly && !str(body.hoursText) && relationship !== "closed" && str(body.relationship) !== "closed") {
    return fail("Do not list a place publicly until you have confirmed hours in person.");
  }
  const visitNotes = body.visitNotes != null || body.doorPhoto != null
    ? withDoorPhoto(str(body.visitNotes), str(body.doorPhoto))
    : undefined;
  const prior = await getAlly(id, pantry.id).catch(() => null);
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
      acceptsDry: body.acceptsDry != null ? flag(body.acceptsDry) : undefined,
      acceptsRefrigerated: body.acceptsRefrigerated != null ? flag(body.acceptsRefrigerated) : undefined,
      acceptsFrozen: body.acceptsFrozen != null ? flag(body.acceptsFrozen) : undefined,
      acceptsProduce: body.acceptsProduce != null ? flag(body.acceptsProduce) : undefined,
      takesOverflow: body.takesOverflow != null ? flag(body.takesOverflow) : undefined,
      nextDistributionAt: body.nextDistributionAt != null ? (str(body.nextDistributionAt) ? new Date(str(body.nextDistributionAt)).toISOString() : null) : undefined,
      visitNotes,
      lastVisitedAt: flag(body.markVisited) ? new Date().toISOString() : undefined
    });
    if (!row) return fail("Place not found.", 404);
    const wasPublic = Boolean(prior?.listed_publicly);
    const hoursChanged = Boolean(row.hours_text) && row.hours_text !== (prior?.hours_text || "");
    const justListed = Boolean(row.listed_publicly) && !wasPublic && row.relationship !== "closed";
    if (row.listed_publicly && row.relationship !== "closed" && (hoursChanged || justListed)) {
      const copy = inviteCopy({
        name: row.name,
        hours: row.hours_text,
        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
        kind: justListed ? "new_place" : "hours"
      });
      const households = await listHouseholds(pantry.id).catch(() => []);
      const people = households.filter((h) => {
        if (!h.reach_ok || (!h.phone && !h.email)) return false;
        return followsPlace(h, row.id) || (justListed && wantsPlaceAlerts(h.notes));
      }).slice(0, 200);
      if (people.length) {
        await notifyNeighbors({
          pantryId: pantry.id,
          people: people.map((h) => ({ email: h.email, phone: h.phone, name: h.display_name, notes: h.notes })),
          subject: copy.subject,
          text: copy.text
        }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));
      }
    }
    return ok({ message: justListed ? "Listed. Neighbors who asked for pantry news will hear." : "Visit notes saved. We do not force a partnership." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update that place.", 503);
  }
}
