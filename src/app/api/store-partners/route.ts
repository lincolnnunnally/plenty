import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addRecurring, addStorePartner, getDefaultPantry, listRecurring } from "@/lib/db/queries";
import { notifyDesk } from "@/lib/notify";
import { validStaffPin } from "@/lib/store-card/code";
import { encodeConcerns, encodeFoodNote, foodTypesFrom, normalizeTimeLocal, weekdayName } from "@/lib/store-pitch";

export const dynamic = "force-dynamic";

const MODES = new Set(["hold_desk", "food_voucher", "dock_pickup"]);

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const name = str(body.name);
  if (!name) return fail("Name the store.");
  const phone = str(body.phone);
  const contactName = str(body.contactName);
  if (!phone && !contactName) return fail("Leave a phone or a manager name so we can follow up.");
  const how = str(body.how);
  const pickupMode = how === "store_meet" ? "hold_desk" : how === "dock_pickup" ? "dock_pickup" : (str(body.pickupMode) || "hold_desk");
  if (!MODES.has(pickupMode)) return fail("Choose hold at the desk, a food list, or dock pickup.");
  const wantVolunteers =
    how === "store_meet" ||
    body.volunteersOnSite === true ||
    body.volunteersOnSite === "on" ||
    body.volunteersOnSite === "1" ||
    (Array.isArray(body.volunteersOnSite) && body.volunteersOnSite.includes("1"));
  const pin = str(body.pin);
  if (pin && !validStaffPin(pin)) return fail("A store PIN is 4 to 8 digits.");
  const weekdayRaw = str(body.weekday);
  const weekday = weekdayRaw === "" ? null : Number(weekdayRaw);
  if (weekday != null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) {
    return fail("Choose a day of the week.");
  }
  const timeLocal = normalizeTimeLocal(str(body.timeLocal));
  const foods = foodTypesFrom(body.foodTypes);
  const foodNote = foods.length ? encodeFoodNote(foods) : "";
  const concernNote = encodeConcerns(body.concerns);
  const hoursText =
    str(body.hoursText) ||
    (weekday != null && timeLocal ? `${weekdayName(weekday)} ${timeLocal}` : "");

  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;

  try {
    const partner = await addStorePartner({
      pantryId: pantry.id,
      name,
      address: str(body.address),
      city: str(body.city) || pantry.city,
      state: str(body.state) || pantry.state || "GA",
      zip: str(body.zip),
      phone,
      contactName,
      contactEmail: str(body.contactEmail),
      pickupMode,
      holdDesk: str(body.holdDesk) || "Customer service",
      hoursText,
      notes: [str(body.notes), foodNote, concernNote].filter(Boolean).join("\n"),
      status: asSteward ? str(body.status) || "active" : "invited",
      pin: asSteward ? pin : undefined,
      volunteersOnSite: Boolean(wantVolunteers),
      meetNote: str(body.meetNote)
    });

    let repeating = false;
    if (weekday != null && timeLocal) {
      try {
        const jobs = await listRecurring(pantry.id);
        const already = jobs.some(
          (j) =>
            j.kind === "store_pickup" &&
            j.partner_id === partner.id &&
            j.weekday === weekday &&
            j.time_local === timeLocal &&
            j.active
        );
        if (!already) {
          await addRecurring({
            pantryId: pantry.id,
            kind: "store_pickup",
            title: `Pickup at ${name}`,
            weekday,
            timeLocal,
            role: "pickup",
            location: [str(body.address), str(body.city) || pantry.city].filter(Boolean).join(", ") || pantry.address || pantry.city,
            partnerId: partner.id,
            notes: [foodNote, str(body.notes) || "Weekly leftover pickup"].filter(Boolean).join("\n")
          });
        }
        repeating = true;
      } catch {
        repeating = false;
      }
    }

    const whenLine = weekday != null && timeLocal ? `${weekdayName(weekday)} ${timeLocal}` : "";
    await notifyDesk({
      pantryId: pantry.id,
      pantryEmail: pantry.email,
      pantryPhone: pantry.phone,
      subject: repeating ? `Plenty: weekly pickup from ${name}` : `Plenty: grocery store ${name}`,
      text: repeating
        ? `${name} set a weekly leftover pickup.\nWhen: ${whenLine}\nFood: ${foods.join(", ") || "see store"}\nHow: ${pickupMode.replace("_", " ")}\nConcerns: ${concernNote || "none"}\n${contactName} ${phone}\nDesk: https://plenty.unitedundergod.org/run/stores`
        : `${name} asked to donate leftover food — not ready for a weekly pickup yet.\nConcerns: ${concernNote || "none"}\n${str(body.notes)}\n${contactName} ${phone}\nDesk: https://plenty.unitedundergod.org/run/stores`
    }).catch(() => ({ emailed: 0, texted: 0, failed: 0, detail: "" }));

    return ok({
      partnerId: partner.id,
      repeating,
      message: asSteward
        ? repeating
          ? "Store saved. Weekly pickup is on the clock — volunteers get a text when it posts."
          : "Store partner saved. Issue cards from this desk."
        : repeating
          ? `Request received. We will pick up ${whenLine}. A pantry admin will call you. Extra purchase will never be a condition.`
          : "Request received. A pantry admin will call you. Extra purchase will never be a condition."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the store.", 503);
  }
}
