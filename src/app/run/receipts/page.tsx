import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, getTaxProfile, isSteward, receivedMoneyGifts } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const user = await requireCustomerAccess("/run/receipts");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const tax = await getTaxProfile(pantry.id);
  const year = new Date().getFullYear();
  const gifts = await receivedMoneyGifts(pantry.id, year);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Tax letter and year-end receipts</h1>
      <p className="lede">Do not post an EIN or 501(c)(3) claim until you have the letter. Until then, gifts are still recorded.</p>
      <RunNav />

      <section className="panel">
        <h2>Tax-exempt letter</h2>
        <PostForm action="/api/tax" submitLabel="Save tax info">
          <label className="field"><span>Legal name</span><input className="input" name="legalName" defaultValue={tax?.legal_name || ""} /></label>
          <label className="field"><span>EIN</span><input className="input" name="ein" defaultValue={tax?.ein || ""} /></label>
          <label className="field"><span>Link to the determination letter (optional)</span><input className="input" name="letterUrl" defaultValue={tax?.letter_url || ""} /></label>
          <label className="field"><span>Letter text (optional)</span><textarea className="input" name="letterText" defaultValue={tax?.letter_text || ""} /></label>
          <label className="check"><input type="checkbox" name="posted" defaultChecked={tax?.posted} /> Show this on the public tax-exempt page</label>
        </PostForm>
        <p className="note">Public page: <a href="/tax-exempt">/tax-exempt</a></p>
      </section>

      <section className="panel">
        <h2>Money gifts received in {year}</h2>
        {gifts.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Receipt</th></tr></thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id}>
                    <td>{new Date(g.received_at || g.created_at).toLocaleDateString()}</td>
                    <td>{g.contact_name || g.contact_email}</td>
                    <td>${((g.amount_cents || 0) / 100).toFixed(0)}</td>
                    <td>
                      {g.receipt_sent ? "sent" : (
                        <PostForm action="/api/receipts" submitLabel="Mark sent">
                          <input type="hidden" name="id" value={g.id} />
                        </PostForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No received money gifts this year. Mark a money offer as received on Gifts first.</p>
        )}
      </section>
    </main>
  );
}
