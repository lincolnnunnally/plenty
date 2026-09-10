import { fail, ok, readJson, requireDeskPantry, str } from "@/lib/api";
import { getDonation, getTaxProfile, markReceiptSent } from "@/lib/db/queries";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { sendCampaignEmail } from "@/lib/promote/email";
import { receiptPdf } from "@/lib/promote/pdf";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const desk = await requireDeskPantry();
  if (desk.error || !desk.pantry) return desk.error || fail("No pantry is set up yet.", 503);
  const pantry = desk.pantry;
  const body = await readJson(request);
  if (!body) return fail("Send a JSON body.");
  const id = str(body.id);
  if (!id) return fail("Which gift?");
  try {
    const gift = await getDonation(id, pantry.id);
    if (!gift) return fail("That gift is not on this pantry.", 404);
    const email = str(gift.contact_email);
    if (email) {
      const tax = await getTaxProfile(pantry.id).catch(() => null);
      const dollars = `$${((gift.amount_cents || 0) / 100).toFixed(2)}`;
      const date = new Date(gift.received_at || gift.created_at).toLocaleDateString();
      const year = new Date(gift.received_at || gift.created_at).getFullYear();
      const pdf = await receiptPdf({
        legalName: tax?.legal_name || LEGAL_NAME,
        ein: tax?.ein || EIN,
        pantryName: pantry.name,
        donorName: gift.contact_name || email,
        amount: dollars,
        date,
        year
      });
      await sendCampaignEmail({
        pantryId: pantry.id,
        audience: "donors",
        to: [{ email, name: gift.contact_name }],
        subject: `Receipt for your gift to ${pantry.name}`,
        html: `<p>Thank you${gift.contact_name ? `, ${gift.contact_name}` : ""}. We received ${dollars} on ${date}. A PDF receipt is attached for your records. No goods or services were provided in exchange for this gift.</p>`,
        attachment: { filename: `plenty-receipt-${year}.pdf`, content: pdf, contentType: "application/pdf" }
      });
    }
    await markReceiptSent(id);
    return ok({
      message: email
        ? `Receipt emailed to ${email} and marked sent.`
        : "No email on this gift — marked sent. Add an email next time."
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not send the receipt.", 503);
  }
}
