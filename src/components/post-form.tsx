"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  action: string;
  children: React.ReactNode;
  submitLabel: string;
  successHref?: string;
  className?: string;
};

export function PostForm({ action, children, submitLabel, successHref, className }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, string | string[]> = {};
    for (const [key, value] of data.entries()) {
      const next = String(value);
      if (key in body) {
        const current = body[key];
        body[key] = Array.isArray(current) ? [...current, next] : [current, next];
      } else {
        body[key] = next;
      }
    }
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || payload.ok === false) {
        setError(payload.message || "That did not save. Try again.");
        return;
      }
      form.reset();
      setOk(payload.message || "Saved.");
      if (successHref) {
        router.push(successHref);
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={className || "stack"} onSubmit={onSubmit}>
      {children}
      {error ? <p className="note error" role="alert">{error}</p> : null}
      {ok ? <p className="note">{ok}</p> : null}
      <button className="button primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
