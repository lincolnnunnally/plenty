import { getDefaultPantrySafe, getTaxProfile } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Tax-exempt information",
  "Tax-exempt letter and EIN for donations to Plenty food pantry in Vidalia, Georgia — posted only when we have them."
);

export default async function TaxExemptPage() {
  const pantry = await getDefaultPantrySafe();
  const tax = pantry ? await getTaxProfile(pantry.id) : null;
  const posted = Boolean(tax?.posted && (tax.ein || tax.letter_text || tax.letter_url));

  return (
    <main className="shell">
      <p className="eyebrow">Donors</p>
      <h1>Tax-exempt information</h1>
      {posted ? (
        <div className="panel">
          <p>Gifts to this food pantry may be tax-deductible to the extent allowed by law. This is the information we have on file.</p>
          {tax?.legal_name ? <p><strong>Legal name:</strong> {tax.legal_name}</p> : null}
          {tax?.ein ? <p><strong>EIN:</strong> {tax.ein}</p> : null}
          {tax?.letter_text ? <p style={{ whiteSpace: "pre-wrap" }}>{tax.letter_text}</p> : null}
          {tax?.letter_url ? <p><a className="button" href={tax.letter_url} target="_blank" rel="noopener noreferrer">Open the determination letter</a></p> : null}
        </div>
      ) : (
        <p className="empty">
          We will not claim tax-exempt status here until a determination letter and EIN are on file.
          Your gift is still recorded. When the letter is posted, year-end receipts will use this page.
        </p>
      )}
      <a className="button" href="/donate">Back to giving</a>
    </main>
  );
}
