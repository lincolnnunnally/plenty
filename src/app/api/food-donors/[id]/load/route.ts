import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { offerFoodLoad } from "@/lib/db/food-loads";
import { getDefaultPantry, listStorePartners, updateStorePartner } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const CATS = new Set(["dry", "refrigerated", "frozen", "produce"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const steward = await requireStewardFor(pantry.id);
  if (steward.error) return steward.error;
  const { id } = await context.params;
  const partners = await listStorePartners(pantry.id);
  const partner = partners.find((p) => p.id === id);
  if (!partner) return fail("Donor not found.", 404);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pickupAt = str(body.pickupAt) ? new Date(str(body.pickupAt)).toISOString() : null;
  if (!pickupAt) return fail("When should volunteers pick this up?");
  const items: { category: string; title: string; quantity: string; mustUseBy: string | null }[] = [];
  for (const cat of ["dry", "refrigerated", "frozen", "produce"]) {
    const on = body[cat] === true || body[cat] === "on" || body[cat] === "1" || (Array.isArray(body[cat]) && body[cat].includes("1"));
    const qty = str(body[`${cat}Qty`]);
    if (!on && !qty) continue;
    if (!CATS.has(cat)) continue;
    items.push({
      category: cat,
      title: str(body[`${cat}Title`]) || cat,
      quantity: qty || "some",
      mustUseBy: str(body[`${cat}By`]) || null
    });
  }
  if (!items.length) return fail("Say what they have — frozen, dry, refrigerated, or produce.");
  try {
    const load = await offerFoodLoad({
      pantryId: pantry.id,
      partnerId: partner.id,
      mode: "dock_pickup",
      leftover: false,
      pickupAt,
      holdUntil: null,
      notes: str(body.notes) || `Pickup at ${partner.name}`,
      items,
      partnerName: partner.name,
      partnerAddress: [partner.address, partner.city].filter(Boolean).join(", "),
      partnerPhone: partner.phone
    });
    if (partner.status !== "active") {
      await updateStorePartner(partner.id, pantry.id, { status: "active" }).catch(() => null);
    }
    return ok({
      loadId: load.id,
      message: `Pickup posted. Volunteers get a text. Destination: ${load.dest_note}. ${load.route_reason}`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not post that pickup.", 503);
  }
}
