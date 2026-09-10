import { fail, ok, readJson, requireStewardFor, str } from "@/lib/api";
import {
  addContribution,
  addWalkInHousehold,
  applyHandlingToVisit,
  findHouseholdByPhone,
  getHousehold,
  getPantryBySlug,
  householdByPass,
  recordVisit,
  searchHouseholds,
  unusedHandling
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes" || value === "1";
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const pantry = await getPantryBySlug(str(body.pantrySlug));
  if (!pantry) return fail("This pantry page is not set up yet.", 404);
  const action = str(body.action) || "checkin";
  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;

  async function pack(h: { id: string; display_name: string; household_size: number; phone: string; pass_code?: string }) {
    const credits = await unusedHandling(h.id);
    return {
      id: h.id,
      displayName: h.display_name,
      size: h.household_size,
      phone: asSteward ? h.phone : "",
      passCode: h.pass_code || "",
      handlingPrepaid: credits.length > 0,
      handlingCount: credits.length
    };
  }

  if (action === "lookup") {
    const pass = str(body.pass);
    if (pass) {
      const found = await householdByPass(pass);
      if (!found || found.pantry_id !== pantry.id) return ok({ households: [], message: "No household with that pass." });
      return ok({ households: [await pack(found)] });
    }
    const phone = str(body.phone);
    const query = str(body.query);
    if (asSteward && query) {
      const rows = await searchHouseholds(pantry.id, query);
      return ok({ households: await Promise.all(rows.map(pack)) });
    }
    if (!phone) return fail("Enter a phone, a name at the desk, or scan their household pass.");
    const found = await findHouseholdByPhone(pantry.id, phone);
    if (!found) return ok({ households: [], message: "No household with that phone yet. Register them below." });
    return ok({ households: [await pack(found)] });
  }

  if (action === "waive") {
    const householdId = str(body.householdId);
    if (!householdId) return fail("Check in first.");
    await addContribution({
      pantryId: pantry.id,
      householdId,
      userId: steward.user?.id || null,
      amountCents: 0,
      waived: true,
      waiveReason: "Cannot help with handling this visit",
      notes: "Line",
      visitId: str(body.visitId) || null
    });
    return ok({ message: "No handling donation this time. They still get food." });
  }

  let household = str(body.householdId) ? await getHousehold(str(body.householdId), pantry.id) : null;
  if (!household && str(body.pass)) {
    const byPass = await householdByPass(str(body.pass));
    if (byPass && byPass.pantry_id === pantry.id) household = byPass;
  }
  if (!household) {
    const phone = str(body.phone);
    if (phone) household = await findHouseholdByPhone(pantry.id, phone);
  }
  if (!household) {
    const name = str(body.displayName);
    if (!name) return fail("We need a name to put them on the list. A phone is optional.");
    household = await addWalkInHousehold({
      pantryId: pantry.id,
      displayName: name,
      householdSize: Math.max(1, Number(str(body.householdSize)) || 1),
      phone: str(body.phone),
      notes: asSteward ? "Registered at the desk" : "Registered at the line"
    });
  }

  const visit = await recordVisit({
    pantryId: pantry.id,
    householdId: household.id,
    userId: household.user_id || steward.user?.id || null,
    itemsSummary: str(body.itemsSummary),
    notes: str(body.notes),
    locationId: str(body.locationId) || null
  });
  const applied = await applyHandlingToVisit(household.id, visit.id);
  const prepaid = Boolean(applied);

  return ok({
    householdId: household.id,
    visitId: visit.id,
    displayName: household.display_name,
    passCode: household.pass_code,
    handlingPrepaid: prepaid,
    message: prepaid
      ? `${household.display_name} is checked in. Handling was already given. The food is free.`
      : `${household.display_name} is checked in. The food is free. A handling donation is requested, not required.`
  });
}
