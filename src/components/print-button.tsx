"use client";

export function PrintButton({ label = "Print this page" }: { label?: string }) {
  return (
    <button className="button primary print-hide" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
