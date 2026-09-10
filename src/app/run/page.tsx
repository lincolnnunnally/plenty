import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getDefaultPantry, isSteward, pantryStats } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const user = await requireCustomerAccess("/run");
  const pantry = await getDefaultPantry();
  const steward = pantry ? await isSteward(pantry.id, user.id, user.role) : canAccessAdmin(user.role);
  const stats = pantry ? await pantryStats(pantry.id) : null;

  if (!steward) {
    return (
      <main className="shell">
        <p className="eyebrow">Run</p>
        <h1>This desk is for stewards</h1>
        <p>You can still volunteer, give, or register a household. Ask Lincoln to add you as a steward if you help run the pantry.</p>
        <a className="button" href="/app">Back to my place</a>
      </main>
    );
  }

  return (
    <main className="shell">
      <p className="eyebrow">Steward</p>
      <h1>Set up and run the pantry</h1>
      <p className="lede">Vidalia first. Hours and address stay blank until they are real. Empty shelves are honest.</p>
      <RunNav />

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
        <PostForm action="/api/pantries" submitLabel="Save pantry">
          <label className="field"><span>Name</span><input className="input" name="name" defaultValue={pantry?.name || "Vidalia Plenty"} required /></label>
          <label className="field"><span>Slug (url)</span><input className="input" name="slug" defaultValue={pantry?.slug || "vidalia"} /></label>
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
        </PostForm>
      </section>
    </main>
  );
}
