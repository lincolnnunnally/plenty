import { PostForm } from "@/components/post-form";
import { ShiftActions, SignupButton } from "@/components/signup-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultPantrySafe, hoursForUser, listCoverRequests, listShifts, myShiftSignups, userPhone, volunteerForUser } from "@/lib/db/queries";
import { listFoodLoads } from "@/lib/db/food-loads";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Volunteer at the Vidalia food pantry",
  "Pick up donated food, set up, serve the line, or deliver. Repeating store pickups land here."
);

export default async function VolunteerPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const shifts = pantry ? await listShifts(pantry.id).catch(() => []) : [];
  const mine = user && pantry ? await volunteerForUser(pantry.id, user.id).catch(() => null) : null;
  const myShifts = user ? await myShiftSignups(user.id).catch(() => []) : [];
  const signed = new Set(myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).map((s) => s.shift_id));
  const covers = pantry ? await listCoverRequests(pantry.id).catch(() => []) : [];
  const hours = user && pantry ? await hoursForUser(pantry.id, user.id).catch(() => []) : [];
  const hourTotal = hours.reduce((sum, row) => sum + Number(row.hours), 0);
  const phone = user ? await userPhone(user.id).catch(() => "") : "";
  const loads = pantry ? await listFoodLoads(pantry.id).catch(() => []) : [];
  const openLoads = loads.filter((l) => ["offered", "scheduled"].includes(l.status)).slice(0, 8);
  const pickupShifts = shifts.filter((s) => s.role === "pickup");
  const otherShifts = shifts.filter((s) => s.role !== "pickup");

  return (
    <main className="shell">
      <p className="eyebrow">Volunteer</p>
      <h1>Take a shift. We text you when food is on a dock.</h1>
      <p className="lede">Pickup, setup, serve, or delivery. Store leftovers get a repeating time and a destination.</p>

      {!user ? (
        <section className="panel">
          <h2>Start here</h2>
          <a className="button primary" href="/sign-in?next=/volunteer&as=volunteer">Create a volunteer account</a>
        </section>
      ) : (
        <section className="panel">
          <h2>How you can help</h2>
          <PostForm action="/api/volunteer" submitLabel="Save">
            <label className="check"><input type="checkbox" name="roles" value="pickup" defaultChecked={mine?.roles.includes("pickup")} /> Pickup at stores</label>
            <label className="check"><input type="checkbox" name="roles" value="setup" defaultChecked={mine?.roles.includes("setup")} /> Setup</label>
            <label className="check"><input type="checkbox" name="roles" value="serve" defaultChecked={mine?.roles.includes("serve")} /> Serve the line</label>
            <label className="check"><input type="checkbox" name="roles" value="delivery" defaultChecked={mine?.roles.includes("delivery")} /> Delivery</label>
            <label className="check"><input type="checkbox" name="hasVehicle" defaultChecked={mine?.has_vehicle} /> I have a vehicle</label>
            <label className="field"><span>Phone for pickup texts</span><input className="input" name="phone" type="tel" defaultValue={phone} /></label>
          </PostForm>
        </section>
      )}

      {openLoads.length ? (
        <section className="panel">
          <h2>Food on the way</h2>
          <p className="note">Repeating store pickups post here. The desk is notified. Produce goes where it will be eaten first.</p>
          <div className="grid">
            {openLoads.map((load) => (
              <article className="card" key={load.id}>
                <span>{load.status}</span>
                <strong>{load.partner_name || "Store pickup"}</strong>
                <p>{load.pickup_at ? new Date(load.pickup_at).toLocaleString() : "Time on the board"}</p>
                <p className="note">To: {load.dest_name || load.dest_note || "Plenty"}{load.route_reason ? ` · ${load.route_reason}` : ""}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {user && myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).length ? (
        <section className="panel">
          <h2>Your shifts</h2>
          <div className="grid">
            {myShifts.filter((s) => !["cancelled", "covered"].includes(s.status)).map((s) => (
              <article className="card" key={`${s.shift_id}-${s.user_id}`}>
                <span>{s.role}</span>
                <strong>{s.title || "Shift"}</strong>
                {s.starts_at ? <p>{new Date(s.starts_at).toLocaleString()}</p> : null}
                {s.location ? <p className="note">{s.location}</p> : null}
                <ShiftActions shiftId={s.shift_id} status={s.status} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {covers.filter((c) => !user || c.user_id !== user.id).length ? (
        <section className="panel">
          <h2>Needs cover</h2>
          <div className="grid">
            {covers.filter((c) => !user || c.user_id !== user.id).map((c) => (
              <article className="card" key={`${c.shift_id}-${c.user_id}`}>
                <strong>{c.title}</strong>
                {c.starts_at ? <p>{new Date(c.starts_at).toLocaleString()}</p> : null}
                {user ? <ShiftActions shiftId={c.shift_id} status="needs_cover" coverUserId={c.user_id} /> : (
                  <a className="button" href="/sign-in?next=/volunteer&as=volunteer">Sign in to cover</a>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Open pickups</h2>
        {pickupShifts.length ? (
          <div className="grid">
            {pickupShifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>Pickup</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                {shift.location ? <p className="note">{shift.location}</p> : null}
                {user ? (
                  <SignupButton shiftId={shift.id} signedUp={signed.has(shift.id)} />
                ) : (
                  <a className="button" href="/sign-in?next=/volunteer&as=volunteer">Sign in</a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No store pickup on the board yet. When a grocer sets a weekly time, it shows here.</p>
        )}
      </section>

      <section className="panel">
        <h2>Line and delivery</h2>
        {otherShifts.length ? (
          <div className="grid">
            {otherShifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>{shift.role}</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                {user ? (
                  <SignupButton shiftId={shift.id} signedUp={signed.has(shift.id)} />
                ) : (
                  <a className="button" href="/sign-in?next=/volunteer&as=volunteer">Sign in</a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No serve/setup shifts posted yet.</p>
        )}
      </section>

      {user ? (
        <section className="panel">
          <h2>Hours served</h2>
          <p className="note">{hourTotal ? `${hourTotal} hours on record.` : "Log time after a shift."}</p>
          <PostForm action="/api/hours" submitLabel="Save hours">
            <label className="field"><span>Hours</span><input className="input" name="hours" type="number" min="0.25" step="0.25" required /></label>
            <label className="field"><span>Date</span><input className="input" name="workedOn" type="date" /></label>
          </PostForm>
        </section>
      ) : null}
    </main>
  );
}
