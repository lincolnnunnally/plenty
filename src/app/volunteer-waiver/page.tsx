import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { VOLUNTEER_WAIVER_PARAGRAPHS, VOLUNTEER_WAIVER_TITLE, VOLUNTEER_WAIVER_VERSION } from "@/lib/legal/volunteer-waiver";
import { getDefaultPantrySafe, latestWaiverForUser } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Volunteer agreement",
  "A short record that you choose to volunteer at Plenty. Food for households is never gated on this form."
);

export default async function VolunteerWaiverPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const signed = user && pantry ? await latestWaiverForUser(pantry.id, user.id, VOLUNTEER_WAIVER_VERSION).catch(() => null) : null;

  return (
    <main className="shell">
      <p className="eyebrow">Volunteer</p>
      <h1>{VOLUNTEER_WAIVER_TITLE}</h1>
      <p className="lede">Not a job. Not a background check. Food for families is never held for this form.</p>

      <section className="panel">
        {VOLUNTEER_WAIVER_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="note">Version {VOLUNTEER_WAIVER_VERSION}. This is not legal advice.</p>
      </section>

      {!user ? (
        <section className="panel">
          <h2>Sign in to agree</h2>
          <a className="button primary" href="/sign-in?next=/volunteer-waiver&as=volunteer">Create an account / sign in</a>
        </section>
      ) : signed ? (
        <section className="panel">
          <h2>You have signed</h2>
          <p>Thank you, {signed.signed_name || user.name}. On file as of {new Date(signed.created_at).toLocaleString()}.</p>
          <a className="button primary" href="/volunteer">Take a shift</a>
        </section>
      ) : (
        <section className="panel">
          <h2>Agree</h2>
          <PostForm action="/api/waivers" submitLabel="I agree" successHref="/volunteer">
            <input type="hidden" name="kind" value="volunteer" />
            <input type="hidden" name="agreed" value="0" />
            <label className="field"><span>Your name</span><input className="input" name="signedName" defaultValue={user.name} required /></label>
            <label className="check"><input type="checkbox" name="agreed" value="true" required /> I have read this and I agree</label>
          </PostForm>
        </section>
      )}
    </main>
  );
}
