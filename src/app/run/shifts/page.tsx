import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listShifts } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShiftsAdminPage() {
  const user = await requireCustomerAccess("/run/shifts");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const shifts = await listShifts(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Shifts</p>
      <h1>Pickup, setup, serve, delivery</h1>
      <RunNav />

      <section className="panel">
        <h2>Post a shift</h2>
        <PostForm action="/api/shifts" submitLabel="Post shift">
          <label className="field"><span>Title</span><input className="input" name="title" required placeholder="Saturday serve line" /></label>
          <label className="field">
            <span>Role</span>
            <select className="input" name="role" defaultValue="serve">
              <option value="pickup">Pickup</option>
              <option value="setup">Setup</option>
              <option value="serve">Serve</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
          <label className="field"><span>Starts</span><input className="input" type="datetime-local" name="startsAt" required /></label>
          <label className="field"><span>Ends</span><input className="input" type="datetime-local" name="endsAt" /></label>
          <label className="field"><span>Where</span><input className="input" name="location" defaultValue={pantry.address || pantry.city} /></label>
          <label className="field"><span>Capacity (optional)</span><input className="input" name="capacity" type="number" min={1} /></label>
          <label className="field"><span>Notes</span><textarea className="input" name="notes" /></label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>Open shifts</h2>
        {shifts.length ? (
          <div className="grid">
            {shifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>{shift.role}</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                <p className="note">{shift.signup_count}{shift.capacity ? ` / ${shift.capacity}` : ""} signed up</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No shifts posted. Post the first real one — do not invent a Saturday that is not happening.</p>
        )}
      </section>
    </main>
  );
}
