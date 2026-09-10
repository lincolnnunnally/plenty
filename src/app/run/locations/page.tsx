import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listLocations } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const user = await requireCustomerAccess("/run/locations");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const locations = await listLocations(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Locations</h1>
      <p className="lede">If you distribute at more than one place — a church, a parking lot, a second town — add each one here so hours and pickups stay attached to the right site.</p>
      <RunNav />
      <section className="panel">
        <h2>Add a location</h2>
        <PostForm action="/api/locations" submitLabel="Save location">
          <label className="field"><span>Name</span><input className="input" name="name" required placeholder="Saturday church lot" /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <label className="field"><span>Hours at this site</span><input className="input" name="hoursText" /></label>
          <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
        </PostForm>
      </section>
      {locations.length ? (
        <div className="grid">
          {locations.map((loc) => (
            <article className="card" key={loc.id}>
              <strong>{loc.name}</strong>
              {loc.address ? <p>{loc.address}</p> : null}
              {loc.hours_text ? <p>{loc.hours_text}</p> : null}
              {loc.notes ? <p className="note">{loc.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No extra locations yet. The main pantry address lives under Setup.</p>
      )}
    </main>
  );
}
