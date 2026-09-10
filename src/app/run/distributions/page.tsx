import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listDistributions } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DistributionsPage() {
  const { pantry } = await requirePantryDesk("/run/distributions");
  if (!pantry) redirect("/run");
  const days = await listDistributions(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Distribution</p>
      <h1>Days we open the line</h1>
      <RunNav />

      <section className="panel">
        <h2>Schedule a day</h2>
        <PostForm action="/api/distributions" submitLabel="Post distribution day">
          <label className="field"><span>Title</span><input className="input" name="title" required placeholder="Saturday groceries" /></label>
          <label className="field"><span>Starts</span><input className="input" type="datetime-local" name="startsAt" required /></label>
          <label className="field"><span>Ends</span><input className="input" type="datetime-local" name="endsAt" /></label>
          <label className="field"><span>Notes for volunteers and neighbors</span><textarea className="input" name="notes" /></label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>On the calendar</h2>
        {days.length ? (
          <div className="grid">
            {days.map((day) => (
              <article className="card" key={day.id}>
                <span>{day.status}</span>
                <strong>{day.title}</strong>
                <p>{new Date(day.starts_at).toLocaleString()}</p>
                {day.notes ? <p>{day.notes}</p> : null}
                {day.status === "planned" ? (
                  <PostForm action="/api/distributions" submitLabel="Open this day">
                    <input type="hidden" name="id" value={day.id} />
                    <input type="hidden" name="status" value="open" />
                  </PostForm>
                ) : null}
                {day.status === "open" ? (
                  <PostForm action="/api/distributions" submitLabel="Mark done">
                    <input type="hidden" name="id" value={day.id} />
                    <input type="hidden" name="status" value="done" />
                  </PostForm>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No distribution days posted yet.</p>
        )}
      </section>
    </main>
  );
}
