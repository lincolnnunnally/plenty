import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listPromos, weNeedList } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function defaultCopy(name: string, city: string, hours: string, needs: string[]) {
  const when = hours.trim() || "hours will be posted when they are real";
  const needLine = needs.length ? `We especially need: ${needs.join(", ")}.` : "Food, space, vehicles, and volunteers are welcome.";
  return `${name} in ${city} is a food pantry with a next step — groceries today, and a path toward the person you want to become. ${when}. ${needLine} Come, volunteer, or give: https://plenty.unitedundergod.org/p/vidalia`;
}

export default async function PromotePage() {
  const user = await requireCustomerAccess("/run/promote");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const needs = await weNeedList(pantry.id);
  const promos = await listPromos(pantry.id);
  const draft = defaultCopy(pantry.name, pantry.city || "Vidalia", pantry.hours_text, needs.map((n) => n.name));

  return (
    <main className="shell">
      <p className="eyebrow">Promote</p>
      <h1>Tell Vidalia we are here</h1>
      <p className="lede">
        Free is manual and complete: write the words, copy them to Facebook, Nextdoor, a flyer, or a
        church bulletin. We do not auto-post. Do not invent hours in the copy if they are blank above.
      </p>
      <RunNav />

      <section className="panel">
        <h2>Public page</h2>
        <p><a href={`/p/${pantry.slug}`}>https://plenty.unitedundergod.org/p/{pantry.slug}</a></p>
        <p className="note">List this pantry on Neighborly only after hours and address are real.</p>
        <a className="button" href="https://neighborly.unitedundergod.org/">Open Neighborly</a>
      </section>

      <section className="panel">
        <h2>Save copy for a channel</h2>
        <PostForm action="/api/promos" submitLabel="Save this copy">
          <label className="field">
            <span>Channel</span>
            <select className="input" name="channel" defaultValue="social">
              <option value="social">Social / Nextdoor</option>
              <option value="flyer">Flyer</option>
              <option value="email">Email</option>
              <option value="bulletin">Church bulletin</option>
              <option value="neighborly">Neighborly listing notes</option>
            </select>
          </label>
          <label className="field"><span>Title</span><input className="input" name="title" defaultValue={`${pantry.name} — come for groceries`} required /></label>
          <label className="field"><span>Words</span><textarea className="input" name="body" defaultValue={draft} required /></label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>Saved copy</h2>
        {promos.length ? (
          <div className="grid">
            {promos.map((promo) => (
              <article className="card" key={promo.id}>
                <span>{promo.channel} · {new Date(promo.created_at).toLocaleDateString()}</span>
                <strong>{promo.title}</strong>
                <p>{promo.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No promo copy saved yet. Save the draft above so you can paste it later.</p>
        )}
      </section>
    </main>
  );
}
