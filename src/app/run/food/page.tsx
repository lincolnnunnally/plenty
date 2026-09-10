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
  const dests = (await listAllies(pantry.id)).filter(
    (a) => a.kind === "pantry" || a.kind === "church" || a.kind === "farm" || a.kind === "compost" || a.wants_food
  );

  return (
    <main className="shell">
      <p className="eyebrow">Food rescue</p>
      <h1>From the store to a table — or a farm</h1>
      <p className="lede">A store pickup posts a volunteer shift and a destination. Produce goes where it will be eaten first.</p>
      <RunNav />

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
