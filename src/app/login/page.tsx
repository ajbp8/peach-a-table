"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus("sent");
      return;
    }

    let message = "Something went wrong.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // Non-JSON error response (e.g. unexpected redirect/405) — fall back to generic message.
    }
    setErrorMsg(message);
    setStatus("error");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-[var(--mk-cream)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: "var(--mk-terracotta)" }}>
          Memory Kitchen
        </h1>
        <p className="text-center text-sm text-neutral-500 mb-8">
          Sign in to your family&apos;s recipe network
        </p>

        {status === "sent" ? (
          <p className="text-center text-sm text-neutral-700">
            Check <strong>{email}</strong> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--mk-border)] px-4 py-3 text-sm outline-none focus:border-[var(--mk-terracotta)]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(to right, #c8602a, #e8854a)" }}
            >
              {status === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600 text-center">{errorMsg}</p>
            )}
          </form>
        )}

        <p className="text-center text-xs text-neutral-400 mt-8">
          New here? You&apos;ll need an invite link from a family member.{" "}
          <Link href="/join" className="underline">
            Have an invite code?
          </Link>
        </p>
      </div>
    </main>
  );
}
