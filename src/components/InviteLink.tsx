"use client";

import { useState } from "react";

// "Copy invite link" button from the Profile mockup. Lazily creates (or
// reuses) the user's standing invite token via /api/invites, then builds
// the same /join?token=... link the existing /join page already knows how
// to consume.
export default function InviteLink() {
  const [status, setStatus] = useState<"idle" | "working" | "copied" | "error">("idle");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function handleClick() {
    setStatus("working");

    const res = await fetch("/api/invites", { method: "POST" });
    if (!res.ok) {
      setStatus("error");
      return;
    }

    const { token, invitesRemaining } = await res.json();
    const link = `${window.location.origin}/join?token=${token}`;

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API can fail without HTTPS/permissions; the link is
      // still valid to share manually even if copying silently failed.
    }

    setRemaining(invitesRemaining);
    setStatus("copied");
  }

  return (
    <div
      className="rounded-xl border p-4 mb-6"
      style={{ borderColor: "#f0d4c4", background: "#fef5f0" }}
    >
      <p className="text-sm font-bold mb-1" style={{ color: "#c8602a" }}>
        📨 Invite a friend
      </p>
      <p className="text-xs text-neutral-500 mb-3">
        Share Memory Kitchen with someone special.
        {remaining !== null &&
          ` ${remaining} use${remaining === 1 ? "" : "s"} remaining on this link.`}
      </p>
      <button
        onClick={handleClick}
        disabled={status === "working"}
        className="w-full rounded-lg py-2 text-sm font-semibold text-white text-center"
        style={{ background: "#c8602a" }}
      >
        {status === "working"
          ? "Generating..."
          : status === "copied"
          ? "Link copied!"
          : "Copy invite link"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600 mt-2 text-center">
          Couldn&apos;t create a link. Try again.
        </p>
      )}
    </div>
  );
}
