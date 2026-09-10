import { cookies } from "next/headers";
import { GiveCardForm } from "@/components/give-card";
import { PayBoard } from "@/components/pay-board";
import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { effectivePayMethods, getDefaultPantrySafe, getTaxProfile, openOpsNeeds, weNeedList } from "@/lib/db/queries";
import { readLang, t } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { stripeConfigured } from "@/lib/stripe-give";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Give to the Vidalia food pantry",
  "Give by card, Cash App, Venmo, or Zelle. Groceries stay free. Money pays pickup and the line. Grocery stores: leftover food is better business than the dumpster."
);

export default async function DonatePage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const needs = pantry ? await weNeedList(pantry.id) : [];
  const tax = pantry ? await getTaxProfile(pantry.id) : null;
  const opsNeeds = pantry ? await openOpsNeeds(pantry.id).catch(() => []) : [];
  const pay = pantry ? await effectivePayMethods(pantry).catch(() => []) : [];
  const cardLive = await stripeConfigured();
  const lang = readLang((await cookies()).get("plenty_lang")?.value);

  return (
    <main className="shell">
      <p className="eyebrow">{t(lang, "giveTitle")}</p>
      <h1>Food is free. Handling still costs.</h1>
      <p className="lede">{t(lang, "giveLede")}</p>

      <article className="card" style={{ marginTop: 18 }}>
        <span>Grocery stores</span>
        <strong>Throwing food away is the expensive option.</strong>
        <p>Tax deduction. Two legal shields. A weekly dock pickup. We route it to whoever can use it first.</p>
        <a className="button primary" href="/for-stores">Set a weekly pickup</a>
      </article>

      <div className="grid">
        <article className="card">
          <strong>Money</strong>
          <p>Pays pickup, routing, and the line — not a charge for groceries.</p>
        </article>
        <article className="card">
          <strong>Food</strong>
          <p>Cans, rice, produce, meat. We put it out the same week when we can.</p>
        </article>
        <article className="card">
          <strong>Space or a vehicle</strong>
          <p>A freezer, a hall, a van. Donated or loaned. We record it.</p>
        </article>
      </div>

      {cancelled ? <p className="note error" role="status">Card checkout was cancelled. Nothing was charged.</p> : null}

      <section className="panel">
        <h2>Pay how you already pay</h2>
        {cardLive ? (
          <GiveCardForm signedInEmail={user?.email} pantrySlug={pantry?.slug} />
        ) : (
          <p className="empty">Card is not live on this host yet. Use Cash App, Venmo, or Zelle if posted.</p>
        )}
        <h3 style={{ marginTop: 24 }}>Scan to send</h3>
        <PayBoard methods={pay} />
      </section>

      {opsNeeds.length ? (
        <section className="panel">
          <h2>Space and equipment</h2>
          <div className="chip-row">{opsNeeds.map((item) => <span className="chip" key={item.id}>{item.title}</span>)}</div>
        </section>
      ) : null}

      {needs.length ? (
        <section className="panel">
          <h2>Short on the shelves</h2>
          <div className="chip-row">{needs.map((item) => <span className="chip" key={item.id}>{item.name}</span>)}</div>
        </section>
      ) : null}

      <p className="note">
        Plenty is a program of United Under God, Inc., a 501(c)(3), EIN 81-3554390.{" "}
        <a href="/tax-exempt">Tax-exempt information</a>
        {" · "}
        <a href="/for-stores/brief">One-page brief for stores</a>
        {tax?.posted && tax.ein ? ". Year-end receipts appear on your account." : "."}
      </p>

      {!user ? (
        <section className="panel">
          <h2>Need a receipt?</h2>
          <a className="button primary" href="/sign-in?next=/donate&as=donor">Create an account</a>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Offer a gift</h2>
            <PostForm action="/api/donations" submitLabel="Send this offer">
              <label className="field">
                <span>Kind of gift</span>
                <select className="input" name="kind" defaultValue="food" required>
                  <option value="food">Food</option>
                  <option value="money">Money</option>
                  <option value="space">Space</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment</option>
                </select>
              </label>
              <label className="field">
                <span>If space or equipment</span>
                <select className="input" name="assetKind" defaultValue="">
                  <option value="">Not a building or equipment</option>
                  <option value="warehouse">Warehouse / storage</option>
                  <option value="distribution_site">Place to hand out food</option>
                  <option value="freezer">Freezer</option>
                  <option value="cooler">Cooler / refrigerator</option>
                  <option value="shelves">Shelves</option>
                  <option value="pallets">Pallets / carts</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="field">
                <span>How the pantry would have it</span>
                <select className="input" name="tenure" defaultValue="donated">
                  <option value="donated">Donated</option>
                  <option value="loaned">Loaned</option>
                  <option value="leased">Leased</option>
                  <option value="rented">Rented</option>
                  <option value="owned">The pantry would own it</option>
                </select>
              </label>
              <label className="field">
                <span>What are you offering</span>
                <input className="input" name="title" required placeholder="Rice, $50, a Saturday van…" />
              </label>
              <label className="field">
                <span>Details</span>
                <textarea className="input" name="description" />
              </label>
              <label className="field">
                <span>Quantity or amount in dollars</span>
                <input className="input" name="quantity" />
              </label>
              <label className="field">
                <span>If money, amount in dollars</span>
                <input className="input" name="amountDollars" type="number" min="1" step="1" />
              </label>
              <label className="field">
                <span>When is this available</span>
                <input className="input" name="availableWhen" />
              </label>
              <label className="field">
                <span>Name</span>
                <input className="input" name="contactName" defaultValue={user.name} />
              </label>
              <label className="field">
                <span>Phone</span>
                <input className="input" name="contactPhone" />
              </label>
            </PostForm>
          </section>
          <section className="panel">
            <h2>Need a pickup?</h2>
            <PostForm action="/api/pickups" submitLabel="Request a pickup">
              <input type="hidden" name="kind" value="donation_pickup" />
              <label className="field"><span>Pickup address</span><input className="input" name="address" required /></label>
              <label className="field"><span>When</span><input className="input" type="datetime-local" name="scheduledFor" /></label>
              <label className="field"><span>Phone</span><input className="input" name="contactPhone" /></label>
              <label className="field"><span>What to pick up</span><input className="input" name="notes" /></label>
            </PostForm>
          </section>
        </>
      )}
    </main>
  );
}
