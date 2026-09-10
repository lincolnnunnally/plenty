import { PostForm } from "@/components/post-form";
import { requireCustomerAccess } from "@/lib/auth/session";
import { alliesForOperator, listFoodLoads } from "@/lib/db/food-loads";
import { getDefaultPantrySafe } from "@/lib/db/queries";
import { isSuperAdminEmail } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ServePage() {
  const user = await requireCustomerAccess("/serve");
  const pantry = await getDefaultPantrySafe();
  if (!pantry) redirect("/app");
  const superAdmin = isSuperAdminEmail(user.email);
  const mine = superAdmin ? [] : await alliesForOperator(pantry.id, user.id);
  if (!superAdmin && !mine.length) {
    return (
      <main className="shell">
        <p className="eyebrow">Allied pantry</p>
        <h1>This desk is for a pantry Plenty has handed off</h1>
        <p className="lede">If you run a Toombs pantry and want to claim grocery food and pickups, ask Plenty to grant you this desk.</p>
      </main>
    );
  }
  const loads = await listFoodLoads(pantry.id);
  const visible = superAdmin ? loads : loads.filter((l) => l.dest_ally_id && mine.some((a) => a.id === l.dest_ally_id));
  const claimable = loads.filter((l) => !l.dest_ally_id || l.status === "offered");

  return (
    <main className="shell">
      <p className="eyebrow">Allied pantry desk</p>
      <h1>Request food. Know when to pick up.</h1>
      <p className="lede">
        {mine.length ? mine.map((a) => a.name).join(", ") : "Plenty"} — claim a grocery load, set your next distribution so produce can come to you, and show up at the posted pickup.
      </p>

      {mine.map((a) => (
        <section className="panel" key={a.id}>
          <h2>{a.name}</h2>
          <p className="note">Next distribution tells the system you can take produce that would otherwise go to compost.</p>
          <PostForm action={`/api/allies/${a.id}`} submitLabel="Save capacity">
            <label className="field"><span>Next distribution</span><input className="input" type="datetime-local" name="nextDistributionAt" defaultValue={a.next_distribution_at ? a.next_distribution_at.slice(0, 16) : ""} /></label>
            <input type="hidden" name="acceptsDry" value="0" />
            <label className="check"><input type="checkbox" name="acceptsDry" value="1" defaultChecked={a.accepts_dry} /> Dry</label>
            <input type="hidden" name="acceptsRefrigerated" value="0" />
            <label className="check"><input type="checkbox" name="acceptsRefrigerated" value="1" defaultChecked={a.accepts_refrigerated} /> Refrigerated</label>
            <input type="hidden" name="acceptsFrozen" value="0" />
            <label className="check"><input type="checkbox" name="acceptsFrozen" value="1" defaultChecked={a.accepts_frozen} /> Frozen</label>
            <input type="hidden" name="acceptsProduce" value="0" />
            <label className="check"><input type="checkbox" name="acceptsProduce" value="1" defaultChecked={a.accepts_produce} /> Produce</label>
            <input type="hidden" name="hasFreezer" value="0" />
            <label className="check"><input type="checkbox" name="hasFreezer" value="1" defaultChecked={a.has_freezer} /> We have a freezer</label>
            <input type="hidden" name="canPickup" value="1" />
            <input type="hidden" name="wantsFood" value="1" />
          </PostForm>
        </section>
      ))}

      <section className="panel">
        <h2>Loads assigned to you</h2>
        {visible.length ? (
          <div className="grid">
            {visible.map((l) => (
              <article className="card" key={l.id}>
                <span>{l.partner_name} · {l.status}</span>
                <strong>{l.pickup_at ? new Date(l.pickup_at).toLocaleString() : "Time soon"}</strong>
                <p>{(l.items || []).map((i) => `${i.category} ${i.quantity}`).join(" · ")}</p>
                <p className="note">{l.route_reason}</p>
                <PostForm action={`/api/food-loads/${l.id}`} submitLabel="We received this">
                  <input type="hidden" name="status" value="received" />
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No loads assigned yet.</p>
        )}
      </section>

      {mine.length && claimable.length ? (
        <section className="panel">
          <h2>Claim a load</h2>
          {claimable.map((l) => (
            <article className="card" key={l.id}>
              <span>{l.partner_name}</span>
              <p>{(l.items || []).map((i) => i.category).join(", ")} · {l.route_reason}</p>
              <PostForm action={`/api/food-loads/${l.id}`} submitLabel="We can take this">
                <input type="hidden" name="destAllyId" value={mine[0].id} />
                <input type="hidden" name="status" value="scheduled" />
              </PostForm>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
