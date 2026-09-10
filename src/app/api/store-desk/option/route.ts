import { fail, ok, readJson, str } from "@/lib/api";
import { getDefaultPantry, listStorePartners, updateStorePartner } from "@/lib/db/queries";
import { storeDeskPartnerId } from "@/lib/store-card/store-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const partnerId = await storeDeskPartnerId();
  if (!partnerId) return fail("Open the store desk with your PIN first.", 401);
  const partners = await listStorePartners(pantry.id);
  if (!partners.some((p) => p.id === partnerId)) return fail("Store not found.", 404);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const how = str(body.how);
  const pickupMode = how === "dock_pickup" ? "dock_pickup" : "hold_desk";
  const volunteersOnSite = how === "store_meet";
  try {
    await updateStorePartner(partnerId, pantry.id, {
      pickupMode,
      volunteersOnSite,
      hoursText: str(body.hoursText) || undefined,
      holdDesk: str(body.holdDesk) || undefined,
      meetNote: str(body.meetNote) || undefined
    });
    return ok({
      message:
        how === "dock_pickup"
          ? "Switched to dock pickup. Tell us when to come and we will post a volunteer shift."
          : how === "store_meet"
            ? "Switched to volunteers on your floor. You can change this any time."
            : "Switched to a desk hold. Tell us when people may come, especially for cold food."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not change the option.", 503);
  }
}
