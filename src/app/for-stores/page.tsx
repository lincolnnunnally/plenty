import { PostForm } from "@/components/post-form";
import { PrintButton } from "@/components/print-button";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { FOOD_TYPES, STORE_PITCH, WEEKDAYS } from "@/lib/store-pitch";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMeta(
  "Donating leftover food is better business than throwing it away",
  "Tax deduction, two legal shields, a weekly pickup. Plenty is a program of United Under God, Inc., EIN 81-3554390."
);

export default function ForStoresPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Grocery stores · warehouses · farms</p>
      <h1>Throwing food away is the expensive option.</h1>
      <p className="lede">A deduction. Two legal shields. A weekly pickup. We route it to the pantry that can use it first.</p>
      <p className="note">EIN {EIN} · {LEGAL_NAME} · 501(c)(3)</p>

      <div className="grid" style={{ marginTop: 18 }}>
        {STORE_PITCH.map((item) => (
          <article className="card" key={item.kicker}>
            <span>{item.kicker}</span>
            <strong>{item.title}</strong>
            <p>{item.line}</p>
          </article>
        ))}
      </div>

      <section className="panel" id="signup">
        <h2>Set a repeating pickup</h2>
        <p className="note">We come on that day. Pickup volunteers get a text. The desk sees the load. Produce goes where it will be eaten soonest.</p>
        <PostForm action="/api/store-partners" submitLabel="Schedule pickup">
          <input type="hidden" name="asInterest" value="1" />
          <label className="field"><span>Store name</span><input className="input" name="name" required /></label>
          <label className="field"><span>Address</span><input className="input" name="address" /></label>
          <label className="field"><span>Manager</span><input className="input" name="contactName" required /></label>
          <label className="field"><span>Phone</span><input className="input" name="phone" required /></label>
          <label className="field"><span>Email</span><input className="input" name="contactEmail" type="email" /></label>
          <div className="grid">
            <label className="field">
              <span>Pickup day</span>
              <select className="input" name="weekday" defaultValue="5">
                {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="field"><span>Time</span><input className="input" name="timeLocal" type="time" defaultValue="18:00" required /></label>
          </div>
          <p className="note">Usually on the dock</p>
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
