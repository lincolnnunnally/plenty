import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listFoodLoads } from "@/lib/db/food-loads";
import { listAllies } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FoodRescuePage() {
  const { pantry } = await requirePantryDesk("/run/food");
  if (!pantry) redirect("/run");
  const loads = await listFoodLoads(pantry.id);
  const allies = await listAllies(pantry.id);
  const dests = allies.filter(
    (a) => a.kind === "pantry" || a.kind === "church" || a.kind === "farm" || a.kind === "compost" || a.wants_food
  );
  const overflow = allies.filter((a) => a.takes_overflow || a.kind === "farm" || a.kind === "compost");
  const cold = allies.filter((a) => a.accepts_frozen || a.accepts_refrigerated || a.has_freezer);

  return (
    <main className="shell">
      <p className="eyebrow">Food rescue</p>
      <h1>From the store to a table — or a farm</h1>
      <p className="lede">A store pickup posts a volunteer shift and a destination. Produce goes where it will be eaten first. Frozen and dairy only go where there is cold space. If a load cannot move in time, it goes to a farm or compost — not the dumpster twice.</p>
      <RunNav />

      <section className="panel">
        <h2>Where food can go</h2>
        <p className="note">If this gets bigger than one pantry, send extra to pantries that asked, or overflow to a farm. Do not invent a farm.</p>
        <div className="grid">
          <article className="card">
            <span>Cold / frozen / dairy</span>
            <strong>{cold.length ? cold.map((a) => a.name).join(" · ") : "No cold destination listed"}</strong>
            <p className="note">Need a freezer or cooler? Post it under Around → operating needs.</p>
          </article>
          <article className="card">
            <span>Overflow if produce will not keep</span>
            <strong>{overflow.length ? overflow.map((a) => `${a.name} (${a.kind})`).join(" · ") : "No farm or compost listed yet"}</strong>
            <p className="note">A pig farmer can take food we cannot move. That is an exchange of surplus, not a promise we will have pork to give out.</p>
            <a className="button" href="/run/around">Add a farm or compost</a>
          </article>
          <article className="card">
            <span>Other pantries</span>
            <strong>{dests.filter((a) => a.kind === "pantry" || a.wants_food).map((a) => a.name).join(" · ") || "Plenty only, until another pantry asks"}</strong>
            <p className="note">We supply them if they asked. We do not take them over. Extra sites: Places.</p>
            <a className="button" href="/run/locations">Manage locations</a>
          </article>
        </div>
      </section>

      {loads.length ? (
        <div className="grid">
          {loads.map((l) => (
            <article className="card" key={l.id}>
              <span>{l.partner_name} · {l.mode.replace("_", " ")}{l.leftover ? " · leftover" : ""} · {l.status}</span>
              <strong>{l.dest_name || "Needs a destination"}</strong>
              <p className="note">{l.route_reason}</p>
              {l.pickup_at ? <p>Pickup {new Date(l.pickup_at).toLocaleString()}</p> : null}
              {l.hold_until ? <p className="note">Hold until {new Date(l.hold_until).toLocaleString()}</p> : null}
              <ul>
                {(l.items || []).map((i) => (
                  <li key={i.id}>{i.category} · {i.title} {i.quantity}{i.must_use_by ? ` · use by ${i.must_use_by}` : ""}</li>
                ))}
              </ul>
              <PostForm action={`/api/food-loads/${l.id}`} submitLabel="Update">
                <label className="field">
                  <span>Destination</span>
                  <select className="input" name="destAllyId" defaultValue={l.dest_ally_id || ""}>
                    <option value="">Plenty / not assigned</option>
                    {dests.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} · {d.kind}{d.next_distribution_at ? ` · dist ${new Date(d.next_distribution_at).toLocaleDateString()}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Status</span>
                  <select className="input" name="status" defaultValue={l.status}>
                    <option value="offered">Offered</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="picked">Picked up</option>
                    <option value="received">Received</option>
                    <option value="distributed">On a table</option>
                    <option value="composted">Farm / compost</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="field"><span>Pickup time</span><input className="input" type="datetime-local" name="pickupAt" defaultValue={l.pickup_at ? l.pickup_at.slice(0, 16) : ""} /></label>
              </PostForm>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No store loads yet. When a store schedules a pickup or leftover collect, it shows here and on Volunteer as a shift.</p>
      )}
    </main>
  );
}
