import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import { addStorePartner, getDefaultPantry } from "@/lib/db/queries";
import { encodeDonorMeta } from "@/lib/donors/starting";

export const dynamic = "force-dynamic";

const KINDS = new Set(["warehouse", "grocery", "farm", "manufacturer", "church"]);

function flags(body: Record<string, unknown>, key: string) {
  const value = body[key];
  const parts = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  return parts.filter((v) => v && v !== "0" && v !== "false");
}

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const steward = await requireStewardFor(pantry.id);
  if (steward.error) return steward.error;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const name = str(body.name);
  if (!name) return fail("Name the donor.");
  const kind = str(body.kind) || "warehouse";
  if (!KINDS.has(kind)) return fail("Choose warehouse, grocery, farm, manufacturer, or church.");
  const contactName = str(body.contactName);
  const phone = str(body.phone);
  if (!contactName && !phone) return fail("Leave a person or a phone so we can follow up.");
  const gives = flags(body, "foodTypes");
  try {
    const partner = await addStorePartner({
      pantryId: pantry.id,
      name,
      address: str(body.address),
      city: str(body.city) || pantry.city,
      state: str(body.state) || "GA",
      zip: str(body.zip),
      phone,
      contactName,
      contactEmail: str(body.contactEmail),
      pickupMode: kind === "grocery" ? str(body.pickupMode) || "dock_pickup" : "dock_pickup",
      holdDesk: str(body.contactRole) || "Dock",
      hoursText: "",
      notes: `${encodeDonorMeta({ kind, gives, next: str(body.nextFollowUp) })}\n${str(body.notes)}`,
      status: str(body.status) || "invited"
    });
    return ok({ partnerId: partner.id, message: `${partner.name} is on the donor list. Log a call when you talk to them.` });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not add that donor.", 503);
  }
}
