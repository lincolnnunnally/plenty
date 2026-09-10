import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listPickups, listVolunteers } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PickupsPage() {
  const { pantry } = await requirePantryDesk("/run/pickups");
  if (!pantry) redirect("/run");
  const pickups = await listPickups(pantry.id);
  const volunteers = await listVolunteers(pantry.id);
  const drivers = volunteers.filter((v) => v.roles.includes("delivery") || v.has_vehicle);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Pickups and home deliveries</h1>
      <p className="lede">Confirm a time, know if someone will be home, and whether we may leave food on the porch.</p>
      <RunNav />
      {pickups.length ? (
        <div className="grid">
          {pickups.map((p) => (
            <article className="card" key={p.id}>
              <span>{p.kind === "donation_pickup" ? "Pick up a donation" : "Deliver to a household"} · {p.status}</span>
              <strong>{p.address}</strong>
              <p>{p.contact_name} {p.contact_phone}</p>
              {p.scheduled_for ? <p>{new Date(p.scheduled_for).toLocaleString()}</p> : <p className="note">No time set yet</p>}
              {p.window_text ? <p className="note">Window: {p.window_text}</p> : null}
              {p.kind === "household_delivery" ? (
                <p className="note">
                  {p.will_be_home === true ? "Someone will be home." : p.will_be_home === false ? "May not be home." : "Home status not set."}
                  {p.porch_leave_ok ? " OK to leave on the porch." : " Do not leave on the porch unless you hear from them."}
                </p>
              ) : null}
              {p.notes ? <p>{p.notes}</p> : null}
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
                        {drivers.map((d) => <option key={d.user_id} value={d.user_id}>{d.name || d.email}</option>)}
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
          ))}
        </div>
      ) : (
        <p className="empty">No pickup or delivery requests yet.</p>
      )}
    </main>
  );
}
