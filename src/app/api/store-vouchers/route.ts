import { fail, ok, readJson, requireStewardFor, str, requireDeskPantry } from "@/lib/api";
import { issueStoreVoucher } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const user = desk.user;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const partnerId = str(body.partnerId);
  const householdId = str(body.householdId);
  if (!partnerId) return fail("Choose the store.");
  if (!householdId) return fail("Choose the household.");
  const days = str(body.expiresInDays);
  let expiresAt: string | null = null;
  if (days) {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1 || n > 365) return fail("Expiry, if set, is 1 to 365 days.");
    expiresAt = new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
  }
  try {
    const voucher = await issueStoreVoucher({
      pantryId: pantry.id,
      partnerId,
      householdId,
      itemsText: str(body.itemsText),
      stillNeedText: str(body.stillNeedText),
      expiresAt,
      createdBy: user.id
    });
    return ok({
      voucherId: voucher.id,
      code: voucher.code,
      message: `Card ${voucher.code} is ready to print. Extra purchase is not required.`
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not issue the card.", 503);
  }
}
