import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { pantryStats } from "@/lib/db/queries";
import { pantryPublicPath, pantryPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const { pantry, superAdmin, pantries } = await requirePantryDesk("/run");
  const stats = pantry ? await pantryStats(pantry.id) : null;

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Operate the Vidalia food pantry</h1>
      <p className="lede">
        Recipients, volunteers, and donors have their own accounts.
        {superAdmin ? " You are the super admin." : ""}
      </p>
      <RunNav pantries={pantries} currentId={pantry?.id} superAdmin={superAdmin} />
      <div className="action-row">
        <a className="button primary" href="/run/line">Line — check in and QR</a>
        <a className="button" href="/run/donations">Stripe, Cash App, Venmo, Zelle</a>
        <a className="button" href="/run/calendar">Today</a>
      </div>

      {stats ? (
        <div className="metric-grid">
          <article className="metric-card"><span>Households</span><strong>{stats.households}</strong></article>
          <article className="metric-card"><span>Visits</span><strong>{stats.visits}</strong></article>
          <article className="metric-card"><span>Volunteers</span><strong>{stats.volunteers}</strong></article>
          <article className="metric-card"><span>Open offers</span><strong>{stats.open_offers}</strong></article>
        </div>
      ) : null}

      <section className="panel">
        <h2>Pantry setup</h2>
        <article className="card" style={{ marginBottom: 16 }}>
          <span>Public pantry page</span>
          <strong>
            <a href={pantryPublicPath(pantry?.slug || "vidalia")} target="_blank" rel="noopener noreferrer">
              {pantryPublicUrl(pantry?.slug || "vidalia")}
            </a>
          </strong>
          <p className="note">
            This is the page neighbors, volunteers, and donors can find and share. The home site
            {" "}<a href="/">plenty.unitedundergod.org</a> also shows this pantry. The slug below is the last part of the public URL.
          </p>
        </article>
        <PostForm action="/api/pantries" submitLabel="Save pantry">
          {pantry ? <input type="hidden" name="pantryId" value={pantry.id} /> : null}
          <label className="field"><span>Name</span><input className="input" name="name" defaultValue={pantry?.name || "Vidalia Plenty"} required /></label>
          <label className="field">
            <span>Public URL name (slug)</span>
            <input className="input" name="slug" defaultValue={pantry?.slug || "vidalia"} />
            <p className="note">Becomes {pantryPublicUrl(pantry?.slug || "vidalia")}. Use lowercase letters with no spaces — vidalia stays vidalia.</p>
          </label>
          <label className="field"><span>City</span><input className="input" name="city" defaultValue={pantry?.city || "Vidalia"} /></label>
          <label className="field"><span>State</span><input className="input" name="state" defaultValue={pantry?.state || "GA"} /></label>
          <label className="field"><span>ZIP</span><input className="input" name="zip" defaultValue={pantry?.zip || "30474"} /></label>
          <label className="field"><span>Street address (leave blank until real)</span><input className="input" name="address" defaultValue={pantry?.address || ""} /></label>
          <label className="field"><span>Hours (leave blank until real)</span><textarea className="input" name="hoursText" defaultValue={pantry?.hours_text || ""} /></label>
          <label className="field"><span>About</span><textarea className="input" name="about" defaultValue={pantry?.about || ""} /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" defaultValue={pantry?.phone || ""} /></label>
          <label className="field"><span>Email</span><input className="input" name="email" defaultValue={pantry?.email || ""} /></label>
          <label className="field">
            <span>How neighbors visit</span>
            <select className="input" name="visitStyle" defaultValue={pantry?.visit_style || "walk_in"}>
              <option value="walk_in">Walk in</option>
              <option value="appointment">Appointment</option>
              <option value="both">Walk in or appointment</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select className="input" name="status" defaultValue={pantry?.status || "setup"}>
              <option value="setup">Getting established</option>
              <option value="open">Open</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <h3>What people need to know to receive food</h3>
          <p className="note">These rules are this pantry&apos;s. They show on the public page and on every flyer and post. The food is free. A handling donation is requested, not required.</p>
          <label className="field">
            <span>What is required to receive (ID, paperwork, none — say what is true)</span>
            <textarea className="input" name="receiveRules" defaultValue={pantry?.receive_rules || ""} placeholder="No income test at the door. Come and we will help you register." />
          </label>
          <label className="field">
            <span>Residency</span>
            <textarea className="input" name="residencyRules" defaultValue={pantry?.residency_rules || ""} placeholder="Toombs County and nearby. If you are traveling through, still come — we will not turn you away hungry." />
          </label>
          <label className="check"><input type="checkbox" name="idRequired" defaultChecked={Boolean(pantry?.id_required)} /> Ask for a photo ID</label>
          <label className="field">
            <span>How often a household may come</span>
            <input className="input" name="frequencyRules" defaultValue={pantry?.frequency_rules || ""} placeholder="Once a week, twice a month…" />
          </label>
          <label className="field">
            <span>Handling donation at the line</span>
            <select className="input" name="donationPolicy" defaultValue={pantry?.donation_policy || "welcome"}>
              <option value="none">None asked</option>
              <option value="welcome">Requested for handling — not for the food</option>
              <option value="suggested">Suggested for handling when they can</option>
              <option value="expected">Asked at the line for handling — still not a condition for food</option>
            </select>
          </label>
          <label className="field">
            <span>Donation note (optional)</span>
            <input className="input" name="donationNote" defaultValue={pantry?.donation_note || ""} />
          </label>
        </PostForm>
      </section>

      {superAdmin ? (
        <section className="panel">
          <h2>Open another pantry on Plenty</h2>
          <p className="note">
            They get their own line QR, households, and Cash App / Venmo / Zelle. They can collect through United
            Under God until they post their own handles.
          </p>
          <PostForm action="/api/pantries" submitLabel="Open this pantry desk">
            <input type="hidden" name="createNew" value="1" />
            <label className="field"><span>Name</span><input className="input" name="name" required placeholder="Lyons Community Pantry" /></label>
            <label className="field"><span>Public URL name</span><input className="input" name="slug" placeholder="lyons" /></label>
            <label className="field"><span>City</span><input className="input" name="city" defaultValue="Lyons" /></label>
            <label className="field">
              <span>Money</span>
              <select className="input" name="givingMode" defaultValue="uug">
                <option value="uug">Use United Under God giving</option>
                <option value="own">They will post their own Cash App, Venmo, Zelle</option>
              </select>
            </label>
          </PostForm>
        </section>
      ) : null}
    </main>
  );
}
