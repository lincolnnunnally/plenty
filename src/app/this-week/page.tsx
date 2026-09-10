import { availableThisWeek, getDefaultPantrySafe } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "This week's food at the Vidalia pantry",
  "See what groceries the Plenty food pantry in Vidalia, Georgia is giving out this week, including photos of items in this week's bags."
);

export default async function ThisWeekPage() {
  const pantry = await getDefaultPantrySafe();
  const available = pantry ? await availableThisWeek(pantry.id) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Vidalia food pantry · this week</p>
      <h1>What you can get this week</h1>
      <p className="lede">
        These are the groceries Plenty is putting in bags and boxes this week. Photos are posted when
        we have them, so you know what to expect before you come.
      </p>
      {pantry?.hours_text ? <p><strong>Hours:</strong> {pantry.hours_text}</p> : <p className="empty">Hours not posted yet.</p>}
      {available.length ? (
        <div className="photo-grid">
          {available.map((item) => (
            <figure className="photo-card" key={item.id}>
              {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="photo-fallback">{item.name.slice(0, 1)}</div>}
              <figcaption>
                <strong>{item.name}</strong>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="empty">This week's food list is not posted yet. Check back, or create an account so we can tell you when it is.</p>
      )}
      <div className="action-row">
        <a className="button primary" href="/need-food">Get food for your family</a>
        <a className="button" href="/donate">Donate something on this list</a>
      </div>
    </main>
  );
}
