"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeskSwitch({
  pantries,
  currentId
}: {
  pantries: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (pantries.length < 2) return null;

  async function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const pantryId = event.target.value;
    setBusy(true);
    await fetch("/api/desk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pantryId })
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <label className="desk-switch">
      <span>Desk</span>
      <select className="input" value={currentId} onChange={onChange} disabled={busy}>
        {pantries.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}
