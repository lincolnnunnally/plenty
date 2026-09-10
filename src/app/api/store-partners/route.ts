import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addStorePartner, getDefaultPantry } from "@/lib/db/queries";
import { validStaffPin } from "@/lib/store-card/code";

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
  const pickupMode = str(body.pickupMode) || "hold_desk";
  if (!MODES.has(pickupMode)) return fail("Choose hold at the desk, a food list, or dock pickup.");
  const pin = str(body.pin);
  if (pin && !validStaffPin(pin)) return fail("A store PIN is 4 to 8 digits.");

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
      hoursText: str(body.hoursText),
      notes: str(body.notes),
      status: asSteward ? str(body.status) || "active" : "invited",
      pin: asSteward ? pin : undefined,
      volunteersOnSite: asSteward && (body.volunteersOnSite === true || body.volunteersOnSite === "on" || body.volunteersOnSite === "1" || (Array.isArray(body.volunteersOnSite) && body.volunteersOnSite.includes("1"))),
      meetNote: str(body.meetNote)
    });
    return ok({
      partnerId: partner.id,
      message: asSteward
        ? "Store partner saved. Issue cards from this desk."
        : "Request received. A pantry admin will call you. Extra purchase will never be a condition."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the store.", 503);
  }
}
