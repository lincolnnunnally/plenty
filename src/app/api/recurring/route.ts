import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { addRecurring, isVolunteerRole, setRecurringActive } from "@/lib/db/queries";
import { encodeFoodNote, foodTypesFrom, normalizeTimeLocal } from "@/lib/store-pitch";
import { encodeMonthWeeks } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const KINDS = new Set(["shift", "distribution", "store_pickup"]);

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const desk = await requireDeskPantry(body);
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  if (str(body.id) && body.active != null) {
    const active = body.active === true || body.active === "on" || body.active === "1";
    await setRecurringActive(str(body.id), pantry.id, active);
    return ok({ message: active ? "This repeats." : "Stopped repeating." });
  }
  const kind = str(body.kind);
  if (!KINDS.has(kind)) return fail("Choose a shift, a distribution day, or a store pickup.");
  const title = str(body.title);
  if (!title) return fail("Name the repeating job.");
  const weekday = Number(str(body.weekday));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return fail("Choose a day of the week.");
  const timeLocal = normalizeTimeLocal(str(body.timeLocal));
  if (!timeLocal) return fail("Choose a time.");
  const role = str(body.role) || "pickup";
  if (kind === "shift" && !isVolunteerRole(role)) return fail("Choose a volunteer role.");
  if (kind === "store_pickup" && !str(body.partnerId)) return fail("Choose which store this pickup repeats at.");
  const foods = foodTypesFrom(body.foodTypes);
  const weeks = (Array.isArray(body.monthWeeks) ? body.monthWeeks : [body.monthWeeks])
    .map((v) => Number(v))
    .filter((n) => n >= 1 && n <= 5);
  const notes = [str(body.notes), encodeMonthWeeks(weeks), kind === "store_pickup" && foods.length ? encodeFoodNote(foods) : ""]
    .filter(Boolean)
    .join("\n");
  try {
    await addRecurring({
      pantryId: pantry.id,
      kind,
      title,
      weekday,
      timeLocal,
      role: kind === "distribution" ? "serve" : role,
      location: str(body.location) || pantry.address || pantry.city,
      partnerId: str(body.partnerId) || null,
      notes
    });
    return ok({ message: "Repeating job saved. The hourly clock will post the next one." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the repeating job.", 503);
  }
}
