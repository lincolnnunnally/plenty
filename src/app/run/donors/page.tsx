import { DriveLink } from "@/components/drive-link";
import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { ensureFoodDonors, listDonorActivity, listStorePartners } from "@/lib/db/queries";
import { activityLabel, donorKindLabel, parseDonorMeta } from "@/lib/donors/starting";
import { coordsForName } from "@/lib/maps";
import { FOOD_TYPES } from "@/lib/store-pitch";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "invited") return "To meet";
  if (status === "active") return "Giving";
  if (status === "paused") return "Paused";
  return status;
}

export default async function FoodDonorsPage() {
  const { pantry, pantries, superAdmin } = await requirePantryDesk("/run/donors");
  if (!pantry) redirect("/run");
  await ensureFoodDonors(pantry.id).catch(() => 0);
  const partners = await listStorePartners(pantry.id);
  const activity = await listDonorActivity(pantry.id).catch(() => []);
  const today = new Date().toISOString().slice(0, 10);
  const followUps = partners.filter((p) => {
    const next = parseDonorMeta(p.notes).next;
    return next && next.slice(0, 10) <= today && p.status !== "paused";
  });

  return (
    <main className="shell">
      <p className="eyebrow">Food donors</p>
      <h1>Who has food. Who we have asked.</h1>
      <p className="lede">Warehouses, grocery docks, farms. Log the call. When they have a load, post a pickup — volunteers get a text.</p>
      <RunNav pantries={pantries} currentId={pantry.id} superAdmin={superAdmin} />

      {followUps.length ? (
        <section className="panel">
          <h2>Follow up</h2>
          <div className="grid">
            {followUps.map((p) => (
              <article className="card" key={p.id}>
                <span>{parseDonorMeta(p.notes).next.slice(0, 10)}</span>
                <strong>{p.name}</strong>
                <p>{parseDonorMeta(p.notes).body.split("\n")[0]}</p>
                <a className="button primary" href={`#donor-${p.id}`}>Open</a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Donors</h2>
        {partners.length ? (
          <div className="grid">
            {partners.map((p) => {
              const meta = parseDonorMeta(p.notes);
              const coords = coordsForName(p.name);
              const log = activity.filter((a) => a.title.toLowerCase().includes(p.name.toLowerCase().slice(0, 8))).slice(0, 5);
              return (
                <article className="card" id={`donor-${p.id}`} key={p.id}>
                  <span>{statusLabel(p.status)} · {donorKindLabel(meta.kind) || (p.pickup_mode === "dock_pickup" ? "Dock pickup" : "Store")}</span>
                  <strong>{p.name}</strong>
                  <p>{[p.address, p.city].filter(Boolean).join(", ") || "Address not set"}</p>
                  {meta.gives.length ? <p>{meta.gives.join(" · ")}</p> : null}
                  {p.contact_name ? <p className="note">{[p.contact_name, p.hold_desk, p.phone, p.contact_email].filter(Boolean).join(" · ")}</p> : null}
                  {meta.body ? <p className="note">{meta.body.split("\n").filter((line) => !line.startsWith("[")).slice(0, 3).join(" ")}</p> : null}
                  {meta.next ? <p className="note">Follow up {meta.next.slice(0, 10)}</p> : null}
                  <div className="action-row">
                    <DriveLink address={p.address} city={p.city} state={p.state || "GA"} zip={p.zip} lat={coords?.lat} lon={coords?.lon} />
                    {p.phone ? <a className="button" href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>Call</a> : null}
                  </div>

                  <h3 style={{ marginTop: 16 }}>Log</h3>
                  <PostForm action="/api/donor-activity" submitLabel="Save log">
                    <input type="hidden" name="partnerId" value={p.id} />
                    <label className="field">
                      <span>What happened</span>
                      <select className="input" name="kind" defaultValue="donor_call">
                        <option value="donor_call">Call</option>
                        <option value="donor_visit">Visit</option>
                        <option value="donor_gift">They gave food</option>
                        <option value="donor_email">Email</option>
                        <option value="donor_note">Note</option>
                      </select>
                    </label>
                    <label className="field"><span>Notes</span><textarea className="input" name="body" required placeholder="Talked to… they have frozen and dry…" /></label>
                    <label className="field"><span>Food this time</span><input className="input" name="foodNote" defaultValue={meta.gives.join(", ")} /></label>
                    <label className="field"><span>Follow up on</span><input className="input" type="date" name="nextFollowUp" /></label>
                  </PostForm>

                  {log.length ? (
                    <ul>
                      {log.map((a) => (
                        <li key={a.id}>
                          {new Date(a.created_at).toLocaleDateString()} · {activityLabel(a.kind)} · {a.description}
                          {a.quantity ? ` (${a.quantity})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="note">No log yet.</p>
                  )}

                  <h3 style={{ marginTop: 16 }}>They have a load</h3>
                  <PostForm action={`/api/food-donors/${p.id}/load`} submitLabel="Post pickup for volunteers">
                    <label className="field"><span>Pickup time</span><input className="input" type="datetime-local" name="pickupAt" required /></label>
                    <input type="hidden" name="frozen" value="0" />
                    <input type="hidden" name="dry" value="0" />
                    <input type="hidden" name="refrigerated" value="0" />
                    <input type="hidden" name="produce" value="0" />
                    <label className="check"><input type="checkbox" name="frozen" value="1" defaultChecked={meta.gives.includes("frozen")} /> Frozen</label>
                    <label className="check"><input type="checkbox" name="dry" value="1" defaultChecked={meta.gives.includes("dry")} /> Dry</label>
                    <label className="check"><input type="checkbox" name="refrigerated" value="1" defaultChecked={meta.gives.includes("refrigerated")} /> Cold</label>
                    <label className="check"><input type="checkbox" name="produce" value="1" defaultChecked={meta.gives.includes("produce")} /> Produce</label>
                    <label className="field"><span>How much</span><input className="input" name="frozenQty" placeholder="Pallets, cases…" /></label>
                  </PostForm>

                  <details className="field-edit">
                    <summary>Edit donor</summary>
                    <PostForm action={`/api/food-donors/${p.id}`} submitLabel="Save donor">
                      <label className="field"><span>Name</span><input className="input" name="name" defaultValue={p.name} /></label>
                      <label className="field"><span>Address</span><input className="input" name="address" defaultValue={p.address} /></label>
                      <label className="field"><span>Person</span><input className="input" name="contactName" defaultValue={p.contact_name} /></label>
                      <label className="field"><span>Their role</span><input className="input" name="contactRole" defaultValue={p.hold_desk} /></label>
                      <label className="field"><span>Phone</span><input className="input" name="phone" defaultValue={p.phone} /></label>
                      <label className="field"><span>Email</span><input className="input" name="contactEmail" defaultValue={p.contact_email} /></label>
                      <label className="field">
                        <span>Status</span>
                        <select className="input" name="status" defaultValue={p.status}>
                          <option value="invited">To meet</option>
                          <option value="active">Giving</option>
                          <option value="paused">Paused</option>
                        </select>
                      </label>
                      <div className="chip-row">
                        {FOOD_TYPES.map((t) => (
                          <label className="check" key={t.value}>
                            <input type="checkbox" name="foodTypes" value={t.value} defaultChecked={meta.gives.includes(t.value)} /> {t.label}
                          </label>
                        ))}
                      </div>
                      <label className="field"><span>Notes</span><textarea className="input" name="notes" defaultValue={meta.body} /></label>
                    </PostForm>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty">No food donors yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Add a donor</h2>
        <PostForm action="/api/food-donors" submitLabel="Add donor">
          <label className="field"><span>Name</span><input className="input" name="name" required placeholder="Warehouse, farm, grocer…" /></label>
          <label className="field">
            <span>Kind</span>
            <select className="input" name="kind" defaultValue="warehouse">
              <option value="warehouse">Warehouse</option>
              <option value="grocery">Grocery</option>
              <option value="farm">Farm</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="church">Church</option>
            </select>
          </label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <div className="grid">
            <label className="field"><span>City</span><input className="input" name="city" defaultValue={pantry.city} /></label>
            <label className="field"><span>ZIP</span><input className="input" name="zip" defaultValue={pantry.zip} /></label>
          </div>
          <label className="field"><span>Person</span><input className="input" name="contactName" placeholder="Who we talk to" /></label>
          <label className="field"><span>Their role</span><input className="input" name="contactRole" placeholder="Giving committee, dock manager…" /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" /></label>
          <label className="field"><span>Email</span><input className="input" name="contactEmail" type="email" /></label>
          <div className="chip-row">
            {FOOD_TYPES.map((t) => (
              <label className="check" key={t.value}><input type="checkbox" name="foodTypes" value={t.value} /> {t.label}</label>
            ))}
          </div>
          <label className="field"><span>What we know</span><textarea className="input" name="notes" placeholder="They have given to… frozen and dry…" /></label>
        </PostForm>
      </section>
    </main>
  );
}
