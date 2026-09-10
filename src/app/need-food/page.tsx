import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { availableThisWeek, getDefaultPantrySafe, householdForUser } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Get free groceries in Vidalia",
  "Plenty is a food pantry in Vidalia, Georgia. If you are having a hard time feeding your family, register your household and pick up free groceries. No income test at the door."
);

export default async function NeedFoodPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const available = pantry ? await availableThisWeek(pantry.id) : [];
  const household = user && pantry ? await householdForUser(pantry.id, user.id) : null;
  const photos = available.filter((item) => item.image_url);

  return (
    <main className="shell">
      <p className="eyebrow">Vidalia food pantry</p>
      <h1>Get food for your family</h1>
      <p className="lede">
        This is a food pantry. If you live in or near Vidalia, Georgia and you are having a hard time
        buying groceries, you can get free food here. We pack bags and boxes of real food — rice,
        produce, protein, and household staples when we have them — so your household can eat this week.
      </p>

      <div className="grid">
        <article className="card">
          <span>Hours and place</span>
          <h2>{pantry?.name || "Plenty food pantry"}</h2>
          {pantry?.hours_text ? <p>{pantry.hours_text}</p> : <p className="empty">Open hours will be posted here. We will not invent them.</p>}
          {pantry?.address ? <p>{pantry.address}{pantry.city ? `, ${pantry.city}, ${pantry.state} ${pantry.zip}` : ""}</p> : <p className="note">Address will be posted when it is set.</p>}
          <p className="note">How visits work: {(pantry?.visit_style || "walk_in").replace("_", " ")}</p>
          {pantry?.slug ? (
            <p className="note">Public page: <a href={`/p/${pantry.slug}`}>{pantryPublicUrl(pantry.slug)}</a></p>
          ) : null}
        </article>
        <article className="card">
          <span>What you can get this week</span>
          {available.length ? (
            <ul>{available.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          ) : (
            <p className="empty">The week's food list is not posted yet. When it is, you will see names and pictures here.</p>
          )}
          <a className="button" href="/this-week">See pictures of this week's food</a>
        </article>
      </div>

      {photos.length ? (
        <section className="panel">
          <h2>Pictures of this week's groceries</h2>
          <div className="photo-grid">
            {photos.map((item) => (
              <figure className="photo-card" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <figcaption>{item.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {!user ? (
        <section className="panel">
          <h2>Create a free account to pick up food</h2>
          <p>
            Everyone who uses the pantry — families getting food, volunteers, and donors — creates an
            account so we can welcome you by name and keep a simple record. Tell us you need food. That
            is enough to start.
          </p>
          <a className="button primary" href="/sign-in?next=/need-food&as=neighbor">Create an account to get food</a>
        </section>
      ) : (
        <section className="panel">
          <h2>{household ? "Your household" : "Register your household"}</h2>
          <p className="note">Tell us how many people you are feeding and how to reach you. Food is never held back because you skip a growth form, and it is never held back if you cannot donate.</p>
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
              <span>Adults</span>
              <input className="input" name="adultsCount" type="number" min={1} defaultValue={household?.adults_count || 1} />
            </label>
            <label className="field">
              <span>Children (optional)</span>
              <input className="input" name="childrenCount" type="number" min={0} defaultValue={household?.children_count || 0} />
            </label>
            <label className="field">
              <span>Anything about your family we should know (ages, allergies in the home — optional)</span>
              <input className="input" name="familyNotes" defaultValue={household?.family_notes || ""} />
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
              <span>Email</span>
              <input className="input" name="email" type="email" defaultValue={household?.email || user.email} />
            </label>
            <label className="field">
              <span>How to reach you</span>
              <select className="input" name="preferredContact" defaultValue={household?.preferred_contact || "in_person"}>
                <option value="in_person">In person at the pantry</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label className="field">
              <span>Street address (for delivery if you need it)</span>
              <input className="input" name="address" defaultValue={household?.address || ""} />
            </label>
            <label className="field">
              <span>City</span>
              <input className="input" name="city" defaultValue={household?.city || pantry?.city || "Vidalia"} />
            </label>
            <label className="field">
              <span>State</span>
              <input className="input" name="state" defaultValue={household?.state || pantry?.state || "GA"} />
            </label>
            <label className="field">
              <span>ZIP</span>
              <input className="input" name="zip" defaultValue={household?.zip || pantry?.zip || ""} />
            </label>
            <label className="check"><input type="checkbox" name="deliveryOk" defaultChecked={household?.delivery_ok} /> I may need food brought to me</label>
            <label className="check"><input type="checkbox" name="porchLeaveOk" defaultChecked={household?.porch_leave_ok} /> If I am not home, you may leave food on the porch</label>
            <label className="field">
              <span>Porch / access notes</span>
              <input className="input" name="porchNotes" defaultValue={household?.porch_notes || ""} placeholder="Gate code, dogs, which door…" />
            </label>
          </PostForm>
          {household ? (
            <>
              <h3 style={{ marginTop: 24 }}>Check in when you pick up food</h3>
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
              <h3 style={{ marginTop: 24 }}>Need a delivery instead of coming in?</h3>
              <p className="note">Ask for a delivery if you cannot get to the pantry. We will schedule a time and confirm someone can receive it.</p>
              <PostForm action="/api/pickups" submitLabel="Request a delivery">
                <input type="hidden" name="kind" value="household_delivery" />
                <label className="field"><span>Address for delivery</span><input className="input" name="address" required defaultValue={household.address} /></label>
                <label className="field"><span>Phone</span><input className="input" name="contactPhone" defaultValue={household.phone} /></label>
                <label className="field"><span>When you need it</span><input className="input" type="datetime-local" name="scheduledFor" /></label>
                <label className="field"><span>Time window / notes</span><input className="input" name="windowText" placeholder="After 4pm, Saturday morning…" /></label>
                <label className="check"><input type="checkbox" name="willBeHome" defaultChecked /> Someone will be home</label>
                <label className="check"><input type="checkbox" name="porchLeaveOk" defaultChecked={household.porch_leave_ok} /> OK to leave on the porch if we miss you</label>
                <label className="field"><span>Anything else</span><input className="input" name="notes" defaultValue={household.porch_notes} /></label>
              </PostForm>
              <h3 style={{ marginTop: 24 }}>If you can help keep the pantry going</h3>
              <p className="note">Some families give a little when they pick up food. If you cannot, say so. You still get groceries.</p>
              <PostForm action="/api/contributions" submitLabel="Record this">
                <label className="field"><span>Amount in dollars (optional)</span><input className="input" name="amountDollars" type="number" min="0" step="1" /></label>
                <label className="check"><input type="checkbox" name="waived" /> I cannot give this time</label>
                <label className="field"><span>Note</span><input className="input" name="notes" /></label>
              </PostForm>
              <p className="note"><a href="/become">Want help with the next step after groceries?</a> Optional. Food does not depend on it.</p>
            </>
          ) : null}
        </section>
      )}
    </main>
  );
}
