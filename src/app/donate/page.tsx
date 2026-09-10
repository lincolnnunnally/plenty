import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantrySafe, weNeedList } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const needs = pantry ? await weNeedList(pantry.id) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Give</p>
      <h1>Food, money, space, or a vehicle</h1>
      <p className="lede">
        A pantry runs on more than cans. We need groceries, a place to set up, rides to pick food up,
        and money to fill gaps. We do not take card payments in this app yet — a money gift is a
        pledge a steward will receive with you.
      </p>

      {needs.length ? (
        <section className="panel">
          <p className="eyebrow">We need right now</p>
          <div className="chip-row">{needs.map((item) => <span className="chip" key={item.id}>{item.name}</span>)}</div>
        </section>
      ) : (
        <p className="empty">No specific items listed yet. Food, space, vehicles, and money pledges are still welcome.</p>
      )}

      {!user ? (
        <section className="panel">
          <a className="button primary" href="/sign-in?next=/donate">Sign in to offer a gift</a>
        </section>
      ) : (
        <section className="panel">
          <h2>Make an offer</h2>
          <PostForm action="/api/donations" submitLabel="Send this offer">
            <label className="field">
              <span>Kind of gift</span>
              <select className="input" name="kind" defaultValue="food" required>
                <option value="food">Food</option>
                <option value="money">Money (pledge — we will contact you)</option>
                <option value="space">Space (storage or a place to distribute)</option>
                <option value="vehicle">Vehicle (pickup or delivery)</option>
              </select>
            </label>
            <label className="field">
              <span>What are you offering</span>
              <input className="input" name="title" required placeholder="Rice, a Saturday van, a garage bay…" />
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
              <span>If money, amount in dollars (pledge only)</span>
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
      )}
    </main>
  );
}
