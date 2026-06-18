"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MEAL_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const VISIBILITY_OPTIONS = [
  { value: "friends", label: "Friends" },
  { value: "public", label: "Everyone" },
  { value: "private", label: "Just me" },
];

// Lets a signed-in user add a recipe from their Profile screen. Kept
// collapsed behind a button by default, the same way CreateHousehold only
// appears when there's something to do - the Profile screen shouldn't open
// with a long form already showing. Posts to /api/recipes, then
// router.refresh() re-runs the server component that lists "Your recipes,"
// so the new card appears without a second client-side fetch.
export default function CreateRecipe() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [mealCategory, setMealCategory] = useState("Dinner");
  const [cuisineTags, setCuisineTags] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setName("");
    setStory("");
    setIngredients("");
    setSourceUrl("");
    setMealCategory("Dinner");
    setCuisineTags("");
    setVisibility("friends");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setErrorMsg("");

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        story,
        ingredients,
        source_url: sourceUrl,
        meal_category: mealCategory,
        cuisine_tags: cuisineTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        visibility,
      }),
    });

    if (res.ok) {
      reset();
      setOpen(false);
      setStatus("idle");
      router.refresh();
      return;
    }

    let message = "Something went wrong.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // Non-JSON error response - fall back to generic message.
    }
    setErrorMsg(message);
    setStatus("error");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border py-2 text-sm font-semibold mb-4"
        style={{ borderColor: "var(--mk-border)", color: "var(--mk-terracotta)" }}
      >
        + Add a recipe
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 mb-4"
      style={{ borderColor: "var(--mk-border)", background: "white" }}
    >
      <p className="text-sm font-bold mb-3" style={{ color: "#1a1a1a" }}>
        Add a recipe
      </p>

      <input
        type="text"
        required
        placeholder="Recipe name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2"
        style={{ borderColor: "var(--mk-border)" }}
      />
      <textarea
        placeholder="The story behind it (optional)"
        value={story}
        onChange={(e) => setStory(e.target.value)}
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2"
        style={{ borderColor: "var(--mk-border)" }}
      />
      <textarea
        placeholder="Ingredients (optional)"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2"
        style={{ borderColor: "var(--mk-border)" }}
      />
      <input
        type="url"
        placeholder="Source link (optional)"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2"
        style={{ borderColor: "var(--mk-border)" }}
      />

      <div className="flex gap-2 mb-2">
        <select
          value={mealCategory}
          onChange={(e) => setMealCategory(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--mk-border)" }}
        >
          {MEAL_CATEGORIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--mk-border)" }}
        >
          {VISIBILITY_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Cuisine tags, comma separated (e.g. Italian, Comfort food)"
        value={cuisineTags}
        onChange={(e) => setCuisineTags(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-3"
        style={{ borderColor: "var(--mk-border)" }}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErrorMsg("");
            setStatus("idle");
          }}
          className="flex-1 rounded-lg border py-2 text-sm font-semibold"
          style={{ borderColor: "var(--mk-border)", color: "#6b6358" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === "working"}
          className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(to right, #c8602a, #e8854a)" }}
        >
          {status === "working" ? "Saving..." : "Save recipe"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-600 mt-2 text-center">{errorMsg}</p>
      )}
    </form>
  );
}
