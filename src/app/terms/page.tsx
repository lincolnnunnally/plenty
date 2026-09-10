import Link from "next/link";

export const dynamic = "force-static";

const UPDATED = "September 9, 2026";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Plenty."
};

export default function TermsPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Legal</p>
      <h1>Terms of Service</h1>
      <p className="note">Last updated: {UPDATED}</p>
      <div className="panel">
        <p><strong>1. Acceptance.</strong> Plenty (“the Platform”) is operated by United Under God. By creating an account or using the Platform, you agree to these Terms and to our <Link href="/privacy">Privacy Policy</Link>.</p>
        <p><strong>2. What Plenty is.</strong> The Platform helps a food pantry set up, run, and promote itself: neighbors receive groceries; volunteers pick up, set up, and serve; donors offer food, money, space, and vehicles; and neighbors may optionally walk a path toward the person they want to become. Food is never conditioned on answering growth questions.</p>
        <p><strong>3. Eligibility.</strong> The Platform is intended for adults 18 years of age or older.</p>
        <p><strong>4. Gifts of money.</strong> Plenty does not charge cards in the app. A money gift is a pledge. Do not treat a recorded pledge as a completed donation until a steward has received it.</p>
        <p><strong>5. No professional advice.</strong> Path notes, referrals, and next-step suggestions are not legal, medical, financial, or therapeutic advice.</p>
        <p><strong>6. Conduct.</strong> You agree not to use the Platform for any unlawful purpose; harass or harm another person; misrepresent a need or a gift; or violate anyone’s privacy.</p>
        <p><strong>7. No warranty.</strong> The Platform is provided “as is.” We do not guarantee that shelves will be stocked, that shifts will be filled, or that every offer can be received.</p>
        <p><strong>8. Contact.</strong> lincoln@unitedundergod.org</p>
      </div>
    </main>
  );
}
