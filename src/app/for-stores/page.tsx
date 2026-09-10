import { EIN, LEGAL_NAME, TAX_LINE } from "@/lib/legal/org";
import { getDefaultPantrySafe } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Grocery stores: donate surplus food without the lawsuit fear",
  "Federal Good Samaritan law and Georgia law protect grocery stores that donate apparently wholesome food in good faith. Donating unsold food can also beat throwing it away on taxes. Plenty records gifts and recipient waivers in Vidalia."
);

export default async function ForStoresPage() {
  const pantry = await getDefaultPantrySafe();
  const publicUrl = pantry ? pantryPublicUrl(pantry.slug) : "https://plenty.unitedundergod.org/p/vidalia";

  return (
    <main className="shell">
      <p className="eyebrow">For grocery stores, warehouses, and farms</p>
      <h1>Donating leftover food is protected — and it is often better business than throwing it away</h1>
      <p className="lede">
        Kroger, Publix, Walmart, and Costco donate unsold food because the law, the tax code, and
        the trash bill all point the same way. A small store in Vidalia can use the same federal
        rules. This page is for the owner who is afraid of a lawsuit, afraid of losing sales, or
        unsure the paperwork is worth it.
      </p>
      <p className="brief-ein">{TAX_LINE} A gift of food to Plenty is a gift to {LEGAL_NAME}.</p>
      <p className="note">
        Print the one-page leave-behind: <a href="/for-stores/brief">plenty.unitedundergod.org/for-stores/brief</a>.
        This is not legal or tax advice. Take it to your accountant. Links below go to the statute and USDA.
      </p>

      <section className="panel">
        <h2>Liability: the food you donate does not come back to harm you</h2>
        <p>
          The law you are thinking of is the <strong>Bill Emerson Good Samaritan Food Donation Act</strong>
          {" "}(42 U.S.C. § 1791), passed in 1996 and strengthened in 2023. It is federal. It covers
          grocery stores, wholesalers, restaurants, farms, and the nonprofit that hands the food out.
        </p>
        <p>If you donate <em>apparently wholesome</em> food in good faith to a nonprofit for people who need it, at no charge (or at a handling-cost “Good Samaritan reduced price”), you are not civilly or criminally liable because of the food’s nature, age, packaging, or condition. The pantry is protected the same way.</p>
        <p>The exception is real and narrow: <strong>gross negligence or intentional misconduct</strong> — knowing the food was likely to hurt someone and giving it anyway. Ordinary donated surplus is what the Act was written to cover. Harvard’s Food Law and Policy Clinic notes that the lawsuit risk was already very low; they report no court case to date on food-donation liability under this Act.</p>
        <p>
          Georgia adds its own shield: <strong>O.C.G.A. § 51-1-31</strong>. A good-faith donor of canned or
          perishable food that looks fit to eat, given to a bona fide charity, is not open to criminal
          penalty or civil damages from the condition of the food unless the injury came from recklessness
          or intentional misconduct. The charity that receives it has the same protection.
        </p>
        <p>
          Plenty also has each household sign a <a href="/waiver">food responsibility agreement</a> before
          they take food: they take it as-is, they handle how it is stored and eaten, and they do not
          come after the store or the pantry if someone later gets sick, except where the law does not
          allow that kind of release. That is an extra record. It does not replace the Emerson Act. It
          is how we show a store we are serious.
        </p>
        <p className="note">
          Read the statute: <a href="https://www.law.cornell.edu/uscode/text/42/1791" target="_blank" rel="noopener noreferrer">42 U.S.C. § 1791</a>
          {" · "}
          <a href="https://www.usda.gov/about-food/food-safety/food-loss-and-waste/donating" target="_blank" rel="noopener noreferrer">USDA on donating</a>
          {" · "}
          <a href="https://law.justia.com/codes/georgia/title-51/chapter-1/section-51-1-31/" target="_blank" rel="noopener noreferrer">Georgia § 51-1-31</a>
        </p>
      </section>

      <section className="panel">
        <h2>Will pantries steal your paying customers?</h2>
        <p>
          That is a fair question. A Central Texas study of pantry locations and grocer sales
          (agricultural economists using store revenue data) found <strong>no significant effect</strong> of
          nearby pantries on retailer revenue. People who rely on a pantry generally could not have
          paid grocery prices that week. The pantry is not a competing aisle.
        </p>
        <p>
          A nationwide look at pantry openings (using IRS charity data plus Nielsen grocery sales)
          found households may spend a little less on a few pantry-like items (about 1.8% of food
          spending), but <strong>aggregate store sales did not fall</strong>.
        </p>
        <p>
          Research on the stores that <em>do</em> donate (Lowrey and co-authors, <em>European Review of Agricultural Economics</em>)
          found something the big chains already act on: pulling near-date perishables off the shelf
          and donating them, then restocking with fresher product, is associated with <strong>higher markups</strong>
          (on the order of a 33% markup premium versus non-donating stores in that study). A simulation
          in the same line of work estimated that raising donation volume by 50% could lift profit
          around 9%. Donating is not “losing a sale of a spotted banana.” It is clearing space for
          fruit someone will pay full price for, and avoiding the discount bin that trains shoppers to
          wait for ugly produce.
        </p>
        <p>
          Throwing food away also costs money. Studies of retail surplus find donation handling is
          often cheaper per pound than disposal. The “sale you might have made” is usually a sale that
          was not going to happen at full price.
        </p>
      </section>

      <section className="panel">
        <h2>The tax reason the big stores donate</h2>
        <p>
          Throwing unsold inventory in the dumpster generally lets a business deduct what it paid
          (its cost, or “basis”). Donating the same wholesome food to a qualified 501(c)(3) that feeds
          people in need can qualify for the <strong>enhanced deduction</strong> under Internal Revenue Code
          {" "}§ 170(e)(3)(C). USDA summarizes it this way: you may deduct the cost plus half the
          difference between cost and fair-market value, not more than twice the cost, with a cap
          around 15% of that business’s income for the year. Congress made this permanent for C-corps,
          S-corps, LLCs, partnerships, and sole proprietors in the 2015 PATH Act.
        </p>
        <p>
          Worked example used in tax guidance: food that cost $200 and would sell for $300. Toss it,
          and the write-off is about $200. Donate it under the enhanced rule, and the deduction can be
          about $250 — cost plus half the $100 you will never ring up. That is why dumping and donating
          are not equal on a tax return.
        </p>
        <p>
          Plenty is a program of <strong>{LEGAL_NAME}</strong>, a 501(c)(3), EIN <strong>{EIN}</strong>.
          A food gift to this pantry is a gift to that organization. See <a href="/tax-exempt">tax-exempt information</a>.
          After we mark a gift received, it can go on a receipt for your books. Your CPA still applies § 170(e)(3) to your return.
        </p>
        <p className="note">
          IRS: <a href="https://www.irs.gov/publications/p526" target="_blank" rel="noopener noreferrer">Publication 526 (charitable contributions)</a>
          {" · "}
          <a href="https://www.usda.gov/about-food/food-safety/food-loss-and-waste/donating" target="_blank" rel="noopener noreferrer">USDA enhanced deduction summary</a>
        </p>
      </section>

      <section className="panel">
        <h2>Why Publix, Kroger, Walmart, and Costco do this</h2>
        <p>It is not only goodwill — though goodwill is real. The large chains donate because:</p>
        <ul>
          <li>Federal and state law cap the lawsuit risk when they donate in good faith.</li>
          <li>The enhanced deduction can beat a dumpster write-off.</li>
          <li>Disposal fees and labor are real costs; donation is often cheaper than waste.</li>
          <li>Clearing tired perishables keeps the selling floor looking like a store people will pay for (the Lowrey research).</li>
          <li>Feeding America reports that a large share of food-bank supply already comes from retailers.</li>
        </ul>
        <p>
          A independent grocer in Vidalia is under the same Emerson Act and the same § 170(e)(3)
          rules as a Kroger. The gap is usually knowledge and a pantry that will pick up on a schedule,
          give a receipt, and keep a waiver file. That is what Plenty is for.
        </p>
      </section>

      <section className="panel">
        <h2>What Plenty does so you are not on an island</h2>
        <div className="grid">
          <article className="card">
            <strong>We record the gift</strong>
            <p>Food in, food out. Your donation is not a box that vanished into someone’s trunk.</p>
          </article>
          <article className="card">
            <strong>Recipients sign a waiver</strong>
            <p>Digital agreement, dated, named, versioned. QR at the line. Same text every household sees.</p>
          </article>
          <article className="card">
            <strong>We will pick up</strong>
            <p>Ask for a donation pickup. A volunteer with a vehicle comes to you.</p>
          </article>
          <article className="card">
            <strong>Public pantry page</strong>
            <p><a href={publicUrl}>{publicUrl}</a> — hours and this week’s food, no invented stock.</p>
          </article>
        </div>
        <img src={`/api/promote/qr?to=${encodeURIComponent("https://plenty.unitedundergod.org/for-stores")}&format=png&size=280`} alt="QR code for this page" width={140} height={140} />
        <div className="action-row">
          <a className="button primary" href="/donate">Offer a food donation</a>
          <a className="button leaf" href="/sign-in?next=/donate&as=donor">Create a donor account</a>
          <a className="button" href="/waiver">See the recipient waiver</a>
        </div>
      </section>
    </main>
  );
}
