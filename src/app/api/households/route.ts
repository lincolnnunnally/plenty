import { fail, ok, readJson, requireUser, resolvePantry, str } from "@/lib/api";
import { upsertHousehold } from "@/lib/db/queries";
import { shareHouseholdToEcosystem } from "@/lib/ecosystem";

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
  try {
    const household = await upsertHousehold({
      pantryId: pantry.id,
      userId: user.id,
      displayName,
      householdSize: size,
      dietaryNotes: str(body.dietaryNotes),
      phone: str(body.phone),
      preferredContact: str(body.preferredContact) || "in_person",
      email: str(body.email) || user.email,
      address: str(body.address),
      city: str(body.city),
      state: str(body.state),
      zip: str(body.zip),
      adultsCount: Math.max(1, Number(body.adultsCount) || 1),
      childrenCount: Math.max(0, Number(body.childrenCount) || 0),
      familyNotes: str(body.familyNotes),
      deliveryOk: on(body.deliveryOk),
      porchLeaveOk: on(body.porchLeaveOk),
      porchNotes: str(body.porchNotes)
    });
    await shareHouseholdToEcosystem({ household, pantry, event: "registered" }).catch(() => ({ ok: false, error: "" }));
    return ok({ householdId: household.id, message: "Your household is on the list. Come when we are open — food is never held back." });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save the household.", 503);
  }
}
