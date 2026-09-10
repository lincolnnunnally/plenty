import { PostForm } from "@/components/post-form";
import { RunNav } from "@/components/run-nav";
import { requireCustomerAccess } from "@/lib/auth/session";
import { getDefaultPantry, isSteward, listInventory } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await requireCustomerAccess("/run/inventory");
  const pantry = await getDefaultPantry();
  if (!pantry) redirect("/run");
  if (!(await isSteward(pantry.id, user.id, user.role))) redirect("/app");
  const items = await listInventory(pantry.id);

  return (
    <main className="shell">
      <p className="eyebrow">Shelves</p>
      <h1>What we have and what we need</h1>
      <RunNav />

      <section className="panel">
        <h2>Add an item</h2>
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
          <label className="field"><span>Quantity</span><input className="input" name="quantity" type="number" min={0} defaultValue={0} /></label>
          <label className="field"><span>Unit</span><input className="input" name="unit" defaultValue="item" /></label>
          <label className="check"><input type="checkbox" name="availableThisWeek" defaultChecked /> Available this week (neighbors will see it)</label>
          <label className="check"><input type="checkbox" name="weNeed" /> We need this (donors will see it)</label>
          <label className="field"><span>Notes</span><input className="input" name="notes" /></label>
        </PostForm>
      </section>

      <section className="panel">
        <h2>On hand</h2>
        {items.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>This week</th><th>We need</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}<div className="note">{item.category}</div></td>
                    <td>
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel="Save">
                        <input className="input" name="quantity" type="number" min={0} defaultValue={item.quantity} />
                        <input type="hidden" name="availableThisWeek" value={item.available_this_week ? "true" : "false"} />
                        <input type="hidden" name="weNeed" value={item.we_need ? "true" : "false"} />
                      </PostForm>
                    </td>
                    <td>{item.available_this_week ? "yes" : "no"}</td>
                    <td>{item.we_need ? "yes" : "no"}</td>
                    <td>
                      <PostForm action={`/api/inventory/${item.id}`} submitLabel={item.available_this_week ? "Hide this week" : "Show this week"}>
                        <input type="hidden" name="availableThisWeek" value={item.available_this_week ? "false" : "true"} />
                      </PostForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No items yet. Add the first real thing on the shelf — do not invent stock.</p>
        )}
      </section>
    </main>
  );
}
