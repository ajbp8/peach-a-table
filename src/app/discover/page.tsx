import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/RecipeCard";
import CreateRecipe from "@/components/CreateRecipe";
import Link from "next/link";

const MEAL_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const CUISINES = [
  "Italian", "Mexican", "Indian", "Chinese", "Japanese",
  "Thai", "French", "Mediterranean", "American", "Dessert", "Baking",
];

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

  if (!user) return null;

  // Fetch user's own recipes
  const { data: myRecipes } = await supabase
    .from("recipes")
    .select("id, name, meal_category, cuisine_tags, save_count")
    .eq("owner_id", user.id)
    .order("name");

  // Fetch others' recipes (with optional filters)
  let query = supabase
    .from("recipes")
    .select("id, name, meal_category, cuisine_tags, save_count, owner_id, users!recipes_owner_id_fkey(name)")
    .neq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (meal) query = query.eq("meal_category", meal);
  if (cuisine) query = query.contains("cuisine_tags", [cuisine]);

  const { data: friendRecipes } = await query;

  // Mutual friend counts for discover section
  const ownerIds = [...new Set((friendRecipes ?? []).map((r) => r.owner_id))];
  const mutualMap = new Map<string, number>();
  if (ownerIds.length > 0) {
    const { data: counts } = await supabase.rpc("mutual_friend_counts", {
      p_user_ids: ownerIds,
    });
    for (const row of counts ?? []) {
      mutualMap.set(row.other_id, row.mutual_count);
    }
  }

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
        Recipes
      </h1>

      {/* My recipes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            My recipes ({myRecipes?.length ?? 0})
          </h2>
        </div>

        <CreateRecipe />

        {(myRecipes?.length ?? 0) > 0 && (
          <div className="mt-1 bg-white rounded-xl border px-3" style={{ borderColor: "var(--mk-border)" }}>
            {myRecipes!.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>

      {/* Discover section */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">
          From friends
        </h2>

        <div className="flex gap-2 overflow-x-auto mb-2 pb-1">
          {MEAL_CATEGORIES.map((m) => (
            <Pill key={m} href={pillHref("meal", m)} active={meal === m} label={m} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
          {CUISINES.map((c) => (
            <Pill key={c} href={pillHref("cuisine", c)} active={cuisine === c} label={c} />
          ))}
        </div>

        {!friendRecipes || friendRecipes.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center mt-6">
            No recipes from friends yet — invite someone to get started.
          </p>
        ) : (
          <div className="bg-white rounded-xl border px-3" style={{ borderColor: "var(--mk-border)" }}>
            {friendRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                mutualFriends={mutualMap.get(recipe.owner_id) ?? 0}
              />
            ))}
          </div>
        )}
      </section>
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
