import { PostForm } from "@/components/post-form";
import { ShiftActions, SignupButton } from "@/components/signup-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantrySafe, hoursForUser, listCoverRequests, listedAllies, listShifts, myShiftSignups, volunteerForUser } from "@/lib/db/queries";
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
  const myShifts = user ? await myShiftSignups(user.id) : [];
  const signed = new Set(myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).map((s) => s.shift_id));
  const covers = pantry ? await listCoverRequests(pantry.id) : [];
  const hours = user && pantry ? await hoursForUser(pantry.id, user.id) : [];
  const hourTotal = hours.reduce((sum, row) => sum + Number(row.hours), 0);
  const allyHelp = pantry ? (await listedAllies(pantry.id).catch(() => [])).filter((a) => a.wants_volunteers) : [];

  return (
    <main className="shell">
      <p className="eyebrow">Volunteer · Vidalia food pantry</p>
      <h1>Help neighbors get groceries</h1>
      <p className="lede">
        Help Plenty, or help a pantry already here that asked. Meet people where the opportunity is —
        including a grocery store that invited us. We do not take over a pantry or a store that did not ask.
      </p>

      <div className="grid">
        <article className="card"><strong>Pickup</strong><p>Collect donated food and bring it to the pantry.</p></article>
        <article className="card"><strong>Setup</strong><p>Tables, bags, shelves — get the line ready.</p></article>
        <article className="card"><strong>Serve</strong><p>Hand groceries to families and treat them with dignity.</p></article>
        <article className="card"><strong>Delivery</strong><p>Take food to a household that cannot get here.</p></article>
        <article className="card"><strong>Meet at the store</strong><p>Carry the hold bag to a family, offer to pray if they want, then they may shop. Prayer is never required for food.</p></article>
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
            <label className="check"><input type="checkbox" name="roles" value="store_meet" defaultChecked={mine?.roles.includes("store_meet")} /> Meet at the store — carry the bag, offer prayer if they want, never require it</label>
            <label className="check"><input type="checkbox" name="hasVehicle" defaultChecked={mine?.has_vehicle} /> I can bring a vehicle</label>
            <label className="field">
              <span>Days you can come, lifting limits, anything we should know</span>
              <textarea className="input" name="notes" defaultValue={mine?.notes || ""} />
            </label>
          </PostForm>
        </section>
      )}

      {user ? (
        <section className="panel">
          <h2>Your shifts</h2>
          {myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).length ? (
            <div className="grid">
              {myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).map((s) => (
                <article className="card" key={`${s.shift_id}-${s.user_id}`}>
                  <span>{s.role} · {s.status.replace("_", " ")}</span>
                  <strong>{s.title || "Shift"}</strong>
                  {s.starts_at ? <p>{new Date(s.starts_at).toLocaleString()}</p> : null}
                  {s.location ? <p className="note">{s.location}</p> : null}
                  <ShiftActions shiftId={s.shift_id} status={s.status} />
                </article>
              ))}
            </div>
          ) : (
            <p className="empty">You are not on an upcoming shift yet. Take one below.</p>
          )}
        </section>
      ) : null}

      {covers.filter((c) => !user || c.user_id !== user.id).length ? (
        <section className="panel">
          <h2>Someone needs cover</h2>
          <div className="grid">
            {covers.filter((c) => !user || c.user_id !== user.id).map((c) => (
              <article className="card" key={`${c.shift_id}-${c.user_id}`}>
                <span>{c.role}</span>
                <strong>{c.title}</strong>
                {c.starts_at ? <p>{new Date(c.starts_at).toLocaleString()}</p> : null}
                <p className="note">{c.name || c.email} cannot make this one.</p>
                {user ? <ShiftActions shiftId={c.shift_id} status="needs_cover" coverUserId={c.user_id} /> : (
                  <a className="button" href="/sign-in?next=/volunteer&as=volunteer">Sign in to cover this</a>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {user ? (
        <section className="panel">
          <h2>Log the time you served</h2>
          <p className="note">{hourTotal ? `${hourTotal} hours on record.` : "Hours help us thank you and plan the next week."}</p>
          <PostForm action="/api/hours" submitLabel="Save hours">
            <label className="field"><span>Hours</span><input className="input" name="hours" type="number" min="0.25" step="0.25" required /></label>
            <label className="field"><span>Date</span><input className="input" name="workedOn" type="date" /></label>
            <label className="field"><span>What you did</span><input className="input" name="notes" placeholder="Pickup, serve line, delivery…" /></label>
          </PostForm>
        </section>
      ) : null}

      <section className="panel">
        <h2>Churches and existing pantries</h2>
        <p>
          If your church has people who want to serve, send them here. They can run a Plenty shift,
          or — only if that pantry asked — help a pantry we have already met.
        </p>
        {allyHelp.length ? (
          <div className="grid">
            {allyHelp.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.city} · asked for volunteers</span>
                <strong>{a.name}</strong>
                {a.hours_text ? <p>{a.hours_text}</p> : null}
                {a.phone ? <p className="note">{a.phone}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No other pantry has asked us for volunteers yet. Meet them first. Until then, serve at Plenty.</p>
        )}
        <p className="note"><a href="/around">Other places in Vidalia and Lyons</a></p>
      </section>

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
                  <SignupButton shiftId={shift.id} signedUp={signed.has(shift.id)} />
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
