import { PostForm } from "@/components/post-form";
import { PrintButton } from "@/components/print-button";
import { StoreCalculator } from "@/components/store-calculator";
import { StorePitchCase, StorePitchIntro } from "@/components/store-pitch";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { FOOD_TYPES, STORE_CONCERNS, STORE_DESCRIPTION, STORE_TITLE, WEEKDAYS } from "@/lib/store-pitch";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(STORE_TITLE, STORE_DESCRIPTION);

export default function ForStoresPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Grocery stores · warehouses · farms</p>
      <StorePitchIntro einLine={`EIN ${EIN} · ${LEGAL_NAME} · 501(c)(3) · Plenty is our pantry program`} />
      <div className="action-row" style={{ marginTop: 16 }}>
        <a className="button primary" href="#signup">Leave a pickup — or just a name</a>
        <a className="button" href="#calculator">Punch your numbers</a>
        <a className="button" href="/for-stores/brief">Print the one-pager</a>
        <a className="button" href="/tax-exempt">EIN letter</a>
      </div>
      <StorePitchCase />
      <StoreCalculator />

      <section className="panel">
        <h2>If you are not sure</h2>
        <div className="grid">
          {STORE_CONCERNS.map((item) => (
            <article className="card" key={item.value}>
              <strong>{item.title}</strong>
              <p>{item.line}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="signup">
        <h2>Set a pickup — or just talk</h2>
        <p className="note">A weekly day is optional. If corporate has to say yes, leave a name. We wait.</p>
        <PostForm action="/api/store-partners" submitLabel="Send this to the pantry">
          <input type="hidden" name="asInterest" value="1" />
          <label className="field"><span>Store name</span><input className="input" name="name" required /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <label className="field"><span>Manager</span><input className="input" name="contactName" required /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" required /></label>
          <label className="field"><span>Email</span><input className="input" name="contactEmail" type="email" /></label>
          <div className="grid">
            <label className="field">
              <span>Pickup day (optional)</span>
              <select className="input" name="weekday" defaultValue="">
                <option value="">Not yet — just talk</option>
                {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Time (optional)</span><input className="input" name="timeLocal" type="time" /></label>
          </div>
          <p className="note">Usually on the dock. We come to you.</p>
          <div className="chip-row">
            {FOOD_TYPES.map((t) => (
              <label className="check" key={t.value}><input type="checkbox" name="foodTypes" value={t.value} defaultChecked={t.value === "dry"} /> {t.label}</label>
            ))}
          </div>
          <label className="field">
            <span>How you want to give</span>
            <select className="input" name="how" defaultValue="dock_pickup">
              <option value="dock_pickup">We pick up at your dock</option>
              <option value="hold_desk">Hold a bag at customer service</option>
              <option value="store_meet">Volunteers may meet families in your store</option>
            </select>
          </label>
          <p className="note">What is in the way? Check any that apply.</p>
          <div className="chip-row">
            {STORE_CONCERNS.map((c) => (
              <label className="check" key={c.value}><input type="checkbox" name="concerns" value={c.value} /> {c.title}</label>
            ))}
          </div>
          <label className="field"><span>Anything else</span><input className="input" name="notes" placeholder="Need a corporate packet, only dry, Thursday close…" /></label>
        </PostForm>
      </section>

      <div className="action-row">
        <a className="button" href="/for-stores/brief">Print one-pager</a>
        <PrintButton label="Print this page" />
        <a className="button" href="/tax-exempt">EIN letter</a>
      </div>
    </main>
  );
}
