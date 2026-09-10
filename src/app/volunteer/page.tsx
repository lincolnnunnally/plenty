import { PostForm } from "@/components/post-form";
import { SignupButton } from "@/components/signup-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantrySafe, listShifts, myShiftIds, volunteerForUser } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Volunteer at the Vidalia food pantry",
  "Volunteer with Plenty food pantry in Vidalia, Georgia. Pick up donated food, set up, hand out groceries, or drive deliveries to families who cannot come in."
);

export default async function VolunteerPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const shifts = pantry ? await listShifts(pantry.id) : [];
  const mine = user && pantry ? await volunteerForUser(pantry.id, user.id) : null;
  const signed = user ? await myShiftIds(user.id) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Volunteer · Vidalia food pantry</p>
      <h1>Help neighbors get groceries</h1>
      <p className="lede">
        You are volunteering at Plenty, a food pantry in Vidalia, Georgia. The work is practical:
        pick up donated food from stores and churches, set up tables, pack bags, welcome families
        in the line, or drive food to someone who cannot come. You do not need experience. We will
        show you.
      </p>

      <div className="grid">
        <article className="card"><strong>Pickup</strong><p>Collect donated food and bring it to the pantry.</p></article>
        <article className="card"><strong>Setup</strong><p>Tables, bags, shelves — get the line ready.</p></article>
        <article className="card"><strong>Serve</strong><p>Hand groceries to families and treat them with dignity.</p></article>
        <article className="card"><strong>Delivery</strong><p>Take food to a household that cannot get here.</p></article>
      </div>

      {!user ? (
        <section className="panel">
          <h2>Create an account to volunteer</h2>
          <p>Everyone who helps here has an account so we can put you on a shift and reach you. Tell us you want to volunteer.</p>
          <a className="button primary" href="/sign-in?next=/volunteer&as=volunteer">Create an account to volunteer</a>
        </section>
      ) : (
        <section className="panel">
          <h2>{mine ? "Your volunteer profile" : "How you can help this pantry"}</h2>
          <PostForm action="/api/volunteer" submitLabel="Save volunteer profile">
            <p className="note">Check every job you can do.</p>
            <label className="check"><input type="checkbox" name="roles" value="pickup" defaultChecked={mine?.roles.includes("pickup")} /> Pickup — collect donated food</label>
            <label className="check"><input type="checkbox" name="roles" value="setup" defaultChecked={mine?.roles.includes("setup")} /> Setup — tables, bags, shelves</label>
            <label className="check"><input type="checkbox" name="roles" value="serve" defaultChecked={mine?.roles.includes("serve")} /> Serve — welcome neighbors at distribution</label>
            <label className="check"><input type="checkbox" name="roles" value="delivery" defaultChecked={mine?.roles.includes("delivery")} /> Delivery — take food to someone who cannot come</label>
            <label className="check"><input type="checkbox" name="hasVehicle" defaultChecked={mine?.has_vehicle} /> I can bring a vehicle</label>
            <label className="field">
              <span>Days you can come, lifting limits, anything we should know</span>
              <textarea className="input" name="notes" defaultValue={mine?.notes || ""} />
            </label>
          </PostForm>
        </section>
      )}

      <section className="panel">
        <p className="eyebrow">Open shifts at this pantry</p>
        <h2>Sign up for a real shift</h2>
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
                  <a className="button" href="/sign-in?next=/volunteer&as=volunteer">Create an account to take this shift</a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No shifts posted yet. Save your volunteer profile so we can put you on the first one.</p>
        )}
      </section>
    </main>
  );
}
