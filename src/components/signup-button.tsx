"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignupButton({ shiftId, signedUp }: { shiftId: string; signedUp: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(signedUp);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/shifts/${shiftId}/signup`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || payload.ok === false) {
        setError(payload.message || "Could not sign up.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="note">You are on this shift.</p>;
  return (
    <div>
      <button className="button primary" type="button" onClick={() => void go()} disabled={busy}>
        {busy ? "Signing up…" : "I'll take this shift"}
      </button>
      {error ? <p className="note error" role="alert">{error}</p> : null}
    </div>
  );
}
