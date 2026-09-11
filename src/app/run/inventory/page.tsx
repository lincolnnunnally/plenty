import { PhotoField } from "@/components/photo-field";
import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requirePantryDesk } from "@/lib/auth/session";
import { listInventory, listStockMoves } from "@/lib/db/queries";
import { poundsFrom } from "@/lib/pounds";
import { giveFirst, sortForUse, useByFromNotes, useByLabel } from "@/lib/use-by";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { pantry } = await requirePantryDesk("/run/inventory");
  if (!pantry) redirect("/run");
  const items = sortForUse(await listInventory(pantry.id));
  const first = giveFirst(items);
  const moves = await listStockMoves(pantry.id);
  const month = new Date().toISOString().slice(0, 7);
  const monthMoves = moves.filter((m) => (m.created_at || "").startsWith(month));
  const inLb = monthMoves.filter((m) => m.direction === "in").reduce((sum, m) => sum + poundsFrom({ quantity: m.quantity, note: m.note }), 0);
  const outLb = monthMoves.filter((m) => m.direction === "out").reduce((sum, m) => sum + poundsFrom({ quantity: m.quantity, note: m.note }), 0);

  return (
    <main className="shell">
      <p className="eyebrow">Pantry desk</p>
      <h1>Inventory — in, on hand, out</h1>
      <p className="lede">Photo. How many. Use-by. Give the short-dated food first. The line subtracts what goes in the bag.</p>
      <RunNav />
      <p className="note">This month: {inLb || 0} lb in · {outLb || 0} lb out. Put pounds on the in/out form so grant reports have a number.</p>

      <section className="panel">
        <h2>Add an item to the shelf</h2>
        <PostForm action="/api/inventory" submitLabel="Add to shelves">
          <label className="field"><span>Name</span><input className="input" name="name" required /></label>
          <label className="field">
            <span>Category</span>
            <select className="input" name="category" defaultValue="staple">
              <option value="produce">Produce</option>
              <option value="protein">Protein</option>
              <option value="dairy">Dairy</option>
              <option value="staple">Staple</option>
              <option value="household">Household</option>
              <option value="baby">Baby</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="field"><span>Quantity on hand</span><input className="input" name="quantity" type="number" min={0} defaultValue={0} /></label>
          <label className="field"><span>Use by</span><input className="input" name="useBy" type="date" /></label>
          <label className="field"><span>Unit</span><input className="input" name="unit" defaultValue="item" /></label>
          <label className="field"><span>Low at (we need more below this)</span><input className="input" name="lowAt" type="number" min={0} placeholder="Leave blank if you do not track this" /></label>
          <label className="check"><input type="checkbox" name="availableThisWeek" defaultChecked /> Show on this week's food list (families will see it)</label>
          <label className="check"><input type="checkbox" name="weNeed" /> We need this (donors will see it)</label>
          <PhotoField label="Take a photo of this item" />
          <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>Record food in or out</h2>
        <PostForm action="/api/stock" submitLabel="Record">
          <label className="field">
            <span>In or out</span>
            <select className="input" name="direction" defaultValue="in">
              <option value="in">Came in (donation, purchase, pickup)</option>
              <option value="out">Went out (given to a family)</option>
            </select>
          </label>
          <label className="field">
            <span>Item on the shelf (optional)</span>
            <select className="input" name="inventoryId" defaultValue="">
              <option value="">Not on the list yet</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>
              ))}
            </select>
          </label>
          <label className="field"><span>Name if not on the list</span><input className="input" name="itemName" /></label>
          <label className="field"><span>How many</span><input className="input" name="quantity" type="number" min={1} defaultValue={1} /></label>
          <label className="field"><span>Pounds (for grants)</span><input className="input" name="pounds" type="number" min={0} step="0.1" placeholder="If you weighed it" /></label>
          <label className="field"><span>Note</span><input className="input" name="note" placeholder="Saturday line, store pickup, unsold" /></label>
        </PostForm>
      </section>

      {first.length ? (
        <section className="panel">
          <h2>Give these first</h2>
          <p className="note">Short date or already past the label. Still food. Put them in bags before the canned goods.</p>
          <div className="grid">
            {first.map((item) => (
              <article className="card" key={item.id}>
                {item.image_url ? <img className="thumb" src={item.image_url} alt={item.name} /> : null}
                <strong>{item.name}</strong>
                <p>{item.quantity} {item.unit} · {useByLabel(useByFromNotes(item.notes))}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>On hand</h2>
        {items.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Use by</th><th>This week</th><th>Photo</th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}<div className="note">{item.category}{item.we_need ? " · needed" : ""}{item.low_at != null && item.quantity <= item.low_at ? " · low" : ""}{item.quantity <= 0 ? " · out" : ""}</div></td>
                    <td>
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel="Save qty">
                        <input className="input" name="quantity" type="number" min={0} defaultValue={item.quantity} />
                      </PostForm>
                    </td>
                    <td>
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel="Save date">
                        <input className="input" name="useBy" type="date" defaultValue={useByFromNotes(item.notes)} />
                      </PostForm>
                      {useByFromNotes(item.notes) ? <p className="note">{useByLabel(useByFromNotes(item.notes))}</p> : null}
                    </td>
                    <td>
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel={item.available_this_week ? "Hide this week" : "Show this week"}>
                        <input type="hidden" name="availableThisWeek" value={item.available_this_week ? "false" : "true"} />
                      </PostForm>
                    </td>
                    <td>
                      {item.image_url ? <img className="thumb" src={item.image_url} alt="" /> : null}
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel="Save photo">
                        <PhotoField defaultUrl={item.image_url} label="Photo" />
                      </PostForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No items yet. Add the first real thing on the shelf.</p>
        )}
      </section>

      <section className="panel">
        <h2>In / out log</h2>
        {moves.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>When</th><th></th><th>Item</th><th>Qty</th><th>Note</th></tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>{m.direction === "in" ? "IN" : "OUT"}</td>
                    <td>{m.item_name || "—"}</td>
                    <td>{m.quantity}</td>
                    <td>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No in/out records yet.</p>
        )}
      </section>
    </main>
  );
}
