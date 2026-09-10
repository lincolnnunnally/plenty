import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import {
  listDistributions,
  listPickups,
  listPromoSends,
  listRecurring,
  listShifts,
  listStorePartners
} from "@/lib/db/queries";
import { twilioConfigured } from "@/lib/notify";
import { resendConfigured } from "@/lib/promote/email";
import { WEEKDAYS, parseMonthWeeks, monthWeeksLabel } from "@/lib/schedule";
import { FOOD_TYPES } from "@/lib/store-pitch";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { pantry } = await requirePantryDesk("/run/calendar");
  if (!pantry) redirect("/run");
  const [shifts, pickups, days, jobs, stores, sends] = await Promise.all([
    listShifts(pantry.id),
    listPickups(pantry.id),
    listDistributions(pantry.id),
    listRecurring(pantry.id),
    listStorePartners(pantry.id),
    listPromoSends(pantry.id).catch(() => [])
  ]);
  const openPickups = pickups.filter((p) => p.status !== "done" && p.status !== "cancelled");
  const openDays = days.filter((d) => d.status !== "done" && d.status !== "cancelled");

  return (
    <main className="shell">
      <p className="eyebrow">Today</p>
      <h1>What is happening, and what repeats</h1>
      <p className="lede">Shifts, pickups, and what repeats. A weekly store pickup posts a load, texts the crew, and routes the food.</p>
      <RunNav />
      <p className="note">
        {resendConfigured() ? "Email is live." : "Email is not configured on this host."}{" "}
        {twilioConfigured() ? "Texting is live." : "Texting is not configured yet — email is the fallback."}
      </p>
      <p className="note">
        <a href="/run/shifts">Post one shift</a>
        {" · "}
        <a href="/run/pickups">Open pickups</a>
        {" · "}
        <a href="/run/distributions">Distribution days</a>
        {" · "}
        <a href="/run/locations">Places we use</a>
      </p>

      <section className="panel">
        <h2>Repeating jobs</h2>
        <p className="note">The hourly clock posts the next occurrence and notifies volunteers. Do not invent a Saturday that is not happening.</p>
        <PostForm action="/api/recurring" submitLabel="Save repeating job">
          <label className="field">
            <span>What repeats</span>
            <select className="input" name="kind" defaultValue="shift">
              <option value="shift">Volunteer shift</option>
              <option value="distribution">Distribution day</option>
              <option value="store_pickup">Store pickup</option>
            </select>
          </label>
          <label className="field"><span>Name</span><input className="input" name="title" required placeholder="Saturday serve line, Thursday dock pickup…" /></label>
          <label className="field">
            <span>Day</span>
            <select className="input" name="weekday" defaultValue="6">
              {WEEKDAYS.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </label>
          <label className="field"><span>Time (Eastern)</span><input className="input" type="time" name="timeLocal" required defaultValue="09:00" /></label>
          <p className="note">Which weeks of the month? Leave blank for every week. Church of God is the third Wednesday. Free Will is the second and fourth Friday.</p>
          <div className="chip-row">
            {[
              [1, "1st"],
              [2, "2nd"],
              [3, "3rd"],
              [4, "4th"]
            ].map(([value, label]) => (
              <label className="check" key={value}><input type="checkbox" name="monthWeeks" value={String(value)} /> {label}</label>
            ))}
          </div>
          <label className="field">
            <span>Volunteer role (for shifts)</span>
            <select className="input" name="role" defaultValue="serve">
              <option value="pickup">Pickup</option>
              <option value="setup">Setup</option>
              <option value="serve">Serve</option>
              <option value="delivery">Delivery</option>
              <option value="store_meet">Meet families at a store</option>
            </select>
          </label>
          <label className="field"><span>Where</span><input className="input" name="location" defaultValue={pantry.address || pantry.city} /></label>
          {stores.length ? (
            <label className="field">
              <span>If this is a store pickup, which store</span>
              <select className="input" name="partnerId">
                <option value="">Not a store pickup</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="note">If this is leftover food, check what usually comes</p>
          <div className="chip-row">
            {FOOD_TYPES.map((t) => (
              <label className="check" key={t.value}><input type="checkbox" name="foodTypes" value={t.value} /> {t.label}</label>
            ))}
          </div>
          <label className="field"><span>Notes</span><textarea className="input" name="notes" /></label>
        </PostForm>
        {jobs.length ? (
          <div className="grid" style={{ marginTop: 18 }}>
            {jobs.map((job) => (
              <article className="card" key={job.id}>
                <span>{job.kind.replace("_", " ")} · {WEEKDAYS[job.weekday]} {job.time_local} · {monthWeeksLabel(parseMonthWeeks(job.notes))} · {job.active ? "repeating" : "stopped"}</span>
                <strong>{job.title}</strong>
                <p className="note">{job.location}{job.last_run_on ? ` · last posted ${job.last_run_on}` : ""}</p>
                <PostForm action="/api/recurring" submitLabel={job.active ? "Stop repeating" : "Start again"}>
                  <input type="hidden" name="id" value={job.id} />
                  <input type="hidden" name="active" value={job.active ? "0" : "1"} />
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No repeating jobs yet.</p>
        )}
      </section>

      <section className="panel">
        <h2>Shifts on the board</h2>
        {shifts.length ? (
          <div className="grid">
            {shifts.map((shift) => (
              <article className="card" key={shift.id}>
                <span>{shift.role}</span>
                <strong>{shift.title}</strong>
                <p>{new Date(shift.starts_at).toLocaleString()}</p>
                <p className="note">{shift.location || "No place set"}</p>
                <PostForm action="/api/shifts" submitLabel="Move this shift">
                  <input type="hidden" name="id" value={shift.id} />
                  <input type="hidden" name="role" value={shift.role} />
                  <label className="field"><span>Where people should go</span><input className="input" name="location" defaultValue={shift.location} required /></label>
                  <label className="field"><span>Starts</span><input className="input" type="datetime-local" name="startsAt" defaultValue={shift.starts_at.slice(0, 16)} /></label>
                  <label className="field"><span>Note for the text and email</span><input className="input" name="notes" defaultValue={shift.notes} /></label>
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No shifts posted. <a href="/run/shifts">Post one</a>.</p>
        )}
      </section>

      <section className="panel">
        <h2>Pickups and deliveries</h2>
        {openPickups.length ? (
          <div className="grid">
            {openPickups.map((p) => (
              <article className="card" key={p.id}>
                <span>{p.kind.replace("_", " ")} · {p.status}</span>
                <strong>{p.address}</strong>
                {p.scheduled_for ? <p>{new Date(p.scheduled_for).toLocaleString()}</p> : <p className="note">No time set</p>}
                <PostForm action="/api/pickups" submitLabel="Move this pickup">
                  <input type="hidden" name="id" value={p.id} />
                  {p.assigned_user_id ? <input type="hidden" name="assignedUserId" value={p.assigned_user_id} /> : null}
                  <label className="field"><span>Go here instead</span><input className="input" name="address" defaultValue={p.address} required /></label>
                  <label className="field"><span>When</span><input className="input" type="datetime-local" name="scheduledFor" defaultValue={p.scheduled_for ? p.scheduled_for.slice(0, 16) : ""} /></label>
                  <label className="field"><span>Note</span><input className="input" name="notes" defaultValue={p.notes} /></label>
                </PostForm>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No open pickups. <a href="/run/pickups">Pickup desk</a>.</p>
        )}
      </section>

      <section className="panel">
        <h2>Distribution days</h2>
        {openDays.length ? (
          <div className="grid">
            {openDays.map((day) => (
              <article className="card" key={day.id}>
                <span>{day.status}</span>
                <strong>{day.title}</strong>
                <p>{new Date(day.starts_at).toLocaleString()}</p>
                {day.notes ? <p className="note">{day.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No distribution days posted. <a href="/run/distributions">Schedule one</a>.</p>
        )}
      </section>

      {sends.length ? (
        <section className="panel">
          <h2>Last volunteer messages</h2>
          <ul>
            {sends.slice(0, 8).map((s) => (
              <li key={s.id}>
                {new Date(s.created_at).toLocaleString()} · {s.channel} · {s.status}
                {s.to_count ? ` · reached ${s.to_count}` : ""}
                {s.error ? ` · ${s.error}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
