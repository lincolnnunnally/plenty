import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, householdForUser, membershipsForUser, pathsForUser, visitsForUser, volunteerForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const user = await requireCustomerAccess("/app");
  const pantry = await getDefaultPantry();
  const memberships = await membershipsForUser(user.id);
  const household = pantry ? await householdForUser(pantry.id, user.id) : null;
  const volunteer = pantry ? await volunteerForUser(pantry.id, user.id) : null;
  const visits = pantry ? await visitsForUser(pantry.id, user.id) : [];
  const paths = await pathsForUser(user.id);
  const roles = memberships.map((m) => m.role);

  return (
    <main className="shell">
      <p className="eyebrow">Your place</p>
      <h1>{user.name}</h1>
      <p className="lede">
        One person can be a neighbor, a volunteer, a donor, and a steward. Movement from receiving
        to contributing is the win — never a score.
      </p>
      <div className="chip-row">
        {roles.length ? roles.map((role) => <span className="chip active" key={role}>{role}</span>) : <span className="note">No pantry roles yet.</span>}
      </div>
      <div className="grid">
        <article className="card">
          <span>Household</span>
          {household ? <p>{household.display_name} · {household.household_size} people</p> : <p className="empty">No household registered.</p>}
          <a className="button" href="/need-food">{household ? "Update household" : "Register household"}</a>
        </article>
        <article className="card">
          <span>Serving</span>
          {volunteer ? <p>{volunteer.roles.join(", ") || "Volunteer"}{volunteer.has_vehicle ? " · has a vehicle" : ""}</p> : <p className="empty">Not on the volunteer list yet.</p>}
          <a className="button" href="/volunteer">Volunteer</a>
        </article>
        <article className="card">
          <span>Visits</span>
          <strong>{visits.length}</strong>
          <p className="note">A count of times you came — not a badge, not a limit.</p>
        </article>
        <article className="card">
          <span>Path</span>
          {paths[0] ? <p>{paths[0].next_step || paths[0].who_they_want_to_become || "Started"}</p> : <p className="empty">No path written yet. Optional.</p>}
          <a className="button" href="/become">Open the path</a>
        </article>
      </div>
    </main>
  );
}
