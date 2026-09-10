import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantrySafe, getTaxProfile, weNeedList } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Donate to the Vidalia food pantry",
  "Donate food, money, space, or a vehicle to Plenty food pantry in Vidalia, Georgia. Gifts go on a family's table. We record every gift and can issue a year-end receipt when tax-exempt status is posted."
);

export default async function DonatePage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const needs = pantry ? await weNeedList(pantry.id) : [];
  const tax = pantry ? await getTaxProfile(pantry.id) : null;

  return (
    <main className="shell">
      <p className="eyebrow">Give · Vidalia food pantry</p>
      <h1>Your gift becomes groceries</h1>
      <p className="lede">
        Plenty is a food pantry in Vidalia. When you give food, money, a place to store it, or a
        vehicle for pickups, it goes to households who cannot fill a cart this week. We record every
        gift. We do not take a cut for one person's pocket. Food is counted in and counted out.
      </p>

      <div className="grid">
        <article className="card">
          <strong>Food</strong>
          <p>Cans, rice, produce, meat, baby food, diapers. We put it on the shelf and into bags the same week when we can.</p>
        </article>
        <article className="card">
          <strong>Money</strong>
          <p>Buys what we are short on — milk, eggs, protein. A money gift is recorded. We do not charge cards in this app yet; we receive the gift with you and keep a receipt record.</p>
        </article>
        <article className="card">
          <strong>Space or a vehicle</strong>
          <p>A warehouse to hold food, a hall or lot to distribute, a van for pickups. Donated, loaned, leased, rented, or owned by the pantry — we record it so it is not lost in one person's pocket.</p>
        </article>
        <article className="card">
          <strong>Grocery store or warehouse</strong>
          <p>Sales stay. Better write-off than trash. The law covers you.</p>
          <a className="button" href="/for-stores">Four reasons, one page</a>
        </article>
      </div>

      {needs.length ? (
        <section className="panel">
          <p className="eyebrow">Needed on the shelves right now</p>
          <h2>Bring these if you can</h2>
          <div className="chip-row">{needs.map((item) => <span className="chip" key={item.id}>{item.name}</span>)}</div>
        </section>
      ) : (
        <p className="empty">No short list posted this week. Food, money, space, and vehicles are still needed.</p>
      )}

      <p className="note">
        Plenty is a program of United Under God, Inc., a 501(c)(3), EIN 81-3554390. Gifts may be
        tax-deductible to the extent allowed by law. <a href="/tax-exempt">Tax-exempt information</a>
        {" · "}
        <a href="/for-stores/brief">One-page brief for grocery stores</a>
        {tax?.posted && tax.ein ? ". Year-end receipts appear on your account after a money gift is received." : "."}
      </p>

      {!user ? (
        <section className="panel">
          <h2>Create an account to give</h2>
          <p>Donors have accounts so we can thank you, schedule a pickup, and send a year-end receipt when we are able.</p>
          <a className="button primary" href="/sign-in?next=/donate&as=donor">Create an account to donate</a>
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
                  <option value="money">Money (we will contact you to receive it)</option>
                  <option value="space">Space (warehouse or a place to distribute)</option>
                  <option value="vehicle">Vehicle (pickup or delivery)</option>
                </select>
              </label>
              <label className="field">
                <span>If space, what kind</span>
                <select className="input" name="assetKind" defaultValue="">
                  <option value="">Not a building</option>
                  <option value="warehouse">Warehouse / storage</option>
                  <option value="distribution_site">Place to hand out food</option>
                </select>
              </label>
              <label className="field">
                <span>If space or vehicle, how the pantry would have it</span>
                <select className="input" name="tenure" defaultValue="donated">
                  <option value="donated">Donated</option>
                  <option value="loaned">Loaned for pantry use</option>
                  <option value="leased">Leased</option>
                  <option value="rented">Rented</option>
                  <option value="owned">The pantry would own it</option>
                </select>
              </label>
              <label className="field">
                <span>What are you offering</span>
                <input className="input" name="title" required placeholder="Rice, $50 for milk and eggs, a Saturday van…" />
              </label>
              <label className="field">
                <span>Details</span>
                <textarea className="input" name="description" placeholder="How much, what condition, any limits" />
              </label>
              <label className="field">
                <span>Quantity (food) or capacity (vehicle / space)</span>
                <input className="input" name="quantity" />
              </label>
              <label className="field">
                <span>If money, amount in dollars</span>
                <input className="input" name="amountDollars" type="number" min="1" step="1" />
              </label>
              <label className="field">
                <span>When is this available</span>
                <input className="input" name="availableWhen" placeholder="Thursdays after 4, this Saturday, ongoing" />
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
            <h2>Need us to pick up your food donation?</h2>
            <p className="note">Schedule a pickup. A volunteer with a vehicle will come get it.</p>
            <PostForm action="/api/pickups" submitLabel="Request a pickup">
              <input type="hidden" name="kind" value="donation_pickup" />
              <label className="field"><span>Pickup address</span><input className="input" name="address" required /></label>
              <label className="field"><span>When (date and time if you know it)</span><input className="input" type="datetime-local" name="scheduledFor" /></label>
              <label className="field"><span>Phone</span><input className="input" name="contactPhone" /></label>
              <label className="field"><span>What to pick up</span><input className="input" name="notes" /></label>
            </PostForm>
          </section>
        </>
      )}
    </main>
  );
}
