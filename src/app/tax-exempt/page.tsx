import { EIN, LEGAL_NAME, TAX_LINE } from "@/lib/legal/org";
import { getDefaultPantrySafe, getTaxProfile } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Tax-exempt information",
  `${LEGAL_NAME} is a 501(c)(3), EIN ${EIN}. Plenty food pantry is a program of United Under God. Gifts of food or money may be tax-deductible to the extent allowed by law.`
);

export default async function TaxExemptPage() {
  const pantry = await getDefaultPantrySafe();
  const tax = pantry ? await getTaxProfile(pantry.id) : null;
  const legalName = tax?.legal_name?.trim() || LEGAL_NAME;
  const ein = tax?.ein?.trim() || EIN;

  return (
    <main className="shell">
      <p className="eyebrow">Donors</p>
      <h1>Tax-exempt information</h1>
      <div className="panel">
        <p>{TAX_LINE}</p>
        <p>Gifts of food inventory and money to Plenty are gifts to {legalName}. They may be tax-deductible to the extent allowed by law. Grocery stores: see the <a href="/for-stores/brief">one-page leave-behind</a> for the enhanced food-inventory deduction.</p>
        <p><strong>Legal name:</strong> {legalName}</p>
        <p><strong>EIN:</strong> {ein}</p>
        <p><strong>Status:</strong> 501(c)(3)</p>
        {tax?.letter_text ? <p style={{ whiteSpace: "pre-wrap" }}>{tax.letter_text}</p> : null}
        {tax?.letter_url ? (
          <p><a className="button" href={tax.letter_url} target="_blank" rel="noopener noreferrer">Open the determination letter</a></p>
        ) : (
          <p className="note">The determination letter can be attached here when a scan is on file. The EIN is already public on United Under God.</p>
        )}
      </div>
      <div className="action-row">
        <a className="button primary" href="/donate">Give food or money</a>
        <a className="button" href="/for-stores">For grocery stores</a>
      </div>
    </main>
  );
}
