import { fail, ok, readJson, requireDeskPantry, str } from "@/lib/api";
import { availableThisWeek, getAlly, listHouseholds } from "@/lib/db/queries";
import { followsPlace, inviteCopy, wantsPlaceAlerts } from "@/lib/invite";
import { notifyNeighbors } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const desk = await requireDeskPantry(body);
  if (desk.error || !desk.pantry || !desk.user) return desk.error || fail("Sign in at the desk.", 401);
  const pantry = desk.pantry;
  const kindRaw = str(body.kind) || "invite";
  const kind = kindRaw === "hours" || kindRaw === "new_place" || kindRaw === "this_week" ? kindRaw : "invite";
  const audience = str(body.audience) === "all" ? "all" : "followers";
  const placeId = str(body.placeId) || "hub";
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
  const people = households.filter((h) => {
    if (!h.reach_ok) return false;
    if (!h.phone && !h.email) return false;
    if (audience === "all") return true;
    if (followsPlace(h, placeId) || followsPlace(h, ally?.id || "hub")) return true;
    if (kind === "new_place" && wantsPlaceAlerts(h.notes)) return true;
    return false;
  }).slice(0, 200);
  if (!people.length) {
    return ok({ message: "No one to text yet. Neighbors must opt in to texts, or pick this pantry on their account." });
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
