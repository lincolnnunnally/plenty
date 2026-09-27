import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listPickups, listVolunteers, type Pickup } from "@/lib/db/queries";
import { hasCooler } from "@/lib/cooler";
import { formatEasternWhen, groupPickups, pickupIsOverdue } from "@/lib/pickup-watch";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PickupsPage() {
  const { pantry } = await requirePantryDesk("/run/pickups");
  if (!pantry) redirect("/run");
  const now = new Date();
  const groups = groupPickups(await listPickups(pantry.id), now);
  const volunteers = await listVolunteers(pantry.id);
  const drivers = volunteers.filter((v) => v.roles.includes("delivery") || v.has_vehicle);
  const coldDrivers = drivers.filter((v) => hasCooler(v.notes));
  const driverName = new Map(volunteers.map((v) => [v.user_id, v.name || v.email || "Assigned"]));
  const openCount = groups.needsScheduling.length + groups.upcoming.length + groups.overdue.length;

  function cards(rows: Pickup[], flagOverdue: boolean) {
    return (
      <div className="grid">
        {rows.map((p) => {
          const assignee = p.assigned_user_id ? driverName.get(p.assigned_user_id) || "Assigned" : "Unassigned";
          return (
            <article className="card" key={p.id}>
              <span>{p.kind === "household_delivery" ? "Deliver to a household" : p.kind === "store_collect" ? "Collect leftover from a store" : "Pick up a donation"} · {p.status} · {assignee}</span>
              {flagOverdue && pickupIsOverdue(p, now) ? <p className="note error">Overdue — the time passed and this is still open.</p> : null}
              <strong>{p.address}</strong>
              <p>{p.contact_name} {p.contact_phone}</p>
              <p>{formatEasternWhen(p.scheduled_for, p.window_text)}</p>
              {p.kind === "household_delivery" ? (
                <p className="note">
                  {p.will_be_home === true ? "Someone will be home." : p.will_be_home === false ? "May not be home." : "Home status not set."}
                  {p.porch_leave_ok ? " OK to leave on the porch." : " Do not leave on the porch unless you hear from them."}
                </p>
              ) : null}
              {p.notes ? <p>{p.notes}</p> : null}
              <PostForm action="/api/pickups" submitLabel="Change where they go">
                <input type="hidden" name="id" value={p.id} />
                {p.assigned_user_id ? <input type="hidden" name="assignedUserId" value={p.assigned_user_id} /> : null}
                <label className="field"><span>Address</span><input className="input" name="address" defaultValue={p.address} required /></label>
                <label className="field"><span>When</span><input className="input" type="datetime-local" name="scheduledFor" defaultValue={p.scheduled_for ? p.scheduled_for.slice(0, 16) : ""} /></label>
                <label className="field"><span>Note</span><input className="input" name="notes" defaultValue={p.notes} /></label>
              </PostForm>
              {p.status === "requested" ? (
                <PostForm action="/api/pickups" submitLabel="Schedule this">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="scheduled" />
                  <label className="field"><span>Time</span><input className="input" type="datetime-local" name="scheduledFor" /></label>
                  {drivers.length ? (
                    <label className="field">
                      <span>Assign a driver</span>
                      <select className="input" name="assignedUserId">
                        <option value="">Unassigned</option>
                        {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.name || d.email}{hasCooler(d.notes) ? " · cooler" : ""}</option>)}
                      </select>
                    </label>
                  ) : null}
                </PostForm>
              ) : null}
              {p.status === "scheduled" ? (
                <PostForm action="/api/pickups" submitLabel="Mark done">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value="done" />
                </PostForm>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Pickups and home deliveries</h1>
      <p className="lede">Confirm a time, know if someone will be home, and whether we may leave food on the porch.{coldDrivers.length ? ` ${coldDrivers.length} volunteer${coldDrivers.length === 1 ? " has" : "s have"} a cooler.` : " Nobody has checked that they can keep food cold yet."}</p>
      <RunNav />
      {groups.needsScheduling.length ? (
        <section className="panel">
          <h2>Needs scheduling</h2>
          <p className="note">No confirmed date yet. A window phrase still needs a time so someone can show up.</p>
          {cards(groups.needsScheduling, false)}
        </section>
      ) : null}
      <section className="panel">
        <h2>Upcoming pickups</h2>
        <p className="note">Soonest first. A request with no confirmed time is listed above, under Needs scheduling.</p>
        {groups.upcoming.length ? cards(groups.upcoming, false) : (
          <p className="empty">{openCount ? "Nothing dated ahead." : "No open pickups. A store, donor, or household request will show here."}</p>
        )}
      </section>
      {groups.overdue.length ? (
        <section className="panel">
          <h2>Overdue</h2>
          <p className="note">The time has passed and nobody has marked these done or cancelled.</p>
          {cards(groups.overdue, true)}
        </section>
      ) : null}
      {groups.finished.length ? (
        <section className="panel">
          <h2>Finished</h2>
          <div className="grid">
            {groups.finished.map((p) => (
              <article className="card" key={p.id}>
                <span>{p.status} · {p.assigned_user_id ? driverName.get(p.assigned_user_id) || "Assigned" : "Unassigned"}</span>
                <strong>{p.address}</strong>
                <p>{formatEasternWhen(p.scheduled_for, p.window_text)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
