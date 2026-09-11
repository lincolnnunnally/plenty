import { fail, ok, readJson, requireDeskPantry, str } from "@/lib/api";
import { availableThisWeek, getAlly, listHouseholds, visitCountsByHousehold } from "@/lib/db/queries";
import { canReach, followsPlace, inviteCopy, matchesInvite, wantsPlaceAlerts, zipsFrom } from "@/lib/invite";
import { notifyNeighbors } from "@/lib/notify";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.some((v) => v === true || v === "true" || v === "on" || v === "1");
}

function idsFrom(value: unknown) {
  const raw = Array.isArray(value) ? value.map((v) => String(v)) : String(value ?? "").split(/[,\s]+/);
  return [...new Set(raw.map((s) => s.trim()).filter((s) => s.length > 8))];
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const desk = await requireDeskPantry(body);
  if (desk.error || !desk.pantry || !desk.user) return desk.error || fail("Sign in at the desk.", 401);
  const pantry = desk.pantry;
  const kindRaw = str(body.kind) || "invite";
  const kind = kindRaw === "hours" || kindRaw === "new_place" || kindRaw === "this_week" ? kindRaw : "invite";
  const audience = str(body.audience) || "followers";
  const placeId = str(body.placeId) || "hub";
  const preview = on(body.preview);
  const ally = placeId !== "hub" ? await getAlly(placeId, pantry.id).catch(() => null) : null;
  const name = ally?.name || pantry.name;
  const food = kind === "this_week" || kind === "invite"
    ? (await availableThisWeek(pantry.id).catch(() => [])).map((i) => i.name)
    : [];
  const copy = inviteCopy({
    name,
    hours: ally?.hours_text || pantry.hours_text,
    address: ally?.address || pantry.address,
    city: ally?.city || pantry.city,
    state: ally?.state || pantry.state,
    zip: ally?.zip || pantry.zip,
    food,
    kind
  });
  const households = await listHouseholds(pantry.id).catch(() => []);
  const visits = await visitCountsByHousehold(pantry.id).catch(() => new Map());
  const zips = zipsFrom(body.zips ?? body.zip);
  const pickIds = idsFrom(body.householdIds ?? body.ids);
  const bulk =
    audience === "bulk" ||
    zips.length > 0 ||
    pickIds.length > 0 ||
    on(body.children) ||
    on(body.delivery) ||
    on(body.neverVisited) ||
    Number(str(body.quietDays)) > 0 ||
    Number(str(body.minSize)) > 0;
  if (audience === "bulk") {
    const hasCut =
      zips.length > 0 ||
      pickIds.length > 0 ||
      on(body.children) ||
      on(body.delivery) ||
      on(body.neverVisited) ||
      Number(str(body.quietDays)) > 0 ||
      Number(str(body.minSize)) > 0;
    if (!hasCut) return fail("Pick a ZIP, a trait, or names so this is not every neighbor at once.");
  }

  const people = households.filter((h) => {
    if (!canReach(h)) return false;
    if (bulk) {
      return matchesInvite(
        h,
        {
          zips,
          ids: pickIds,
          children: on(body.children),
          delivery: on(body.delivery),
          neverVisited: on(body.neverVisited),
          quietDays: Number(str(body.quietDays)) || 0,
          minSize: Number(str(body.minSize)) || 0,
          followersOnly: false,
          placeId
        },
        visits
      );
    }
    if (audience === "all") return true;
    if (followsPlace(h, placeId) || (ally && followsPlace(h, ally.id))) return true;
    if (kind === "new_place" && wantsPlaceAlerts(h.notes)) return true;
    return false;
  }).slice(0, 200);

  if (preview) {
    return ok({
      preview: true,
      count: people.length,
      names: people.slice(0, 40).map((h) => `${h.display_name}${h.zip ? ` · ${h.zip}` : ""}`),
      message: people.length
        ? `${people.length} neighbor${people.length === 1 ? "" : "s"} would get this. Nothing sent yet.`
        : "Nobody in that cut opted in to texts."
    });
  }
  if (!people.length) {
    return ok({ message: "No one to text yet. Neighbors must opt in to texts." });
  }
  const sent = await notifyNeighbors({
    pantryId: pantry.id,
    people: people.map((h) => ({ email: h.email, phone: h.phone, name: h.display_name, notes: h.notes })),
    subject: copy.subject,
    text: copy.text
  }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "Notify failed." }));
  return ok({
    message: `Told ${sent.texted + sent.emailed} neighbor${sent.texted + sent.emailed === 1 ? "" : "s"} about ${name}.`,
    emailed: sent.emailed,
    texted: sent.texted
  });
}
