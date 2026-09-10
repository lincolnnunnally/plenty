import { fail, ok, readJson, str } from "@/lib/api";
import { offerFoodLoad } from "@/lib/db/food-loads";
import { getDefaultPantry, listStorePartners } from "@/lib/db/queries";
import { storeDeskPartnerId } from "@/lib/store-card/store-session";

export const dynamic = "force-dynamic";

const CATS = new Set(["dry", "refrigerated", "frozen", "produce"]);

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const partnerId = await storeDeskPartnerId();
  if (!partnerId) return fail("Open the store desk with your PIN first.", 401);
  const partners = await listStorePartners(pantry.id);
  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return fail("Store not found.", 404);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const leftover = body.leftover === true || body.leftover === "on" || body.leftover === "1";
  const pickupAt = str(body.pickupAt) ? new Date(str(body.pickupAt)).toISOString() : null;
  const holdUntil = str(body.holdUntil) ? new Date(str(body.holdUntil)).toISOString() : null;
  if (!pickupAt && !holdUntil) return fail("Tell us when to pick up, or how long the hold can sit.");
  const items: { category: string; title: string; quantity: string; mustUseBy: string | null }[] = [];
  for (const cat of ["dry", "refrigerated", "frozen", "produce"]) {
    const qty = str(body[`${cat}Qty`]);
    const title = str(body[`${cat}Title`]);
    if (!qty && !title) continue;
    if (!CATS.has(cat)) continue;
    const due = str(body[`${cat}By`]);
    items.push({
      category: cat,
      title: title || cat,
      quantity: qty || "some",
      mustUseBy: due || null
    });
  }
  if (!items.length) return fail("Say what kind of food this is — dry, refrigerated, frozen, or produce.");
  const mode = partner.volunteers_on_site ? "store_meet" : partner.pickup_mode;
  try {
    const load = await offerFoodLoad({
      pantryId: pantry.id,
      partnerId: partner.id,
      mode,
      leftover,
      pickupAt,
      holdUntil,
      notes: str(body.notes),
      items,
      partnerName: partner.name,
      partnerAddress: [partner.address, partner.city].filter(Boolean).join(", "),
      partnerPhone: partner.phone
    });
    return ok({
      loadId: load.id,
      message: leftover
        ? `Leftover collect scheduled. Volunteers will be asked. Destination: ${load.dest_note}. ${load.route_reason}`
        : `Pickup posted for volunteers. Destination: ${load.dest_note}. ${load.route_reason}`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not schedule that food.", 503);
  }
}
