import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/RecipeCard";
import Link from "next/link";

const MEAL_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const CUISINES = [
  "Italian",
  "Mexican",
  "Indian",
  "Chinese",
  "Japanese",
  "Thai",
  "French",
  "Mediterranean",
  "American",
  "Dessert",
  "Baking",
];

// Stays a plain server component — filtering happens by navigating to a new
// URL with query params (the pills below are just links), the same
// "server-rendered until something genuinely needs a click handler" instinct
// as the rest of this app. recipes_select_visible RLS still does the real
// access-control work: a friends-only recipe from a non-friend simply never
// appears in the query result, no matter what filter is applied.
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string; cuisine?: string }>;
}) {
  const { meal, cuisine } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let query = supabase
    .from("recipes")
    .select("id, name, meal_category, cuisine_tags, save_count, users(name)")
    .neq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (meal) query = query.eq("meal_category", meal);
  if (cuisine) query = query.contains("cuisine_tags", [cuisine]);

  const { data: recipes } = await query;

  function pillHref(kind: "meal" | "cuisine", value: string) {
    const params = new URLSearchParams();
    const nextMeal = kind === "meal" ? (meal === value ? undefined : value) : meal;
    const nextCuisine = kind === "cuisine" ? (cuisine === value ? undefined : value) : cuisine;
    if (nextMeal) params.set("meal", nextMeal);
    if (nextCuisine) params.set("cuisine", nextCuisine);
    const qs = params.toString();
    return `/discover${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="min-h-screen px-5 pt-8 pb-6 bg-[var(--mk-cream)]">
      <h1 className="text-lg font-bold mb-4" style={{ color: "#1a1a1a" }}>
        Discover
      </h1>

      <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
        {MEAL_CATEGORIES.map((m) => (
          <Pill key={m} href={pillHref("meal", m)} active={meal === m} label={m} />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
        {CUISINES.map((c) => (
          <Pill key={c} href={pillHref("cuisine", c)} active={cuisine === c} label={c} />
        ))}
      </div>

      {!recipes || recipes.length === 0 ? (
        <p className="text-xs text-neutral-500 text-center mt-10">
          No recipes match yet — try a different filter, or check back once friends start
          sharing.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}

function Pill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap"
      style={{
        borderColor: active ? "var(--mk-terracotta)" : "var(--mk-border)",
        background: active ? "var(--mk-terracotta)" : "white",
        color: active ? "white" : "#6b6358",
      }}
    >
      {label}
    </Link>
  );
}
