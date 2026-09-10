import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantry, listedAllies, weNeedList } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";
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
  const withPhotos = available.filter((item) => item.image_url);
  const nearby = pantry ? await listedAllies(pantry.id).catch(() => []) : [];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Food pantry · Vidalia, Georgia</p>
        <h1>Need groceries for your family? This food is for everyone.</h1>
        <p className="lede">
          Plenty is a food pantry in Vidalia. There is no income test. You know your household better
          than a form does. Stores give more food than we can let spoil — take what you will use, share
          what you will not. Come through the line, or ask us to bring it if you cannot get here.
        </p>
        <div className="action-row">
          <a className="button primary" href="/need-food">I need food</a>
          <a className="button" href="/need-food">I need a delivery</a>
          <a className="button leaf" href="/volunteer">I can volunteer</a>
          <a className="button" href="/donate">I can donate</a>
        </div>
        <p className="note">
          {user
            ? `Signed in as ${user.name}.`
            : "You can read hours and this week's food without an account. Create a free account when you are ready to pick up food, volunteer, or give."}
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span>When and where</span>
          <h2>{hours ? "Open hours" : "Hours will be posted here"}</h2>
          {hours ? <p>{hours}</p> : <p className="empty">We will not invent hours. When the pantry is open, the day and time will be on this page.</p>}
          {address ? <p>{address}{pantry?.city ? ` · ${pantry.city}, ${pantry.state} ${pantry.zip}` : ""}</p> : <p className="note">Street address not posted yet.</p>}
          {pantry?.slug ? <p className="note">Share this pantry: <a href={`/p/${pantry.slug}`}>{pantryPublicUrl(pantry.slug)}</a></p> : null}
          <a className="button" href="/this-week">See this week's food</a>
        </article>
        <article className="card">
          <span>What you can get</span>
          <h2>{available.length ? "Groceries this week" : "We are stocking the shelves"}</h2>
          {available.length ? (
            <ul>
              {available.slice(0, 8).map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">No items listed this week yet. When we have food ready, photos and names will show here.</p>
          )}
          <a className="button" href="/need-food">Get food for your family</a>
        </article>
      </section>

      {withPhotos.length ? (
        <section className="panel">
          <p className="eyebrow">This week's boxes</p>
          <h2>Pictures of food you can receive</h2>
          <div className="photo-grid">
            {withPhotos.map((item) => (
              <figure className="photo-card" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <figcaption>{item.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <p className="eyebrow">How you can take part</p>
        <h2>Get food. Volunteer. Give.</h2>
        <div className="grid">
          <article className="card">
            <strong>If you need groceries</strong>
            <p>No income requirement. Register, come through the line, or ask for a delivery. Stretch a dollar. Share extras.</p>
            <a className="button primary" href="/need-food">Get food</a>
          </article>
          <article className="card">
            <strong>If you can help at the pantry</strong>
            <p>Pick up donated food, set up tables, hand out groceries, or drive a delivery. We will show you.</p>
            <a className="button" href="/volunteer">Volunteer in Vidalia</a>
          </article>
          <article className="card">
            <strong>If you can give</strong>
            <p>Food, money, a freezer, a storage space, or a vehicle. Every gift is recorded and put on a family's table — not in one person's pocket.</p>
            <a className="button" href="/donate">Donate</a>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Toombs County</p>
        <h2>We are meeting the pantries already here</h2>
        <p>
          United Under God means we show up as support, not as a takeover. We meet people where the
          opportunity is — a pantry that asked, a store that chose how to give. If they are happy as they are, Plenty does its own thing.
        </p>
        {nearby.filter((a) => a.kind === "pantry").length ? (
          <p className="note">{nearby.filter((a) => a.kind === "pantry").length} pantry(ies) confirmed for neighbors. <a href="/around">See them</a>.</p>
        ) : (
          <p className="empty">No other pantry is listed yet — we will not post hours we have not confirmed. The visit list is on the pantry desk.</p>
        )}
        <a className="button" href="/around">Around Vidalia and Lyons</a>
      </section>

      {needs.length ? (
        <section className="panel">
          <p className="eyebrow">What we need from donors</p>
          <h2>Bring these if you can</h2>
          <div className="chip-row">
            {needs.map((item) => (
              <span className="chip" key={item.id}>{item.name}</span>
            ))}
          </div>
          <a className="button primary" href="/donate">Give food or money</a>
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
