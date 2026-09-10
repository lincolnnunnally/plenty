import { getCurrentUser } from "@/lib/auth/session";
import { addDonation, getDefaultPantrySafe, listDonations, setDonationStatus } from "@/lib/db/queries";
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
            title: "Card gift",
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
      <p>Food is never held back because someone cannot give.</p>
      <div className="action-row">
        <a className="button primary" href="/donate">Back to Give</a>
        <a className="button" href="/need-food">Get food</a>
      </div>
    </main>
  );
}
