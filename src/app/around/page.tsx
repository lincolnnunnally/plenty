import { ensureToombsStartingPoints, getDefaultPantrySafe, listedAllies } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Food pantries in Vidalia and Lyons",
  "Plenty lists food pantries in Toombs County only after someone walks in. Hours are what we saw, not what a directory guessed."
);

export default async function AroundPage() {
  const pantry = await getDefaultPantrySafe();
  if (pantry) await ensureToombsStartingPoints(pantry.id).catch(() => 0);
  const listed = pantry ? await listedAllies(pantry.id).catch(() => []) : [];
  const open = listed.filter((a) => a.kind === "pantry" && a.relationship !== "closed");
  const closed = listed.filter((a) => a.relationship === "closed");
  const thrift = listed.filter((a) => a.kind === "thrift" && a.relationship !== "closed");
  const churches = listed.filter((a) => a.kind === "church" && a.relationship !== "closed");

  return (
    <main className="shell">
      <p className="eyebrow">Toombs County · Vidalia and Lyons</p>
      <h1>Food pantries we have checked</h1>
      <p className="lede">Hours only after someone walked in. If a building is empty, we say so.</p>

      {open.length ? (
        <section className="panel">
          <h2>Open</h2>
          <div className="grid">
            {open.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.city}{a.last_visited_at ? ` · checked ${new Date(a.last_visited_at).toLocaleDateString()}` : ""}</span>
                <strong>{a.name}</strong>
                {a.address ? <p>{a.address}</p> : null}
                {a.hours_text ? <p>{a.hours_text}</p> : <p className="note">Call for hours.</p>}
                {a.phone ? <p><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <p className="empty">No other pantry confirmed in person yet.</p>
      )}

      {closed.length ? (
        <section className="panel">
          <h2>Do not go here</h2>
          <div className="grid">
            {closed.map((a) => (
              <article className="card" key={a.id}>
                <span>Closed or moved{a.last_visited_at ? ` · ${new Date(a.last_visited_at).toLocaleDateString()}` : ""}</span>
                <strong>{a.name}</strong>
                {a.address ? <p>{a.address}</p> : null}
                <p>{a.visit_notes || a.hours_text || "Building empty or moved."}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {thrift.length ? (
        <section className="panel">
          <h2>Thrift stores</h2>
          <div className="grid">
            {thrift.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.city}</span>
                <strong>{a.name}</strong>
                {a.address ? <p>{a.address}</p> : null}
                {a.hours_text ? <p>{a.hours_text}</p> : null}
                {a.phone ? <p><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {churches.length ? (
        <section className="panel">
          <h2>Churches that asked to be listed</h2>
          <div className="grid">
            {churches.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.city}</span>
                <strong>{a.name}</strong>
                {a.hours_text ? <p>{a.hours_text}</p> : null}
                {a.phone ? <p><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="note">
        Need groceries from Plenty? <a href="/need-food">Get food</a>.
        {" "}Want to help? <a href="/volunteer">Volunteer</a>.
      </p>
    </main>
  );
}
