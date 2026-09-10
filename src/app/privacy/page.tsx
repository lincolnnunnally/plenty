export const dynamic = "force-static";

const UPDATED = "September 9, 2026";
const CONTACT = "lincoln@unitedundergod.org";

export const metadata = {
  title: "Privacy Policy",
  description: "How Plenty collects, uses, and protects your information."
};

export default function PrivacyPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p className="note">Last updated: {UPDATED}</p>
      <div className="panel">
        <p><strong>Who we are.</strong> Plenty is operated by United Under God. This policy explains what information we collect, how we use it, and the choices you have.</p>
        <p><strong>Information you give us.</strong> When you create an account we collect your email address and, if you provide it, your name. Your sign-in is handled through our shared United Under God identity system. When you use Plenty you may also provide: household details; visit notes; volunteer availability; offers of food, money, space, or vehicles; and optional path notes about what is hard and who you want to become.</p>
        <p><strong>Path notes are sensitive.</strong> What you write on A path is for you and pantry stewards who walk with you — not a public feed, not a score, and never a condition of receiving food.</p>
        <p><strong>How we use your information.</strong> We use it to operate the pantry: to welcome you, stock shelves, staff shifts, follow up on gifts, and (only if you ask) point you to a next step in the United Under God ecosystem.</p>
        <p><strong>How we share information.</strong> We do not sell your personal information. We share it only with the service providers that run the Platform, when required by law, or in the ordinary operation of a feature you use (for example, a steward seeing your household so they can check you in).</p>
        <p><strong>Children.</strong> The Platform is intended for adults 18 and older who register a household. We do not knowingly collect personal information from children under 18 as account holders.</p>
        <p><strong>Your choices.</strong> You may access and correct your information or request deletion. Contact {CONTACT}.</p>
      </div>
    </main>
  );
}
