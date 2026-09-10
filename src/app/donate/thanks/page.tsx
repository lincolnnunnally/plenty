import { getCurrentUser } from "@/lib/auth/session";
import { addContribution, addDonation, getDefaultPantrySafe, listContributions, listDonations, setDonationStatus } from "@/lib/db/queries";
import { pageMeta } from "@/lib/seo";
import { readPlentySession, stripeConfigured } from "@/lib/stripe-give";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("Thank you for giving", "Your gift to Plenty food pantry is recorded. Food is never held back from a household because of money.");

export default async function DonateThanksPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  const pantry = await getDefaultPantrySafe();
  let paid = false;
  let amount = 0;
  if (sessionId && (await stripeConfigured())) {
    try {
      const session = await readPlentySession(sessionId);
      paid = session.paid;
      amount = session.amountCents;
      if (paid && pantry) {
        const gifts = await listDonations(pantry.id);
        const mine = gifts.find((g) => g.kind === "money" && g.description.includes(sessionId));
        if (mine && mine.status !== "received") await setDonationStatus(mine.id, "received", "Stripe checkout paid");
        if (!mine) {
          await addDonation({
            pantryId: pantry.id,
            userId: user?.id || null,
            kind: "money",
            title: session.metadata.timing === "gift" ? "Card gift" : "Handling donation",
            description: `Stripe session ${sessionId}`,
            quantity: "",
            amountCents: amount,
            availableWhen: "paid",
            contactName: session.name || user?.name || "",
            contactPhone: "",
            contactEmail: session.email || user?.email || ""
          });
          const giftsNow = await listDonations(pantry.id);
          const row = giftsNow.find((g) => g.kind === "money" && g.description.includes(sessionId));
          if (row) await setDonationStatus(row.id, "received", "Stripe checkout paid");
        }
        const householdId = session.metadata.household_id;
        if (householdId) {
          const prior = (await listContributions(pantry.id)).find((c) => c.notes.includes(sessionId));
          if (!prior) {
            await addContribution({
              pantryId: pantry.id,
              householdId,
              userId: user?.id || null,
              amountCents: amount,
              waived: false,
              waiveReason: "",
              notes: `Stripe session ${sessionId}`,
              visitId: null,
              timing: session.metadata.timing || "upfront"
            });
          }
        }
      }
    } catch {
      paid = false;
    }
  }

  return (
    <main className="shell">
      <p className="eyebrow">Give</p>
      <h1>{paid ? "Thank you. The gift is received." : "We could not confirm that card gift yet."}</h1>
      <p className="lede">
        {paid
          ? `$${(amount / 100).toFixed(0)} is recorded for Plenty, a program of United Under God, Inc. If we have your email, a year-end receipt is on your account.`
          : "If you closed the tab after paying, we will still see it when we reconcile. You can also give with Cash App, Venmo, or Zelle."}
      </p>
      <p>Thank you. Groceries on the line stay free. This gift helps handling and what we are short on.</p>
      <div className="action-row">
        <a className="button primary" href="/account">Your pass at the line</a>
        <a className="button" href="/need-food">Get food</a>
        <a className="button" href="/donate">Give</a>
      </div>
    </main>
  );
}
