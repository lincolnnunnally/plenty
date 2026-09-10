"use client";

import { useState } from "react";

export function ChannelOpen({ href, label, copyFirst }: { href: string; label: string; copyFirst?: string }) {
  const [note, setNote] = useState<string | null>(null);
  async function go() {
    if (copyFirst) {
      try {
        await navigator.clipboard.writeText(copyFirst);
        setNote("Post text copied. Paste it in the window that opens.");
      } catch {
        setNote("Open the window, then paste from the box above.");
      }
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }
  return (
    <div>
      <button className="button leaf" type="button" onClick={() => void go()}>
        {label}
      </button>
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
