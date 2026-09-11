import { fail, ok, readJson, requireUser, resolvePantry, str } from "@/lib/api";
import { upsertHousehold, householdForUser } from "@/lib/db/queries";
import { shareHouseholdToEcosystem } from "@/lib/ecosystem";
import { planIdsFrom, withPlanIds } from "@/lib/plan";
import { withPlaceAlerts } from "@/lib/invite";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await resolvePantry(body);
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const displayName = str(body.displayName) || user.name;
  const size = Math.max(1, Number(body.householdSize) || 1);
  const existing = await householdForUser(pantry.id, user.id).catch(() => null);
  const planTouched = body.planIds != null || body.plan != null;
  let notes: string | undefined = planTouched ? withPlanIds(existing?.notes || "", planIdsFrom(body.planIds ?? body.plan)) : undefined;
  if (body.placeAlerts != null) {
    notes = withPlaceAlerts(notes ?? existing?.notes ?? "", on(body.placeAlerts));
  }
  try {
    const household = await upsertHousehold({
      pantryId: pantry.id,
      userId: user.id,
      displayName,
      householdSize: size,
      dietaryNotes: str(body.dietaryNotes) || existing?.dietary_notes || "",
      phone: str(body.phone) || existing?.phone || "",
      preferredContact: str(body.preferredContact) || existing?.preferred_contact || "in_person",
      email: str(body.email) || user.email,
      address: str(body.address) || existing?.address || "",
      city: str(body.city) || existing?.city || "",
      state: str(body.state) || existing?.state || "",
      zip: str(body.zip) || existing?.zip || "",
      adultsCount: Math.max(1, Number(body.adultsCount) || existing?.adults_count || 1),
      childrenCount: Math.max(0, Number(body.childrenCount) || existing?.children_count || 0),
      familyNotes: str(body.familyNotes) || existing?.family_notes || "",
      deliveryOk: body.deliveryOk != null ? on(body.deliveryOk) : Boolean(existing?.delivery_ok),
      porchLeaveOk: body.porchLeaveOk != null ? on(body.porchLeaveOk) : Boolean(existing?.porch_leave_ok),
      porchNotes: str(body.porchNotes) || existing?.porch_notes || "",
      reachOk: body.reachOk != null ? on(body.reachOk) : Boolean(existing?.reach_ok),
      notes
    });
    await shareHouseholdToEcosystem({ household, pantry, event: "registered" }).catch(() => ({ ok: false, error: "" }));
    return ok({ householdId: household.id, message: "Your household is on the list. Come when we are open — food is never held back." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the household.", 503);
  }
}
