import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { HANDOFFS, suggestHandoffs } from "@/lib/handoffs";
import { pathsForUser } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "More help after groceries",
  "After you get food at the Vidalia food pantry, you can write one next step. Optional. Food is never held back."
);

export default async function BecomePage() {
  const user = await getCurrentUser().catch(() => null);
  const paths = user ? await pathsForUser(user.id) : [];
  const latest = paths[0];
  const suggested = latest ? suggestHandoffs(`${latest.whats_hard} ${latest.who_they_want_to_become} ${latest.next_step}`) : HANDOFFS.slice(0, 3);

  return (
    <main className="shell">
      <p className="eyebrow">After groceries</p>
      <h1>More help, if you want it</h1>
      <p className="lede">
        The pantry's first job is food. If you also want help with work, bills, loneliness, or the
        person you want to become, you can write that here. It is optional. We will never hold
        groceries until you fill this out.
      </p>

      {!user ? (
        <section className="panel">
          <a className="button primary" href="/sign-in?next=/become">Create an account to write a next step</a>
        </section>
      ) : (
        <section className="panel">
          <h2>Write this season down</h2>
          <PostForm action="/api/paths" submitLabel="Save this next step">
            <p className="note">Pick a direction if you want. Then write it in your words.</p>
            <label className="check"><input type="radio" name="handoffApp" value="lom" /> Help someone else — volunteer</label>
            <label className="check"><input type="radio" name="handoffApp" value="churchconnect" /> Grow in faith</label>
            <label className="check"><input type="radio" name="handoffApp" value="bestlife" /> Learn a skill / get unstuck</label>
            <label className="field">
              <span>What is making this season hard</span>
              <textarea className="input" name="whatsHard" defaultValue={latest?.whats_hard || ""} placeholder="Work, bills, health, loneliness, a closed door…" />
            </label>
            <label className="field">
              <span>Who do you want to become</span>
              <textarea className="input" name="whoTheyWantToBecome" defaultValue={latest?.who_they_want_to_become || ""} placeholder="A present parent. Someone with a job. A neighbor who helps." />
            </label>
            <label className="field">
              <span>One next step this week</span>
              <input className="input" name="nextStep" defaultValue={latest?.next_step || ""} placeholder="Call about that job. Come volunteer Saturday." />
            </label>
          </PostForm>
        </section>
      )}

      <section className="panel">
        <p className="eyebrow">Other help</p>
        <h2>Places that can walk with you</h2>
        <p className="note">These open in a new tab. You can come back here for groceries anytime.</p>
        <div className="grid">
          {suggested.map((h) => (
            <article className="card" key={h.id}>
              <strong>{h.name}</strong>
              <p>{h.when}</p>
              <a className="button" href={h.href} target="_blank" rel="noopener noreferrer">Open {h.name}</a>
            </article>
          ))}
        </div>
        <p className="note">When you are ready, volunteering here is how receiving help becomes helping someone else.</p>
        <a className="button leaf" href="/volunteer">Volunteer at this food pantry</a>
      </section>

      {paths.length ? (
        <section className="panel">
          <p className="eyebrow">Your earlier notes</p>
          {paths.map((path) => (
            <article className="card" key={path.id}>
              <span>{new Date(path.created_at).toLocaleDateString()}</span>
              {path.whats_hard ? <p><strong>Hard:</strong> {path.whats_hard}</p> : null}
              {path.who_they_want_to_become ? <p><strong>Becoming:</strong> {path.who_they_want_to_become}</p> : null}
              {path.next_step ? <p><strong>Next:</strong> {path.next_step}</p> : null}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
