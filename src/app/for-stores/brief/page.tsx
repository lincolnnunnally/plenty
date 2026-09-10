import { EIN, LEGAL_NAME, TAX_LINE } from "@/lib/legal/org";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const metadata = pageMeta(
  "Why grocery stores donate surplus food — one page",
  `Donating unsold food to Plenty (a program of ${LEGAL_NAME}, ${EIN}) is a win for the store: sales stay, taxes can beat the dumpster, liability is covered, and neighbors still shop with you.`
);

export default function StoreBriefPage() {
  return (
    <main className="brief-page">
      <p className="print-hide note">
        Print this page (or Save as PDF) and leave it with a store manager.{" "}
        <a href="/for-stores">Longer briefing with statutes</a>
      </p>

      <article className="brief-sheet">
        <header className="brief-top">
          <p className="brief-kicker">Plenty food pantry · a program of {LEGAL_NAME}</p>
          <h1>Donating leftover food is a win for your store</h1>
          <p className="brief-sub">
            The same reasons Kroger, Publix, Walmart, and Costco donate. You keep your paying
            customers. You can come out ahead of the dumpster. Federal and Georgia law cover the
            lawsuit fear.
          </p>
          <p className="brief-ein">{TAX_LINE}</p>
        </header>

        <div className="brief-grid">
          <section>
            <span>1</span>
            <h2>Your sales do not fall in a meaningful way</h2>
            <p>
              People who use a pantry generally could not have paid grocery prices that week. Studies
              of pantry locations vs grocer revenue found no significant drop in store sales. Money
              they do not spend on a bag of rice here is still spent in your aisles on what the
              pantry does not have — milk, meat, soap, a birthday cake.
            </p>
          </section>
          <section>
            <span>2</span>
            <h2>Cost plus half the unsold profit</h2>
            <p>
              Throwing food away usually deducts only what you paid. Donating wholesome food to a
              qualified 501(c)(3) can qualify for the enhanced deduction (IRC § 170(e)(3)(C)): your
              cost plus half the profit you will never ring up, capped at twice cost.
            </p>
            <p className="brief-math">
              Example: paid $200, would sell for $300. Dump ≈ $200 write-off. Donate ≈ $250 deduction.
            </p>
          </section>
          <section>
            <span>3</span>
            <h2>Less money in the dumpster</h2>
            <p>
              Disposal has a fee. Donation often costs less per pound than trash. Pulling tired
              perishables also clears the shelf for food people will pay full price for — research
              on donating stores found higher markups, not a hole in the register.
            </p>
          </section>
          <section>
            <span>4</span>
            <h2>Liability is already covered</h2>
            <p>
              Bill Emerson Good Samaritan Food Donation Act (42 U.S.C. § 1791) plus Georgia
              O.C.G.A. § 51-1-31. Good-faith gifts of apparently wholesome food to a nonprofit are
              shielded except for gross negligence or intentional harm. Recipients at Plenty also
              sign a digital food-responsibility agreement.
            </p>
          </section>
        </div>

        <footer className="brief-foot">
          <div>
            <strong>Give the food to</strong>
            <p>{LEGAL_NAME}</p>
            <p>EIN {EIN} · 501(c)(3)</p>
            <p>Program: Plenty food pantry · Vidalia, Georgia</p>
          </div>
          <div>
            <strong>Start a pickup</strong>
            <p>plenty.unitedundergod.org/for-stores</p>
            <p>plenty.unitedundergod.org/donate</p>
            <p>unitedundergod.org/give/food</p>
          </div>
        </footer>
        <p className="brief-fine">
          Not legal or tax advice. Take this page to your accountant. Enhanced deductions require a
          qualified 501(c)(3) and food used to care for people in need. We record every gift.
        </p>
      </article>
    </main>
  );
}
