"use client";

import { useState } from "react";

export function PhotoField({ name = "imageUrl", defaultUrl = "", label = "Photo (so families can see what they will get)" }: { name?: string; defaultUrl?: string; label?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; message?: string };
      if (!response.ok || !payload.url) {
        setError(payload.message || "Could not upload the photo.");
        return;
      }
      setUrl(payload.url);
    } catch {
      setError("Could not upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="file" accept="image/*" capture="environment" onChange={(event) => void onFile(event.target.files?.[0])} />
      <input type="hidden" name={name} value={url} />
      {busy ? <p className="note">Uploading photo…</p> : null}
      {error ? <p className="note error">{error}</p> : null}
      {url ? <img className="thumb" src={url} alt="" /> : null}
    </label>
  );
}
