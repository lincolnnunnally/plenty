import { SignOutForm } from "@/components/sign-out-form";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantrySafe, householdForUser, membershipsForUser, pathsForUser, visitsForUser, volunteerForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const user = await requireCustomerAccess("/app");
  const pantry = await getDefaultPantrySafe();
  const memberships = await membershipsForUser(user.id).catch(() => []);
  const household = pantry ? await householdForUser(pantry.id, user.id).catch(() => null) : null;
  const volunteer = pantry ? await volunteerForUser(pantry.id, user.id).catch(() => null) : null;
  const visits = pantry ? await visitsForUser(pantry.id, user.id).catch(() => []) : [];
  const paths = await pathsForUser(user.id).catch(() => []);
  const roles = memberships.map((m) => m.role);

  return (
    <main className="shell">
      <p className="eyebrow">Your place</p>
      <h1>{user.name}</h1>
      <p className="lede">Food is free. This account is your pass, your visits, and a next step when you want one.</p>
      <div className="chip-row">
        {roles.filter((role) => role !== "steward" && role !== "admin").length
          ? roles.filter((role) => role !== "steward" && role !== "admin").map((role) => <span className="chip active" key={role}>{role === "neighbor" ? "receiving food" : role}</span>)
          : <span className="note">No pantry roles yet.</span>}
      </div>
      <div className="grid">
        <article className="card">
          <span>Household</span>
          {household ? <p>{household.display_name} · {household.household_size} people</p> : <p className="empty">No household registered.</p>}
          <a className="button" href="/need-food">{household ? "Update household" : "Register household"}</a>
        </article>
        <article className="card">
          <span>Visits</span>
          <strong>{visits.length}</strong>
          <p className="note">Times we saw you — not a badge, not a bill.</p>
        </article>
        <article className="card">
          <span>Serving</span>
          {volunteer ? <p>{volunteer.roles.join(", ") || "Volunteer"}</p> : <p className="empty">Not on the volunteer list yet.</p>}
          <a className="button" href="/volunteer">Volunteer</a>
        </article>
        <article className="card">
          <span>Path</span>
          {paths[0] ? <p>{paths[0].next_step || paths[0].who_they_want_to_become || "Started"}</p> : <p className="empty">No path written yet. Optional.</p>}
          <a className="button" href="/become">Open the path</a>
        </article>
      </div>
      <div className="action-row">
        <a className="button primary" href="/account">Open your full account</a>
        <a className="button" href="/around">Pantries around Toombs</a>
        <SignOutForm />
      </div>
    </main>
  );
}