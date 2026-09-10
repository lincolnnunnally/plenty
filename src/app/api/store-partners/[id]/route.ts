import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { getDefaultPantry, updateStorePartner } from "@/lib/db/queries";
import { validStaffPin } from "@/lib/store-card/code";

export const dynamic = "force-dynamic";

const MODES = new Set(["hold_desk", "food_voucher", "dock_pickup"]);
const STATUSES = new Set(["invited", "active", "paused"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error } = await requireStewardFor(pantry.id);
  if (error) return error;
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pickupMode = str(body.pickupMode);
  if (pickupMode && !MODES.has(pickupMode)) return fail("Choose hold at the desk, a food list, or dock pickup.");
  const status = str(body.status);
  if (status && !STATUSES.has(status)) return fail("Choose invited, active, or paused.");
  const pin = str(body.pin);
  if (pin && !validStaffPin(pin)) return fail("A store PIN is 4 to 8 digits.");
  try {
    const row = await updateStorePartner(id, pantry.id, {
      name: str(body.name) || undefined,
      address: body.address != null ? str(body.address) : undefined,
      city: body.city != null ? str(body.city) : undefined,
      state: body.state != null ? str(body.state) : undefined,
      zip: body.zip != null ? str(body.zip) : undefined,
      phone: body.phone != null ? str(body.phone) : undefined,
      contactName: body.contactName != null ? str(body.contactName) : undefined,
      contactEmail: body.contactEmail != null ? str(body.contactEmail) : undefined,
      pickupMode: pickupMode || undefined,
      holdDesk: body.holdDesk != null ? str(body.holdDesk) : undefined,
      hoursText: body.hoursText != null ? str(body.hoursText) : undefined,
      notes: body.notes != null ? str(body.notes) : undefined,
      status: status || undefined,
      pin: pin || undefined,
      volunteersOnSite: body.volunteersOnSite != null
        ? (Array.isArray(body.volunteersOnSite)
          ? body.volunteersOnSite.includes("1") || body.volunteersOnSite.includes("on")
          : body.volunteersOnSite === true || body.volunteersOnSite === "on" || body.volunteersOnSite === "1")
        : undefined,
      meetNote: body.meetNote != null ? str(body.meetNote) : undefined
    });
    if (!row) return fail("Store not found.", 404);
    return ok({ message: "Store updated. Extra purchase stays off." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not update the store.", 503);
  }
}
