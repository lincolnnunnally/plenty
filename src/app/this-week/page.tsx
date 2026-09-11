import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantrySafe, isSteward } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "This week's food at the Vidalia pantry",
  "See what groceries the Plenty food pantry in Vidalia, Georgia is giving out this week, including photos of items in this week's bags."
);

export default async function ThisWeekPage() {
  const pantry = await getDefaultPantrySafe();
  const user = await getCurrentUser().catch(() => null);
  const steward = pantry && user ? await isSteward(pantry.id, user.id, user.email).catch(() => false) : false;
  const available = pantry ? await availableThisWeek(pantry.id).catch(() => []) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Vidalia food pantry · this week</p>
      <h1>What you can get this week</h1>
      <p className="lede">What is going in bags this week.</p>
      {pantry?.hours_text ? <p className="note">{pantry.hours_text}{pantry.address ? ` · ${pantry.address}` : ""}</p> : null}
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
        <p className="empty">This week's list is not up yet.</p>
      )}
      <div className="action-row">
        <a className="button primary" href="/need-food">Get food for your family</a>
        <a className="button" href="/donate">Donate something on this list</a>
        {steward && pantry ? (
          <PostForm action="/api/invites" submitLabel="Text neighbors this list">
            <input type="hidden" name="kind" value="this_week" />
            <input type="hidden" name="placeId" value="hub" />
            <input type="hidden" name="audience" value="all" />
          </PostForm>
        ) : null}
      </div>
    </main>
  );
}
