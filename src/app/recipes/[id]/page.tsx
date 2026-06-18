import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SaveButton from "@/components/SaveButton";

// Matches mockup screen 3 minus chat/comments, which are a later session.
// Photo upload is also out of scope here (see RecipeCard's comment) — the
// hero is the same gradient + emoji placeholder used on the cards.
export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [recipeResult, savedResult] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, story, ingredients, source_url, meal_category, cuisine_tags, save_count, owner_id, users(name)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id)
      .eq("recipe_id", id)
      .maybeSingle(),
  ]);

  const recipe = recipeResult.data;
  if (!recipe) {
    // Either the recipe doesn't exist, or recipes_select_visible RLS hid
    // it (e.g. a friends-only recipe from someone who isn't your friend) —
    // both cases look identical to the visitor, which is the point.
    notFound();
  }

  // Same shape as RecipeCard's RecipeCardData["users"] and profile/page.tsx's
  // membershipRow cast — the Supabase client can't infer a precise type for
  // a joined relation from an inline, untyped select() string, so without
  // this cast the non-array branch of the ternary narrows to `never`.
  const usersValue = recipe.users as
    | { name: string | null }
    | { name: string | null }[]
    | null;
  const ownerName = Array.isArray(usersValue) ? usersValue[0]?.name : usersValue?.name;
  const isOwner = recipe.owner_id === user.id;

  return (
    <main className="min-h-screen pb-6 bg-[var(--mk-cream)]">
      <div
        className="h-40 flex items-center justify-center text-6xl"
        style={{ background: "linear-gradient(135deg, #c8602a, #e8854a)" }}
      >
        🍽️
      </div>

      <div className="px-5 pt-5">
        <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>
          {recipe.name}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {ownerName ? `by ${ownerName}` : ""}
          {recipe.meal_category ? ` · ${recipe.meal_category}` : ""}
        </p>

        {recipe.cuisine_tags && recipe.cuisine_tags.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {recipe.cuisine_tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border px-2 py-0.5 text-[11px]"
                style={{ borderColor: "var(--mk-border)", color: "#6b6358" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {!isOwner && (
          <div className="mt-4">
            <SaveButton recipeId={recipe.id} initiallySaved={Boolean(savedResult.data)} />
          </div>
        )}

        {recipe.story && (
          <section className="mt-5">
            <h2 className="text-sm font-bold mb-1" style={{ color: "#1a1a1a" }}>
              The story
            </h2>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{recipe.story}</p>
          </section>
        )}

        {recipe.ingredients && (
          <section className="mt-5">
            <h2 className="text-sm font-bold mb-1" style={{ color: "#1a1a1a" }}>
              Ingredients
            </h2>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{recipe.ingredients}</p>
          </section>
        )}

        {recipe.source_url && (
          <section className="mt-5">
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold"
              style={{ color: "var(--mk-terracotta)" }}
            >
              View original source →
            </a>
          </section>
        )}

        <p className="text-xs text-neutral-400 mt-6">
          ❤️ Saved by {recipe.save_count ?? 0} {recipe.save_count === 1 ? "person" : "people"}
        </p>
      </div>
    </main>
  );
}
