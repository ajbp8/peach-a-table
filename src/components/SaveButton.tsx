"use client";

import { useState } from "react";

// The recipe detail page (a server component) renders this small client
// island just for the one piece of interactivity it needs — toggling a
// save. Everything else on that page is plain server-rendered HTML.
export default function SaveButton({
  recipeId,
  initiallySaved,
}: {
  recipeId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [working, setWorking] = useState(false);

  async function toggle() {
    setWorking(true);
    const res = await fetch(`/api/recipes/${recipeId}/save`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSaved(Boolean(data.saved));
    }
    setWorking(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={working}
      className="w-full rounded-lg py-2 text-sm font-semibold"
      style={
        saved
          ? {
              background: "var(--mk-cream)",
              color: "var(--mk-terracotta)",
              border: "1px solid var(--mk-terracotta)",
            }
          : { background: "linear-gradient(to right, #c8602a, #e8854a)", color: "white" }
      }
    >
      {saved ? "❤️ Saved" : "🤍 Save recipe"}
    </button>
  );
}
