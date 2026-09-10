import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listShiftSignups, listShifts, listStorePartners } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShiftsAdminPage() {
  const { pantry } = await requirePantryDesk("/run/shifts");
  if (!pantry) redirect("/run");
  const shifts = await listShifts(pantry.id);
  const signups = await listShiftSignups(pantry.id);
  const stores = (await listStorePartners(pantry.id)).filter((p) => p.status === "active" && p.pickup_mode !== "dock_pickup");

  return (
    <main className="shell">
      <p className="eyebrow">Shifts</p>
      <h1>Pickup, setup, serve, delivery, meet at the store</h1>
      <p className="lede">Post real shifts. A store-meet shift is a person at the grocery store: carry the bag, offer to pray, never require it.</p>
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
              <option value="store_meet">Meet families at a grocery store</option>
            </select>
          </label>
          <label className="field"><span>Starts</span><input className="input" type="datetime-local" name="startsAt" required /></label>
          <label className="field"><span>Ends</span><input className="input" type="datetime-local" name="endsAt" /></label>
          {stores.length ? (
            <label className="field">
              <span>If this is a store-meet, which store</span>
              <select className="input" name="location">
                <option value={pantry.address || pantry.city}>{pantry.address || pantry.city || "Pantry"}</option>
                {stores.map((s) => (
                  <option key={s.id} value={`${s.name}${s.address ? ` · ${s.address}` : ""}`}>{s.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="field"><span>Where</span><input className="input" name="location" defaultValue={pantry.address || pantry.city} /></label>
          )}
          <label className="field"><span>Capacity (optional)</span><input className="input" name="capacity" type="number" min={1} /></label>
          <label className="field"><span>Notes</span><textarea className="input" name="notes" placeholder="Carry the bag. Offer to pray. Do not require it. They may shop after." /></label>
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
                <ul>
                  {signups.filter((s) => s.shift_id === shift.id).map((s) => (
                    <li key={`${s.shift_id}-${s.user_id}`}>{s.name || s.email} · {s.status.replace("_", " ")}</li>
                  ))}
                </ul>
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
