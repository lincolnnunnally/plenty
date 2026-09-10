import { PostForm } from "@/components/post-form";
import { PrintButton } from "@/components/print-button";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Donating unsold food is better business than throwing it away",
  "You benefit and you are protected. That’s why Publix, Kroger, Walmart, and Costco donate. Plenty is a program of United Under God, Inc., EIN 81-3554390."
);

const WINS = [
  { n: "1", title: "Your sales stay", line: "Pantry families were not filling a cart at full price. What they still buy, they buy from you." },
  { n: "2", title: "Better than throwing it away", line: "501(c)(3) food gift: cost plus half the unsold profit. Paid $200, would sell $300 → trash ≈ $200, donate ≈ $250." },
  { n: "3", title: "Trash costs you money", line: "Dumpster fees add up. Donation is often cheaper — and it clears space for food that actually sells." },
  { n: "4", title: "You are covered", line: "Federal + Georgia Good Samaritan law. Recipients sign a waiver. We record the gift and pick up." }
] as const;

export default function ForStoresPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Grocery stores · warehouses · farms</p>
      <h1 className="store-pop">Donating unsold food is better business than throwing it away</h1>
      <p className="lede">You benefit. You are protected. That’s why Publix, Kroger, Walmart, and Costco already do it.</p>
      <p className="brief-ein">EIN {EIN} · {LEGAL_NAME} · 501(c)(3) · Plenty is our pantry program</p>

      <div className="brief-grid" style={{ marginTop: 20 }}>
        {WINS.map((w) => (
          <section key={w.n}>
            <span>{w.n}</span>
            <h2>{w.title}</h2>
            <p>{w.line}</p>
          </section>
        ))}
      </div>

      <section className="panel" id="in-store">
        <h2>Want them walking your aisles?</h2>
        <p className="lede" style={{ fontSize: "1.05rem" }}>
          Two ways to give unsold food. Extra spend is never required.
        </p>
        <div className="brief-grid" style={{ marginTop: 14 }}>
          <section>
            <span>A</span>
            <h2>We pick it up</h2>
            <p>Your dock. Our van. Receipt to you. Families never enter the store.</p>
          </section>
          <section>
            <span>B</span>
            <h2>They come to you</h2>
            <p>You donate on paper. We print a Plenty card. They collect a hold at customer service.</p>
          </section>
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          People who walk in tend to spend the money they saved — milk, soap, a birthday cake. That is proximity, not a condition. Federal Good Samaritan law still covers a good-faith gift, including food given straight to a family.
        </p>
        <div className="action-row">
          <a className="button primary" href="/donate">We’ll pick it up</a>
          <a className="button leaf" href="#store-yes">We’ll send families in</a>
        </div>
      </section>

      <section className="panel" id="store-yes">
        <h2>Yes — hold food for Plenty families</h2>
        <p className="note">A pantry admin will call you. Default is a bag at customer service, not a mystery cart. Buying anything else is never required.</p>
        <PostForm action="/api/store-partners" submitLabel="Ask us to set this up">
          <input type="hidden" name="asInterest" value="1" />
          <input type="hidden" name="pickupMode" value="hold_desk" />
          <label className="field"><span>Store name</span><input className="input" name="name" required /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <label className="field"><span>Manager name</span><input className="input" name="contactName" required /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" required /></label>
          <label className="field"><span>Email</span><input className="input" name="contactEmail" type="email" /></label>
          <label className="field"><span>Hours they could collect</span><input className="input" name="hoursText" placeholder="Weekdays after 2…" /></label>
        </PostForm>
      </section>

      <div className="action-row">
        <a className="button primary" href="/donate">We’ll pick it up</a>
        <a className="button leaf" href="/for-stores/brief">Print the one-pager</a>
        <PrintButton label="Print this page" />
      </div>
      <p className="note">
        The printed one-pager has a QR a manager can scan later to book a pickup. Statutes for your accountant:{" "}
        <a href="https://www.law.cornell.edu/uscode/text/42/1791" target="_blank" rel="noopener noreferrer">42 U.S.C. § 1791</a>
        {" · "}
        <a href="https://law.justia.com/codes/georgia/title-51/chapter-1/section-51-1-31/" target="_blank" rel="noopener noreferrer">Georgia § 51-1-31</a>
        {" · "}
        <a href="/tax-exempt">EIN</a>
        {" · "}
        <a href="/waiver">Recipient waiver</a>
      </p>
    </main>
  );
}
