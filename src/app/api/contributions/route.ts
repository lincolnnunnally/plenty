import { fail, ok, readJson, requireStewardFor, requireUser, str } from "@/lib/api";
import { addContribution, getDefaultPantry, householdForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

function on(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "yes";
}

export async function POST(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return fail("No pantry is set up yet.", 503);
  const { error, user } = await requireUser();
  if (error || !user) return error || fail("Sign in first.", 401);
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");

  const waived = on(body.waived);
  const dollars = str(body.amountDollars);
  const amountCents = dollars ? Math.round(Number(dollars) * 100) : null;
  if (!waived && amountCents != null && (!Number.isFinite(amountCents) || amountCents < 0)) {
    return fail("Enter a dollar amount, or mark this as waived.");
  }

  let householdId = str(body.householdId) || null;
  const steward = await requireStewardFor(pantry.id);
  const asSteward = !steward.error;
  if (!asSteward) {
    const mine = await householdForUser(pantry.id, user.id);
    if (!mine) return fail("Register your household first. Food does not depend on a donation.");
    householdId = mine.id;
  }
  if (!householdId) return fail("Choose a household.");

  try {
    await addContribution({
      pantryId: pantry.id,
      householdId,
      userId: user.id,
      amountCents: waived ? 0 : amountCents,
      waived,
      waiveReason: str(body.waiveReason),
      notes: str(body.notes),
      visitId: str(body.visitId) || null
    });
    return ok({
      message: waived
        ? "No handling donation this time. They still get food."
        : "Handling donation recorded. That is not a charge for food."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not record the contribution.", 503);
  }
}
