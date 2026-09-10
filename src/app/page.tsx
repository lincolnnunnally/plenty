import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantry, weNeedList } from "@/lib/db/queries";
import { HOME_DESCRIPTION, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("Vidalia food pantry", HOME_DESCRIPTION);

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
        <p className="eyebrow">Vidalia food pantry</p>
        <h1>Need groceries? Come get them.</h1>
        <p className="lede">Free food. No income test. Volunteer or give leftover food if you can.</p>
        <div className="action-row">
          <a className="button primary" href="/need-food">Get food</a>
          <a className="button leaf" href="/volunteer">Volunteer</a>
          <a className="button" href="/for-stores">Grocery stores</a>
        </div>
        {user ? <p className="note">Signed in as {user.name}. <a href="/account">Account</a></p> : null}
      </section>

      {hours || address ? (
        <p className="note" style={{ marginTop: 18 }}>
          {hours ? hours : null}
          {hours && address ? " · " : null}
          {address ? `${address}${pantry?.city ? `, ${pantry.city}` : ""}` : null}
        </p>
      ) : null}

      {available.length ? (
        <section className="panel">
          <h2>This week</h2>
          <div className="chip-row">
            {available.slice(0, 12).map((item) => (
              <span className="chip" key={item.id}>{item.name}</span>
            ))}
          </div>
          <a className="button" href="/this-week">See the food</a>
        </section>
      ) : null}

      <div className="grid">
        <article className="card">
          <strong>Get food</strong>
          <p>Register your household. We scan your pass at the line. Handling donation requested — never required.</p>
          <a className="button primary" href="/need-food">Register / pick up</a>
        </article>
        <article className="card">
          <strong>Volunteer</strong>
          <p>Pick up at stores, set the line, serve, or deliver. Repeating store pickups land on the board and we text you.</p>
          <a className="button" href="/volunteer">Take a shift</a>
        </article>
        <article className="card">
          <strong>Grocery stores</strong>
          <p>Tax deduction. Two legal shields. A weekly dock pickup. We route food to whoever can use it first.</p>
          <a className="button" href="/for-stores">Set a pickup</a>
        </article>
        <article className="card">
          <strong>Give money or space</strong>
          <p>Card, Cash App, Venmo, Zelle. Pays pickup and the line — not a charge for groceries.</p>
          <a className="button" href="/donate">Give</a>
        </article>
      </div>

      {needs.length ? (
        <section className="panel">
          <h2>We could use</h2>
          <div className="chip-row">
            {needs.map((item) => (
              <span className="chip" key={item.id}>{item.name}</span>
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FoodEstablishment",
            name: pantry?.name || "Plenty food pantry",
            description: HOME_DESCRIPTION,
            url: "https://plenty.unitedundergod.org/",
            address: {
              "@type": "PostalAddress",
              addressLocality: pantry?.city || "Vidalia",
              addressRegion: pantry?.state || "GA",
              postalCode: pantry?.zip || "30474",
              streetAddress: pantry?.address || undefined
            },
            openingHours: hours || undefined
          })
        }}
      />
    </main>
  );
}
