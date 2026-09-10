import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantry, weNeedList } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantry().catch(() => null);
  const available = pantry ? await availableThisWeek(pantry.id).catch(() => []) : [];
  const needs = pantry ? await weNeedList(pantry.id).catch(() => []) : [];
  const hours = pantry?.hours_text?.trim();
  const address = pantry?.address?.trim();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">{pantry ? `${pantry.city}${pantry.state ? ", " + pantry.state : ""}` : "Vidalia, Georgia"}</p>
        <h1>Come for groceries. Leave with a next step.</h1>
        <p className="lede">
          Plenty is a food pantry — and a place to become who you want to be. Food is never a test.
          A path is always offered, never required.
        </p>
        <div className="action-row">
          <a className="button primary" href="/need-food">I need food</a>
          <a className="button leaf" href="/volunteer">I can help</a>
          <a className="button" href="/donate">I can give</a>
          <a className="button" href="/run">I run this pantry</a>
        </div>
        <p className="note">
          {user ? `Signed in as ${user.name}.` : "Browse hours and shelves without an account. Sign in when you are ready to visit, volunteer, or give."}
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span>This week</span>
          <h2>{hours ? "Hours" : "Hours not posted yet"}</h2>
          {hours ? <p>{hours}</p> : <p className="empty">We will not invent open hours. A steward will post them here when they are real.</p>}
          {address ? <p>{address}{pantry?.city ? ` · ${pantry.city}, ${pantry.state} ${pantry.zip}` : ""}</p> : <p className="note">Street address not posted yet.</p>}
          <a className="button" href={pantry ? `/p/${pantry.slug}` : "/p/vidalia"}>Open the pantry page</a>
        </article>
        <article className="card">
          <span>On the shelves</span>
          <h2>{available.length ? "What neighbors can expect" : "Shelves are being stocked"}</h2>
          {available.length ? (
            <ul>
              {available.slice(0, 8).map((item) => (
                <li key={item.id}>{item.name}{item.quantity > 0 ? ` · ${item.quantity} ${item.unit}` : ""}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing listed as available this week. That is an honest empty shelf, not a demo list.</p>
          )}
          <a className="button" href="/need-food">See more</a>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Four doors</p>
        <h2>Everyone has a place at this table</h2>
        <div className="grid four">
          <article className="card">
            <strong>Neighbors</strong>
            <p>Register a household, see what is here this week, check in when you come. Dignity first.</p>
          </article>
          <article className="card">
            <strong>Volunteers</strong>
            <p>Pickup, setup, serve, delivery. Bring a vehicle if you have one. We will show you.</p>
          </article>
          <article className="card">
            <strong>Donors</strong>
            <p>Food, money, space, and vehicles. Money is a pledge we receive in person — we do not charge cards here yet.</p>
          </article>
          <article className="card">
            <strong>A path</strong>
            <p>Name what is hard. Name who you want to become. Take one next step. Then, when you are ready, help someone else.</p>
          </article>
        </div>
      </section>

      {needs.length ? (
        <section className="panel">
          <p className="eyebrow">We need</p>
          <h2>If you can bring something</h2>
          <div className="chip-row">
            {needs.map((item) => (
              <span className="chip" key={item.id}>{item.name}</span>
            ))}
          </div>
          <a className="button primary" href="/donate">Offer food, money, space, or a vehicle</a>
        </section>
      ) : null}
    </main>
  );
}
