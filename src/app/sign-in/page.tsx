"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "join";
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/app";

  const [mode, setMode] = useState<"join" | "signin">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === "join" && !agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "join") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        if (!response.ok || !payload.ok) {
          setError(payload.message || "Could not create the account. Please try again.");
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(mode === "join" ? "Account created, but sign-in failed. Try signing in." : "That email and password didn't match. Try again.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function requestReset() {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter your email above first, then request a reset.");
      setInfo(null);
      return;
    }
    setResetBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(
        "https://uqhqulrqcygsmmzdzemx.supabase.co/functions/v1/ecosystem-auth-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app: "plenty", email: trimmed })
        }
      );
      if (!res.ok) {
        setError("Couldn't send a reset email right now. Try again in a few minutes.");
        return;
      }
      setInfo("If an account exists for that email, we have sent a password reset link. Check your inbox.");
    } catch {
      setError("Couldn't send a reset email right now. Try again in a few minutes.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <main className="shell hero">
      <p className="eyebrow">{mode === "join" ? "Join Plenty" : "Welcome back"}</p>
      <h1>{mode === "join" ? "One table. One account." : "Sign in to Plenty"}</h1>
      <p>
        {mode === "join"
          ? "The same United Under God account works across the ecosystem. Create it here if you do not have one yet."
          : "Pick up where you left off — groceries, a shift, a gift, or a next step."}
      </p>

      {error ? <p className="note error" role="alert">{error}</p> : null}
      {info ? <p className="note">{info}</p> : null}

      <form className="stack" onSubmit={submit}>
        {mode === "join" ? (
          <input className="input" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" aria-label="Your name" />
        ) : null}
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" aria-label="Email" required />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === "join" ? "Choose a password (8+ characters)" : "Password"}
          autoComplete={mode === "join" ? "new-password" : "current-password"}
          aria-label="Password"
          minLength={8}
          required
        />
        {mode === "join" ? (
          <label className="check">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} aria-label="Agree to the Terms of Service and Privacy Policy" />
            <span>I am 18 or older and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>
        ) : null}
        <button className="button primary" type="submit" disabled={busy || (mode === "join" && !agreed)}>
          {busy ? "One moment…" : mode === "join" ? "Join Plenty" : "Sign in"}
        </button>
        {mode === "signin" ? (
          <button className="button" type="button" disabled={resetBusy} onClick={() => void requestReset()}>
            {resetBusy ? "Sending reset link…" : "Forgot password?"}
          </button>
        ) : null}
      </form>

      <p className="note">
        {mode === "join" ? (
          <>Already have an account? <a href="#" onClick={(event) => { event.preventDefault(); setError(null); setInfo(null); setMode("signin"); }}>Sign in</a></>
        ) : (
          <>New here? <a href="#" onClick={(event) => { event.preventDefault(); setError(null); setInfo(null); setMode("join"); }}>Join Plenty</a></>
        )}
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="shell hero"><p>Loading…</p></main>}>
      <SignInForm />
    </Suspense>
  );
}
