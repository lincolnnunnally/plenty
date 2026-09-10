"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string, body?: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!response.ok || payload.ok === false) throw new Error(payload.message || "Could not update that shift.");
  return payload.message || "Saved.";
}

export function SignupButton({ shiftId, signedUp }: { shiftId: string; signedUp: boolean }) {
  return <ShiftActions shiftId={shiftId} status={signedUp ? "signed" : ""} />;
}

export function ShiftActions({
  shiftId,
  status,
  coverUserId
}: {
  shiftId: string;
  status: string;
  coverUserId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: string, extra?: Record<string, string>) {
    setBusy(true);
    setError(null);
    try {
      await post(`/api/shifts/${shiftId}/signup`, { action, ...extra });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const note = error ? <p className="note error" role="alert">{error}</p> : null;

  if (!status) {
    return (
      <div>
        <button className="button primary" type="button" onClick={() => void run("signup")} disabled={busy}>
          {busy ? "Signing up…" : "I'll take this shift"}
        </button>
        {note}
      </div>
    );
  }

  if (status === "needs_cover" && coverUserId) {
    return (
      <div>
        <button className="button leaf" type="button" onClick={() => void run("take_cover", { userId: coverUserId })} disabled={busy}>
          {busy ? "Saving…" : "I can cover this"}
        </button>
        {note}
      </div>
    );
  }

  if (status === "cancelled" || status === "covered") {
    return <p className="note">{status === "covered" ? "Someone covered this shift." : "You cancelled this shift."}</p>;
  }

  return (
    <div className="action-row">
      {status !== "confirmed" ? (
        <button className="button leaf" type="button" onClick={() => void run("confirm")} disabled={busy}>
          I'll be there
        </button>
      ) : (
        <p className="note">Confirmed — we will look for you.</p>
      )}
      <button className="button" type="button" onClick={() => void run("need_cover")} disabled={busy}>
        I need someone to cover
      </button>
      <button className="button" type="button" onClick={() => void run("cancel")} disabled={busy}>
        I cannot come
      </button>
      {note}
    </div>
  );
}
