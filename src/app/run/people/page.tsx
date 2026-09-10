import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { membershipLabel } from "@/lib/auth/roles";
import { requirePantryDesk } from "@/lib/auth/session";
import {
  hoursTotals,
  listContributions,
  listHouseholds,
  listLocations,
  listPeople,
  listVisits,
  listVolunteerHours,
  listVolunteers,
  visitCountsByHousehold
} from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { pantry, superAdmin } = await requirePantryDesk("/run/people");
  if (!pantry) redirect("/run");
  const people = await listPeople(pantry.id);
  const households = await listHouseholds(pantry.id);
  const volunteers = await listVolunteers(pantry.id);
  const visits = await listVisits(pantry.id);
  const locations = await listLocations(pantry.id);
  const contributions = await listContributions(pantry.id);
  const hours = await listVolunteerHours(pantry.id);
  const totals = await hoursTotals(pantry.id);
  const visitCounts = await visitCountsByHousehold(pantry.id);
  const locationName = new Map(locations.map((l) => [l.id, l.name]));

  return (
    <main className="shell">
      <p className="eyebrow">People</p>
      <h1>Families we serve, volunteers, pantry admins</h1>
      <p className="lede">
        Household details stay on this desk. Public pages only show hours, location, and this week's food.
      </p>
      <RunNav />

      <section className="panel">
        <h2>Check a household in</h2>
        {households.length ? (
          <PostForm action="/api/visits" submitLabel="Record visit">
            <label className="field">
              <span>Household</span>
              <select className="input" name="householdId" required>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.display_name} · {h.household_size} people</option>
                ))}
              </select>
            </label>
            {locations.length ? (
              <label className="field">
                <span>Location</span>
                <select className="input" name="locationId">
                  <option value="">Not set</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
            ) : null}
            <label className="field"><span>What they received</span><input className="input" name="itemsSummary" /></label>
            <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
          </PostForm>
        ) : (
          <p className="empty">No households yet. Neighbors register at Get food.</p>
        )}
      </section>

      <section className="panel">
        <h2>Optional contribution — never a condition for food</h2>
        <p className="note">Some households want to help keep the pantry going. If they cannot, waive it. Groceries still go out.</p>
        {households.length ? (
          <PostForm action="/api/contributions" submitLabel="Record contribution">
            <label className="field">
              <span>Household</span>
              <select className="input" name="householdId" required>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.display_name}</option>
                ))}
              </select>
            </label>
            <label className="field"><span>Amount in dollars (leave blank if waived)</span><input className="input" name="amountDollars" type="number" min="0" step="1" /></label>
            <label className="check"><input type="checkbox" name="waived" /> Waive this time — they cannot afford it</label>
            <label className="field"><span>Note / waive reason</span><input className="input" name="waiveReason" /></label>
          </PostForm>
        ) : null}
        {contributions.length ? (
          <div className="table-scroll" style={{ marginTop: 18 }}>
            <table className="table">
              <thead><tr><th>When</th><th>Household</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>{c.household_name}</td>
                    <td>{c.waived ? "Waived" : c.amount_cents ? `$${(c.amount_cents / 100).toFixed(0)}` : "—"}</td>
                    <td>{c.status}{c.waive_reason ? ` · ${c.waive_reason}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No contributions recorded yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Households we serve</h2>
        {households.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Name</th><th>Family</th><th>Contact</th><th>Address</th><th>Visits</th><th>Waiver</th><th>Delivery</th></tr></thead>
              <tbody>
                {households.map((h) => {
                  const v = visitCounts.get(h.id);
                  return (
                    <tr key={h.id}>
                      <td>{h.display_name}</td>
                      <td>{h.adults_count} adult{h.adults_count === 1 ? "" : "s"}{h.children_count ? ` · ${h.children_count} child${h.children_count === 1 ? "" : "ren"}` : ""} · {h.household_size} total{h.family_notes ? ` · ${h.family_notes}` : ""}</td>
                      <td>{[h.phone, h.email, h.preferred_contact.replace("_", " ")].filter(Boolean).join(" · ") || "—"}</td>
                      <td>{[h.address, h.city, h.state, h.zip].filter(Boolean).join(", ") || "—"}</td>
                      <td>{v ? `${v.count}${v.lastVisit ? ` · last ${new Date(v.lastVisit).toLocaleDateString()}` : ""}` : "0"}</td>
                      <td>{h.food_waiver_signed_at ? `Signed ${new Date(h.food_waiver_signed_at).toLocaleDateString()}` : "Needed"}</td>
                      <td>{h.delivery_ok ? (h.porch_leave_ok ? "Yes · porch ok" : "Yes · someone home") : "Pickup"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No households yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>On the roster</h2>
        <p className="note">Receiving food, volunteering, or giving does not open this desk. Pantry admin is granted here.</p>
        {people.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Roles</th>{superAdmin ? <th>Desk</th> : null}</tr></thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.user_id}>
                    <td>{p.name || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.roles.map(membershipLabel).join(", ")}</td>
                    {superAdmin ? (
                      <td>
                        {p.roles.includes("steward") || p.roles.includes("admin") ? (
                          <PostForm action="/api/memberships" submitLabel="Remove desk">
                            <input type="hidden" name="userId" value={p.user_id} />
                            <input type="hidden" name="role" value={p.roles.includes("admin") && !p.roles.includes("steward") ? "admin" : "steward"} />
                            <input type="hidden" name="action" value="revoke" />
                          </PostForm>
                        ) : (
                          <PostForm action="/api/memberships" submitLabel="Grant pantry admin">
                            <input type="hidden" name="userId" value={p.user_id} />
                            <input type="hidden" name="role" value="steward" />
                            <input type="hidden" name="action" value="grant" />
                          </PostForm>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No people yet. That is honest — not a demo community.</p>
        )}
      </section>

      <section className="panel">
        <h2>Volunteers and time</h2>
        {volunteers.length ? (
          <div className="grid">
            {volunteers.map((v) => (
              <article className="card" key={v.id}>
                <strong>{v.name || v.email || "Volunteer"}</strong>
                <p>{v.roles.join(", ")}</p>
                {v.has_vehicle ? <p className="note">Has a vehicle</p> : null}
                <p className="note">{totals.get(v.user_id) ? `${totals.get(v.user_id)} hours recorded` : "No hours recorded yet"}</p>
                {v.notes ? <p>{v.notes}</p> : null}
                <PostForm action="/api/hours" submitLabel="Add hours">
                  <input type="hidden" name="userId" value={v.user_id} />
                  <label className="field"><span>Hours</span><input className="input" name="hours" type="number" min="0.25" step="0.25" required /></label>
                  <label className="field"><span>Date</span><input className="input" name="workedOn" type="date" /></label>
                  <label className="field"><span>What they did</span><input className="input" name="notes" /></label>
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No volunteers yet.</p>
        )}
        {hours.length ? (
          <div className="table-scroll" style={{ marginTop: 18 }}>
            <table className="table">
              <thead><tr><th>When</th><th>Who</th><th>Hours</th><th>Notes</th></tr></thead>
              <tbody>
                {hours.map((h) => (
                  <tr key={h.id}>
                    <td>{h.worked_on}</td>
                    <td>{h.name || h.email || "—"}</td>
                    <td>{h.hours}</td>
                    <td>{h.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Recent visits</h2>
        {visits.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>When</th><th>Household</th><th>Location</th><th>Received</th></tr></thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.visited_at).toLocaleString()}</td>
                    <td>{v.household_name}</td>
                    <td>{v.location_id ? locationName.get(v.location_id) || "—" : "—"}</td>
                    <td>{v.items_summary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No visits recorded yet.</p>
        )}
      </section>
    </main>
  );
}
