import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantrySafe, householdForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function NeedFoodPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const available = pantry ? await availableThisWeek(pantry.id) : [];
  const household = user && pantry ? await householdForUser(pantry.id, user.id) : null;

  return (
    <main className="shell">
      <p className="eyebrow">Neighbors</p>
      <h1>You are welcome here</h1>
      <p className="lede">
        Food is the first practical help — not a test, not a lecture. Register your household so we
        can welcome you by name. A path beyond groceries is always optional.
      </p>

      <div className="grid">
        <article className="card">
          <span>{pantry?.name || "Vidalia Plenty"}</span>
          {pantry?.hours_text ? <p>{pantry.hours_text}</p> : <p className="empty">Hours not posted yet.</p>}
          {pantry?.address ? <p>{pantry.address}</p> : <p className="note">Address not posted yet.</p>}
          <p className="note">Visit style: {(pantry?.visit_style || "walk_in").replace("_", " ")}</p>
        </article>
        <article className="card">
          <span>Available this week</span>
          {available.length ? (
            <ul>{available.map((item) => <li key={item.id}>{item.name}{item.quantity ? ` · ${item.quantity} ${item.unit}` : ""}</li>)}</ul>
          ) : (
            <p className="empty">Nothing listed yet. Come anyway when hours are posted — we will not invent a menu.</p>
          )}
        </article>
      </div>

      {!user ? (
        <section className="panel">
          <h2>Register a household</h2>
          <p>Sign in with your United Under God account (or create one) so we can keep your household with you across the ecosystem.</p>
          <a className="button primary" href="/sign-in?next=/need-food">Sign in to register</a>
        </section>
      ) : (
        <section className="panel">
          <h2>{household ? "Update your household" : "Register your household"}</h2>
          <PostForm action="/api/households" submitLabel={household ? "Save household" : "Register household"}>
            <label className="field">
              <span>Name we should use</span>
              <input className="input" name="displayName" defaultValue={household?.display_name || user.name} required />
            </label>
            <label className="field">
              <span>How many people in the household</span>
              <input className="input" name="householdSize" type="number" min={1} defaultValue={household?.household_size || 1} />
            </label>
            <label className="field">
              <span>Allergies or dietary notes</span>
              <input className="input" name="dietaryNotes" defaultValue={household?.dietary_notes || ""} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" name="phone" defaultValue={household?.phone || ""} />
            </label>
            <label className="field">
              <span>How to reach you</span>
              <select className="input" name="preferredContact" defaultValue={household?.preferred_contact || "in_person"}>
                <option value="in_person">In person at the pantry</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </label>
          </PostForm>
          {household ? (
            <>
              <h3 style={{ marginTop: 24 }}>Check in when you visit</h3>
              <p className="note">Stewards can also check you in at the table. You can check yourself in so the visit is on the record.</p>
              <PostForm action="/api/visits" submitLabel="Check in this visit">
                <input type="hidden" name="householdId" value={household.id} />
                <label className="field">
                  <span>What you received (optional)</span>
                  <input className="input" name="itemsSummary" placeholder="Leave blank if you have not gone through the line yet" />
                </label>
                <label className="field">
                  <span>Anything we should know</span>
                  <input className="input" name="notes" />
                </label>
              </PostForm>
              <p className="note"><a href="/become">When you are ready, write a next step</a> — it is not required for food.</p>
            </>
          ) : null}
        </section>
      )}
    </main>
  );
}
