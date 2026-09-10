import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { pantryStats } from "@/lib/db/queries";
import { pantryPublicPath, pantryPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

export default async function RunPage() {
  const { pantry, superAdmin } = await requirePantryDesk("/run");
  const stats = pantry ? await pantryStats(pantry.id) : null;

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Operate the Vidalia food pantry</h1>
      <p className="lede">
        This desk is for pantry admins. Recipients, volunteers, and donors have their own accounts.
        {superAdmin ? " You are the super admin for Plenty." : ""} Leave hours blank until they are real.
      </p>
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
        </PostForm>
      </section>
    </main>
  );
}
