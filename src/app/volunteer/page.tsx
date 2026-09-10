import { PostForm } from "@/components/post-form";
import { SignupButton } from "@/components/signup-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantry, listShifts, myShiftIds, volunteerForUser } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantry();
  const shifts = pantry ? await listShifts(pantry.id) : [];
  const mine = user && pantry ? await volunteerForUser(pantry.id, user.id) : null;
  const signed = user ? await myShiftIds(user.id) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Serve</p>
      <h1>Pick up. Set up. Serve. Drive.</h1>
      <p className="lede">
        Purpose is discovered through serving. You do not have to be an expert. Show up, and we will
        show you. If you have a vehicle, say so — neighbors need rides and pickups.
      </p>

      {!user ? (
        <section className="panel">
          <p>Sign in to join the volunteer list and take a shift.</p>
          <a className="button primary" href="/sign-in?next=/volunteer">Sign in to volunteer</a>
        </section>
      ) : (
        <section className="panel">
          <h2>{mine ? "Your volunteer profile" : "How you can help"}</h2>
          <PostForm action="/api/volunteer" submitLabel="Save volunteer profile">
            <p className="note">Check every role you can do.</p>
            <label className="check"><input type="checkbox" name="roles" value="pickup" defaultChecked={mine?.roles.includes("pickup")} /> Pickup — collect donated food</label>
            <label className="check"><input type="checkbox" name="roles" value="setup" defaultChecked={mine?.roles.includes("setup")} /> Setup — tables, bags, shelves</label>
            <label className="check"><input type="checkbox" name="roles" value="serve" defaultChecked={mine?.roles.includes("serve")} /> Serve — welcome neighbors at distribution</label>
            <label className="check"><input type="checkbox" name="roles" value="delivery" defaultChecked={mine?.roles.includes("delivery")} /> Delivery — take food to someone who cannot come</label>
            <label className="check"><input type="checkbox" name="hasVehicle" defaultChecked={mine?.has_vehicle} /> I can bring a vehicle</label>
            <label className="field">
              <span>Notes (days you can come, lifting limits, anything we should know)</span>
              <textarea className="input" name="notes" defaultValue={mine?.notes || ""} />
            </label>
          </PostForm>
        </section>
      )}

      <section className="panel">
        <p className="eyebrow">Open shifts</p>
        {shifts.length ? (
          <div className="grid">
            {shifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>{shift.role}</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                {shift.location ? <p className="note">{shift.location}</p> : null}
                <p className="note">{shift.signup_count}{shift.capacity ? ` / ${shift.capacity}` : ""} signed up</p>
                {shift.notes ? <p>{shift.notes}</p> : null}
                {user ? (
                  <SignupButton shiftId={shift.id} signedUp={signed.includes(shift.id)} />
                ) : (
                  <a className="button" href="/sign-in?next=/volunteer">Sign in to take this shift</a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No shifts posted yet. Save your volunteer profile so a steward can put you on the first one.</p>
        )}
      </section>
    </main>
  );
}
