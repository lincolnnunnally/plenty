import { membershipLabel } from "@/lib/auth/roles";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantrySafe, giftsForUser, getTaxProfile, hoursForUser, isSteward, membershipsForUser, myShiftSignups, visitsForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireCustomerAccess("/account");
  const memberships = await membershipsForUser(user.id);
  const pantry = await getDefaultPantrySafe();
  const steward = pantry ? await isSteward(pantry.id, user.id, user.email) : false;
  const gifts = await giftsForUser(user.id);
  const tax = pantry ? await getTaxProfile(pantry.id) : null;
  const receivedMoney = gifts.filter((g) => g.kind === "money" && g.status === "received");
  const roles = memberships.map((m) => m.role);
  const visits = pantry ? await visitsForUser(pantry.id, user.id) : [];
  const hours = pantry ? await hoursForUser(pantry.id, user.id) : [];
  const myShifts = await myShiftSignups(user.id);
  const roleLabel = roles.includes("neighbor") && roles.includes("volunteer")
    ? "You get food here and you also volunteer."
    : roles.includes("neighbor")
      ? "You are registered to get food."
      : roles.includes("volunteer")
        ? "You volunteer at this food pantry."
        : roles.includes("donor")
          ? "You give to this food pantry."
          : "Tell us if you need food, volunteer, or give — from Get food, Volunteer, or Give.";

  return (
    <main className="shell">
      <p className="eyebrow">Your account</p>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p className="lede">{roleLabel}</p>
      <div className="chip-row">
        {roles.filter((r) => r !== "steward" && r !== "admin").map((role) => (
          <span className="chip active" key={role}>{membershipLabel(role)}</span>
        ))}
      </div>
      <div className="action-row">
        <a className="button primary" href="/need-food">Get food</a>
        <a className="button" href="/volunteer">Volunteer</a>
        <a className="button" href="/donate">Give</a>
        {steward ? <a className="button leaf" href="/run">Open pantry desk</a> : null}
      </div>

      <section className="panel">
        <h2>Your visits</h2>
        <p className="note">{visits.length ? `${visits.length} recorded — a count, not a limit.` : "No visits recorded yet."}</p>
      </section>

      <section className="panel">
        <h2>Your volunteer time</h2>
        {hours.length ? (
          <p>{hours.reduce((sum, row) => sum + Number(row.hours), 0)} hours recorded. {myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).length} open shift(s).</p>
        ) : (
          <p className="empty">No hours logged yet. Log them from Volunteer.</p>
        )}
      </section>

      <section className="panel">
        <h2>Your gifts</h2>
        {gifts.length ? (
          <ul>
            {gifts.map((g) => (
              <li key={g.id}>{g.kind}{g.tenure ? ` · ${g.tenure}` : ""} · {g.title} · {g.status}{g.amount_cents ? ` · $${(g.amount_cents / 100).toFixed(0)}` : ""}</li>
            ))}
          </ul>
        ) : (
          <p className="empty">No gifts recorded on this account yet.</p>
        )}
        {receivedMoney.length && tax?.posted ? (
          <div>
            <h3>Year-end receipts</h3>
            <p className="note">Print or save these for your records. They use the tax information posted on this site.</p>
            {receivedMoney.map((g) => (
              <article className="card" key={g.id}>
                <strong>Receipt · {new Date(g.received_at || g.created_at).toLocaleDateString()}</strong>
                <p>{tax.legal_name || "Plenty food pantry"}</p>
                {tax.ein ? <p>EIN {tax.ein}</p> : null}
                <p>Thank you, {g.contact_name || user.name}. We received ${((g.amount_cents || 0) / 100).toFixed(0)} for the Vidalia food pantry. No goods or services were provided in exchange.</p>
              </article>
            ))}
          </div>
        ) : receivedMoney.length ? (
          <p className="note">Money gifts are on file. Formal receipts will appear here when tax-exempt information is posted.</p>
        ) : null}
      </section>

      <a className="button" href="/api/auth/signout">Sign out</a>
    </main>
  );
}
