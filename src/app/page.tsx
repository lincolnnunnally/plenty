import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantry, weNeedList } from "@/lib/db/queries";
import { readLang, t, type MsgKey } from "@/lib/i18n";
import { HOME_DESCRIPTION, pageMeta, serviceJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";


export const dynamic = "force-dynamic";
export const metadata = pageMeta("Plenty Food Pantry — Free Groceries in Vidalia, GA", HOME_DESCRIPTION, "/", { absoluteTitle: true });

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantry().catch(() => null);
  const available = pantry ? await availableThisWeek(pantry.id).catch(() => []) : [];
  const needs = pantry ? await weNeedList(pantry.id).catch(() => []) : [];
  const hours = pantry?.hours_text?.trim();
  const address = pantry?.address?.trim();
  const lang = readLang((await cookies()).get("plenty_lang")?.value);

  const L = (k: MsgKey) => t(lang, k);

  return (
    <main className="home-r">
      <section className="home-hero">
        <img src="/home/hero.jpg" alt={L("homeHeroAlt")} fetchPriority="high" />
        <div className="home-wrap">
          <p className="home-eyebrow">{L("homeEyebrow")}</p>
          <h1>{L("homeTitle")}</h1>
          <p className="home-hero-lede">{L("homeHeroLede")}</p>
          <div className="home-ctas">
            <a className="home-btn" href="/need-food">{L("homeGet")}</a>
            <a className="home-tlink" href="/volunteer">{L("homeOrVolunteer")}</a>
          </div>
          {user ? <p className="home-signed">{L("homeSignedInAs")} {user.name}. <a href="/account">{L("account")}</a></p> : null}
          {hours || address ? (
            <p className="home-signed">
              {hours ? hours : null}
              {hours && address ? " · " : null}
              {address ? `${address}${pantry?.city ? `, ${pantry.city}` : ""}` : null}
            </p>
          ) : null}
        </div>
      </section>

      {available.length ? (
        <section className="home-section home-tight">
          <div className="home-wrap">
            <h2>{L("homeThisWeek")}</h2>
            <div className="chip-row">
              {available.slice(0, 12).map((item) => (
                <span className="chip" key={item.id}>{item.name}</span>
              ))}
            </div>
            <a className="home-btn sm ghost" href="/this-week">{L("homeSeeFood")}</a>
          </div>
        </section>
      ) : null}

      <section className="home-section">
        <div className="home-wrap">
          <p className="home-eyebrow accent">{L("homeWaysEyebrow")}</p>
          <h2>{L("homeWaysTitle")}</h2>
          <p className="home-lead">{L("homeWaysLede")}</p>
          <div className="home-cards">
            <article className="home-card">
              <div className="home-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 8h14l-1.5 12h-11z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg></div>
              <h3>{L("homeCardFoodTitle")}</h3>
              <p>{L("homeCardFoodBody")}</p>
              <a className="home-btn sm" href="/need-food">{L("homeCardFoodCta")}</a>
            </article>
            <article className="home-card g">
              <div className="home-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" /></svg></div>
              <h3>{L("homeCardVolTitle")}</h3>
              <p>{L("homeCardVolBody")}</p>
              <a className="home-btn sm" href="/volunteer">{L("homeCardVolCta")}</a>
            </article>
            <article className="home-card">
              <div className="home-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 9l2-5h14l2 5" /><path d="M4 9h16v11H4z" /><path d="M10 20v-6h4v6" /></svg></div>
              <h3>{L("homeCardStoreTitle")}</h3>
              <p>{L("homeCardStoreBody")}</p>
              <a className="home-btn sm" href="https://unitedundergod.org/food-donors">{L("homeCardStoreCta")}</a>
              <a className="home-btn sm ghost" href="/for-stores">{L("homeCardStorePickup")}</a>
            </article>
            <article className="home-card g">
              <div className="home-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg></div>
              <h3>{L("homeCardGiveTitle")}</h3>
              <p>{L("homeCardGiveBody")}</p>
              <a className="home-btn sm" href="/donate">{L("homeCardGiveCta")}</a>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section paper">
        <div className="home-wrap home-split">
          <img src="/home/pantry.jpg" alt={L("homePantryAlt")} />
          <div>
            <p className="home-eyebrow accent">{L("homeVisitEyebrow")}</p>
            <h2>{L("homeVisitTitle")}</h2>
            <ol className="home-steps">
              <li><b>1</b><span>{L("homeStep1")}</span></li>
              <li><b>2</b><span>{L("homeStep2")}</span></li>
              <li><b>3</b><span>{L("homeStep3")}</span></li>
            </ol>
            <a className="home-btn" href="/need-food">{L("homeGet")}</a>
          </div>
        </div>
      </section>

      {needs.length ? (
        <section className="home-section home-tight">
          <div className="home-wrap">
            <h2>{L("homeWeCouldUse")}</h2>
            <div className="chip-row">
              {needs.map((item) => (
                <span className="chip" key={item.id}>{item.name}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-section home-band">
        <div className="home-wrap home-split">
          <div>
            <p className="home-eyebrow">{L("homeBandEyebrow")}</p>
            <h2>{L("homeBandTitle")}</h2>
            <p className="home-lead">{L("homeBandLede")}</p>
            <a className="home-btn" href="/volunteer">{L("homeCardVolCta")}</a>
          </div>
          <img src="/home/mission.jpg" alt={L("homeBandAlt")} />
        </div>
      </section>

      <JsonLd
        data={{
          ...serviceJsonLd({
            name: "Free groceries at Plenty food pantry",
            description: HOME_DESCRIPTION,
            path: "/",
            serviceType: "Food pantry",
            audience: "Anyone in Vidalia who needs groceries",
            free: true
          }),
          // Only what a steward has typed in: never a guessed address.
          ...(address
            ? {
                availableChannel: {
                  "@type": "ServiceChannel",
                  serviceLocation: {
                    "@type": "Place",
                    name: pantry?.name || "Plenty food pantry",
                    address: {
                      "@type": "PostalAddress",
                      streetAddress: address,
                      addressLocality: pantry?.city || undefined,
                      addressRegion: pantry?.state || undefined,
                      postalCode: pantry?.zip || undefined
                    }
                  }
                }
              }
            : {})
        }}
      />
    </main>
  );
}
