import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import SaveButton from "@/components/SaveButton";

const CUISINE_EMOJI: Record<string, string> = {
  italian: "🍝", mexican: "🌮", indian: "🍛", chinese: "🥡", japanese: "🍣",
  thai: "🍜", french: "🥐", mediterranean: "🥙", american: "🍔",
  "middle-eastern": "🫙", dessert: "🍰", baking: "🍞",
};
function getEmoji(tags: string[] | null) {
  const t = tags?.[0]?.toLowerCase();
  return (t && CUISINE_EMOJI[t]) || "🍽️";
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [recipeResult, savedResult] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, name, story, description, ingredients, instructions, source_url, meal_category, cuisine_tags, save_count, owner_id")
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
  if (!recipe) notFound();

  const isSaved = !!savedResult.data;
  const emoji = getEmoji(recipe.cuisine_tags);
  const ingredients = recipe.ingredients as string[] | string | null;
  const instructions = recipe.instructions as string[] | string | null;

  return (
    <div className="min-h-screen" style={{ background: "var(--mk-cream)" }}>
      {/* Header */}
      <div
        style={{ background: "linear-gradient(135deg, #3E7B5A 0%, #6AAF88 100%)" }}
        className="px-5 pt-10 pb-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium mb-4"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          ← Back to menu
        </Link>
        <div className="flex items-start gap-3">
          <span className="text-4xl">{emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight">{recipe.name}</h1>
            {recipe.meal_category && (
              <p className="text-xs mt-1 capitalize" style={{ color: "rgba(255,255,255,0.6)" }}>
                {recipe.meal_category}
              </p>
            )}
          </div>
          <SaveButton recipeId={recipe.id} initialSaved={isSaved} />
        </div>
        {recipe.save_count != null && recipe.save_count > 0 && (
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            ♥ Saved by {recipe.save_count} {recipe.save_count === 1 ? "person" : "people"}
          </p>
        )}
      </div>

      <div className="px-5 pt-4 pb-24 space-y-3">
        {/* Cuisine tags */}
        {Array.isArray(recipe.cuisine_tags) && recipe.cuisine_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(recipe.cuisine_tags as string[]).map((tag: string) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                style={{ background: "rgba(62,123,90,0.12)", color: "var(--mk-terracotta)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Story */}
        {recipe.story && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--mk-terracotta)" }}>Story</p>
            <p className="text-sm text-neutral-600 leading-relaxed italic">{recipe.story}</p>
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--mk-terracotta)" }}>About</p>
            <p className="text-sm text-neutral-600 leading-relaxed">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        {ingredients && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--mk-terracotta)" }}>Ingredients</p>
            {Array.isArray(ingredients) ? (
              <ul className="space-y-1.5">
                {ingredients.map((ing: string, idx: number) => (
                  <li key={idx} className="text-sm text-neutral-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--mk-terracotta)", opacity: 0.6 }} />
                    {ing}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-600 whitespace-pre-line">{String(ingredients)}</p>
            )}
          </div>
        )}

        {/* Instructions */}
        {instructions && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--mk-terracotta)" }}>Instructions</p>
            {Array.isArray(instructions) ? (
              <ol className="space-y-3">
                {instructions.map((step: string, idx: number) => (
                  <li key={idx} className="text-sm text-neutral-700 flex items-start gap-3">
                    <span
                      className="text-xs font-bold pt-0.5 flex-shrink-0 w-4 text-right"
                      style={{ color: "var(--mk-terracotta)" }}
                    >{idx + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{String(instructions)}</p>
            )}
          </div>
        )}

        {/* Source URL */}
        {recipe.source_url && (
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--mk-terracotta)" }}>Source</p>
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              style={{ color: "var(--mk-terracotta)" }}
            >
              {recipe.source_url}
            </a>
          </div>
        )}

        {/* Empty state */}
        {!recipe.story && !recipe.description && !ingredients && !instructions && (
          <div className="bg-white rounded-xl border p-6 text-center" style={{ borderColor: "var(--mk-border)" }}>
            <p className="text-sm text-neutral-400">No recipe details added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
