import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth/session";
import { FOOD_WAIVER_PARAGRAPHS, FOOD_WAIVER_TITLE, FOOD_WAIVER_VERSION } from "@/lib/legal/food-waiver";
import { getDefaultPantrySafe, householdForUser, latestWaiverForUser } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Food responsibility agreement",
  "Before you take food from Plenty in Vidalia, sign this short agreement. It protects grocery stores and the pantry so donated food can keep coming."
);

export default async function WaiverPage() {
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  const household = user && pantry ? await householdForUser(pantry.id, user.id).catch(() => null) : null;
  const signed = user && pantry ? await latestWaiverForUser(pantry.id, user.id).catch(() => null) : null;
  const current =
    signed?.version === FOOD_WAIVER_VERSION ||
    (household?.food_waiver_version === FOOD_WAIVER_VERSION && Boolean(household.food_waiver_signed_at));

  return (
    <main className="shell">
      <p className="eyebrow">Vidalia food pantry</p>
      <h1>{FOOD_WAIVER_TITLE}</h1>
      <p className="lede">
        Grocery stores can keep donating when they know the food will not come back as a lawsuit.
        This is a short record that you understand donated food and choose to take it. It is not a
        test, and it is not a bill.
      </p>

      <section className="panel">
        {FOOD_WAIVER_PARAGRAPHS.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="note">Version {FOOD_WAIVER_VERSION}. This is not legal advice.</p>
      </section>

      {!user ? (
        <section className="panel">
          <h2>Sign in to agree</h2>
          <p>Create a free account or sign in, then check the box with your name. A QR code at the pantry line opens this same page.</p>
          <a className="button primary" href="/sign-in?next=/waiver&as=neighbor">Create an account / sign in</a>
        </section>
      ) : current ? (
        <section className="panel">
          <h2>You have signed</h2>
          <p>Thank you, {signed?.signed_name || user.name}. Version {FOOD_WAIVER_VERSION} is on file{signed ? ` as of ${new Date(signed.created_at).toLocaleString()}` : ""}.</p>
          <a className="button primary" href="/need-food">Get food</a>
        </section>
      ) : (
        <section className="panel">
          <h2>I agree</h2>
          {!household ? <p className="note">Register your household after this if you have not yet. You can sign now either way.</p> : null}
          <PostForm action="/api/waivers" submitLabel="I agree and I am responsible for the food I take" successHref="/need-food">
            <label className="field">
              <span>Type your name as your signature</span>
              <input className="input" name="signedName" defaultValue={user.name} required />
            </label>
            <label className="check">
              <input type="checkbox" name="agreed" required />
              I have read this agreement. I choose to receive donated food as-is. I will not hold the pantry, volunteers, or the stores that donated the food responsible if someone in my household gets sick, except where the law does not allow that. I know food is still given if I cannot donate money.
            </label>
          </PostForm>
        </section>
      )}

      <p className="note">Stores and warehouses: <a href="/for-stores">why donating pays, and why you are covered</a>.</p>
    </main>
  );
}
