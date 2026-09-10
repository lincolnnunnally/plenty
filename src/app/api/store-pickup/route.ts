import { fail, ok, readJson, str } from "@/lib/api";
import { redeemStoreCardWithPin } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const code = str(body.code);
  const pin = str(body.pin);
  if (!code) return fail("Enter the card code.");
  if (!pin) return fail("Enter the store PIN.");
  try {
    const row = await redeemStoreCardWithPin(code, pin, str(body.note));
    return ok({
      voucherId: row.id,
      message: "Collected. Extra purchase was not required."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not mark this card collected.", 503);
  }
}
