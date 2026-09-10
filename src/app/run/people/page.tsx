import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listHouseholds, listPeople, listVisits, listVolunteers } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const user = await requireCustomerAccess("/run/people");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const people = await listPeople(pantry.id);
  const households = await listHouseholds(pantry.id);
  const volunteers = await listVolunteers(pantry.id);
  const visits = await listVisits(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">People</p>
      <h1>Neighbors, volunteers, donors</h1>
      <RunNav />

      <section className="panel">
        <h2>Check a household in</h2>
        {households.length ? (
          <PostForm action="/api/visits" submitLabel="Record visit">
            <label className="field">
              <span>Household</span>
              <select className="input" name="householdId" required>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.display_name} · {h.household_size}</option>
                ))}
              </select>
            </label>
            <label className="field"><span>What they received</span><input className="input" name="itemsSummary" /></label>
            <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
          </PostForm>
        ) : (
          <p className="empty">No households yet. Neighbors register at Need food.</p>
        )}
      </section>

      <section className="panel">
        <h2>On the roster</h2>
        {people.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Roles</th></tr></thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.user_id}>
                    <td>{p.name || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.roles.join(", ")}</td>
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
        <h2>Volunteers</h2>
        {volunteers.length ? (
          <div className="grid">
            {volunteers.map((v) => (
              <article className="card" key={v.id}>
                <strong>{v.name || v.email || "Volunteer"}</strong>
                <p>{v.roles.join(", ")}</p>
                {v.has_vehicle ? <p className="note">Has a vehicle</p> : null}
                {v.notes ? <p>{v.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No volunteers yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Recent visits</h2>
        {visits.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>When</th><th>Household</th><th>Received</th></tr></thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.visited_at).toLocaleString()}</td>
                    <td>{v.household_name}</td>
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
