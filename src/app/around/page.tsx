import { getDefaultPantrySafe, listedAllies } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Food pantries in Vidalia and Lyons",
  "Plenty is getting established in Toombs County. Here are other pantries and thrift stores we have confirmed in person. Call first."
);

export default async function AroundPage() {
  const pantry = await getDefaultPantrySafe();
  const listed = pantry ? await listedAllies(pantry.id).catch(() => []) : [];
  const pantries = listed.filter((a) => a.kind === "pantry");
  const thrift = listed.filter((a) => a.kind === "thrift");
  const churches = listed.filter((a) => a.kind === "church");

  return (
    <main className="shell">
      <p className="eyebrow">Toombs County · Vidalia and Lyons</p>
      <h1>Other places you can go</h1>
      <p className="lede">
        Plenty is getting established. We will not invent hours. Until we post ours, these are places
        we have actually visited or confirmed. If a pantry is happy doing their own thing, we leave them be.
      </p>

      {pantries.length ? (
        <section className="panel">
          <h2>Food pantries</h2>
          <div className="grid">
            {pantries.map((a) => (
              <article className="card" key={a.id}>
                <span>{a.city}</span>
                <strong>{a.name}</strong>
                {a.address ? <p>{a.address}</p> : null}
                {a.hours_text ? <p>{a.hours_text}</p> : <p className="note">Call for hours.</p>}
                {a.phone ? <p><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <p className="empty">
          We have not confirmed another pantry in person yet. That is honest. Call Plenty when our hours are posted,
          or ask a church you already trust.
        </p>
      )}

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
        {" "}Want to help an existing pantry? <a href="/volunteer">Volunteer</a>.
      </p>
    </main>
  );
}
