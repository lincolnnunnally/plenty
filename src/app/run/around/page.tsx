import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { ensureToombsStartingPoints, listAllies, listOpsNeeds, listPeople } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function relLabel(value: string) {
  if (value === "visited") return "Visited";
  if (value === "running_own") return "Happy on their own";
  if (value === "we_supply") return "We can send them food";
  if (value === "they_distribute") return "They can distribute our grocery pickup";
  if (value === "share_volunteers") return "We share volunteers";
  if (value === "paused") return "Paused";
  if (value === "closed") return "Closed or moved";
  return "To meet";
}

export default async function AroundDeskPage() {
  const { pantry, pantries, superAdmin } = await requirePantryDesk("/run/around");
  if (!pantry) redirect("/run");
  await ensureToombsStartingPoints(pantry.id);
  const allies = await listAllies(pantry.id);
  const needs = await listOpsNeeds(pantry.id);
  const people = await listPeople(pantry.id);
  const toMeet = allies.filter((a) => a.relationship === "to_meet");

  return (
    <main className="shell">
      <p className="eyebrow">Toombs County · Vidalia and Lyons</p>
      <h1>Keep the pantry list honest</h1>
      <p className="lede">Walk in. Save what you saw. Hours stay off the public list until then. Closed if the building is empty.</p>
      <RunNav pantries={pantries} currentId={pantry.id} superAdmin={superAdmin} />

      <section className="panel">
        <h2>What we need to operate</h2>
        <p className="note">Freezers, coolers, warehouse space, shelves, a van. Posted needs show on Give. Do not invent a need you do not have.</p>
        <PostForm action="/api/ops-needs" submitLabel="Post this need">
          <label className="field">
            <span>Kind</span>
            <select className="input" name="kind" defaultValue="freezer">
              <option value="freezer">Freezer</option>
              <option value="cooler">Cooler / refrigerator</option>
              <option value="warehouse">Warehouse or storage space</option>
              <option value="shelves">Shelves</option>
              <option value="van">Vehicle</option>
              <option value="pallets">Pallets / carts</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field"><span>What we need</span><input className="input" name="title" required placeholder="Upright freezer, church hall on Saturdays…" /></label>
          <label className="field"><span>Details</span><input className="input" name="details" placeholder="Size, electric, how long we need it" /></label>
        </PostForm>
        {needs.length ? (
          <div className="table-scroll" style={{ marginTop: 18 }}>
            <table className="table">
              <thead><tr><th>Need</th><th>Kind</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {needs.map((n) => (
                  <tr key={n.id}>
                    <td>{n.title}{n.details ? ` · ${n.details}` : ""}</td>
                    <td>{n.kind}</td>
                    <td>{n.status}</td>
                    <td>
                      {n.status !== "filled" ? (
                        <PostForm action={`/api/ops-needs/${n.id}`} submitLabel="Filled">
                          <input type="hidden" name="status" value="filled" />
                        </PostForm>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No operating needs posted yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Visit list · {toMeet.length} still to meet</h2>
        <p className="note">Directory names until you walk in. Check the public box only after you confirm hours — or mark closed if the building is empty.</p>
        {allies.length ? (
          <div className="grid">
            {allies.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.kind} · {a.city} · {relLabel(a.relationship)}{a.listed_publicly ? " · public" : " · desk only"}{a.last_visited_at ? ` · ${new Date(a.last_visited_at).toLocaleDateString()}` : ""}</span>
                <strong>{a.name}</strong>
                {a.address ? <p>{a.address}</p> : null}
                {a.phone ? <p><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></p> : null}
                {a.hours_hint ? <p className="note">Unverified: {a.hours_hint}</p> : null}
                {a.source_note ? <p className="note">{a.source_note}</p> : null}
                <PostForm action={`/api/allies/${a.id}`} submitLabel="Save visit">
                  <label className="field">
                    <span>How we relate</span>
                    <select className="input" name="relationship" defaultValue={a.relationship}>
                      <option value="to_meet">Still need to meet them</option>
                      <option value="visited">Visited — talking</option>
                      <option value="running_own">They are happy doing their own thing</option>
                      <option value="we_supply">They want food we collect from grocery stores</option>
                      <option value="they_distribute">They can be the pickup / distribution for a store</option>
                      <option value="share_volunteers">They want volunteers we recruit</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed or moved — do not send people here</option>
                    </select>
                  </label>
                  <label className="field"><span>Confirmed hours (required to list publicly)</span><input className="input" name="hoursText" defaultValue={a.hours_text} /></label>
                  <label className="field"><span>Who you spoke with</span><input className="input" name="contactName" defaultValue={a.contact_name} /></label>
                  <label className="field"><span>What you learned</span><textarea className="input" name="visitNotes" defaultValue={a.visit_notes} /></label>
                  <input type="hidden" name="wantsFood" value="0" />
                  <label className="check"><input type="checkbox" name="wantsFood" value="1" defaultChecked={a.wants_food} /> They want grocery food if we can get it</label>
                  <input type="hidden" name="canHostDistribution" value="0" />
                  <label className="check"><input type="checkbox" name="canHostDistribution" value="1" defaultChecked={a.can_host_distribution} /> They can host a distribution</label>
                  <input type="hidden" name="canPickup" value="0" />
                  <label className="check"><input type="checkbox" name="canPickup" value="1" defaultChecked={a.can_pickup} /> They can pick up from a store</label>
                  <input type="hidden" name="wantsVolunteers" value="0" />
                  <label className="check"><input type="checkbox" name="wantsVolunteers" value="1" defaultChecked={a.wants_volunteers} /> They want volunteers</label>
                  <input type="hidden" name="hasFreezer" value="0" />
                  <label className="check"><input type="checkbox" name="hasFreezer" value="1" defaultChecked={a.has_freezer} /> They have freezer space</label>
                  <input type="hidden" name="hasSpace" value="0" />
                  <label className="check"><input type="checkbox" name="hasSpace" value="1" defaultChecked={a.has_space} /> They have storage / hall space</label>
                  <input type="hidden" name="acceptsDry" value="0" />
                  <label className="check"><input type="checkbox" name="acceptsDry" value="1" defaultChecked={a.accepts_dry} /> Can take dry goods</label>
                  <input type="hidden" name="acceptsRefrigerated" value="0" />
                  <label className="check"><input type="checkbox" name="acceptsRefrigerated" value="1" defaultChecked={a.accepts_refrigerated} /> Can take refrigerated</label>
                  <input type="hidden" name="acceptsFrozen" value="0" />
                  <label className="check"><input type="checkbox" name="acceptsFrozen" value="1" defaultChecked={a.accepts_frozen} /> Can take frozen</label>
                  <input type="hidden" name="acceptsProduce" value="0" />
                  <label className="check"><input type="checkbox" name="acceptsProduce" value="1" defaultChecked={a.accepts_produce} /> Can take produce (needs a distribution soon)</label>
                  <label className="field"><span>Next distribution</span><input className="input" type="datetime-local" name="nextDistributionAt" defaultValue={a.next_distribution_at ? a.next_distribution_at.slice(0, 16) : ""} /></label>
                {superAdmin && a.kind === "pantry" ? (
                  <PostForm action="/api/pantries" submitLabel={a.operator_pantry_id ? "Plenty desk already open" : "Open a Plenty desk for them"}>
                    <input type="hidden" name="openFromAlly" value={a.id} />
                    {people.length ? (
                      <label className="field">
                        <span>Who runs their desk (optional)</span>
                        <select className="input" name="userId">
                          <option value="">Lincoln only for now</option>
                          {people.map((p) => (
                            <option key={p.user_id} value={p.user_id}>{p.name || p.email}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </PostForm>
                ) : null}
                {people.length && (a.kind === "pantry" || a.kind === "church" || a.kind === "farm" || a.kind === "compost") ? (
                  <PostForm action="/api/ally-members" submitLabel="Hand off this pantry">
                    <input type="hidden" name="allyId" value={a.id} />
                    <label className="field">
                      <span>They sign in and run pickups for this place</span>
                      <select className="input" name="userId" required>
                        {people.map((p) => (
                          <option key={p.user_id} value={p.user_id}>{p.name || p.email}</option>
                        ))}
                      </select>
                    </label>
                  </PostForm>
                ) : null}
                  <input type="hidden" name="markVisited" value="0" />
                  <label className="check"><input type="checkbox" name="markVisited" value="1" /> I visited or called today</label>
                  <input type="hidden" name="listedPublicly" value="0" />
                  <label className="check"><input type="checkbox" name="listedPublicly" value="1" defaultChecked={a.listed_publicly} /> List publicly — hours confirmed, or mark closed so people do not drive there</label>
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No places on the visit list yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Add a place the directories missed</h2>
        <PostForm action="/api/allies" submitLabel="Add to the visit list">
          <label className="field">
            <span>Kind</span>
            <select className="input" name="kind" defaultValue="pantry">
              <option value="pantry">Food pantry</option>
              <option value="thrift">Thrift store</option>
              <option value="church">Church (volunteers)</option>
              <option value="farm">Farm / pig farm</option>
              <option value="compost">Garden / compost</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field"><span>Name</span><input className="input" name="name" required /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <label className="field"><span>City</span><input className="input" name="city" defaultValue="Vidalia" /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" /></label>
          <label className="field"><span>Unverified hours hint</span><input className="input" name="hoursHint" /></label>
          <input type="hidden" name="relationship" value="to_meet" />
        </PostForm>
      </section>
    </main>
  );
}
