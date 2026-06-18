import Link from "next/link";

export type RecipeCardData = {
  id: string;
  name: string;
  meal_category?: string | null;
  cuisine_tags?: string[] | null;
  save_count?: number | null;
  users?: { name: string | null } | { name: string | null }[] | null;
};

// Photo upload is explicitly out of scope for Session 3 — the design brief's
// mockup itself only shows gradient + emoji placeholders, not real photo
// UI, on every recipe card. This is that placeholder: a cuisine-tagged
// gradient with a matching emoji, good enough to tell cards apart in a grid
// until photo upload becomes its own session.
const CUISINE_STYLES: Record<string, { emoji: string; gradient: string }> = {
  italian: { emoji: "🍝", gradient: "linear-gradient(135deg, #c8602a, #e8854a)" },
  mexican: { emoji: "🌮", gradient: "linear-gradient(135deg, #b8482e, #e0824a)" },
  indian: { emoji: "🍛", gradient: "linear-gradient(135deg, #a8512a, #d98a3d)" },
  chinese: { emoji: "🥡", gradient: "linear-gradient(135deg, #b8362e, #e0623f)" },
  japanese: { emoji: "🍣", gradient: "linear-gradient(135deg, #4a6b5a, #7fa68c)" },
  thai: { emoji: "🍜", gradient: "linear-gradient(135deg, #4a7a4a, #8cba6a)" },
  french: { emoji: "🥐", gradient: "linear-gradient(135deg, #5a5a8a, #8a8ac0)" },
  mediterranean: { emoji: "🥙", gradient: "linear-gradient(135deg, #3a7a7a, #6ab0a8)" },
  american: { emoji: "🍔", gradient: "linear-gradient(135deg, #c8602a, #e8854a)" },
  dessert: { emoji: "🍰", gradient: "linear-gradient(135deg, #b85a8a, #e092b8)" },
  baking: { emoji: "🍞", gradient: "linear-gradient(135deg, #c89050, #e8b878)" },
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🥪",
  dinner: "🍽️",
  snack: "🍿",
  dessert: "🍰",
};

const DEFAULT_STYLE = { emoji: "🍽️", gradient: "linear-gradient(135deg, #c8602a, #e8854a)" };

function styleFor(cuisineTags: string[] | null | undefined, mealCategory: string | null | undefined) {
  const firstTag = cuisineTags?.[0]?.toLowerCase();
  if (firstTag && CUISINE_STYLES[firstTag]) return CUISINE_STYLES[firstTag];
  const mealKey = mealCategory?.toLowerCase();
  if (mealKey && MEAL_EMOJI[mealKey]) {
    return { emoji: MEAL_EMOJI[mealKey], gradient: DEFAULT_STYLE.gradient };
  }
  return DEFAULT_STYLE;
}

function ownerName(users: RecipeCardData["users"]) {
  if (!users) return null;
  return Array.isArray(users) ? users[0]?.name ?? null : users.name ?? null;
}

export default function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { emoji, gradient } = styleFor(recipe.cuisine_tags, recipe.meal_category);
  const owner = ownerName(recipe.users);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--mk-border)", background: "white" }}
    >
      <div className="h-24 flex items-center justify-center text-4xl" style={{ background: gradient }}>
        {emoji}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold truncate" style={{ color: "#1a1a1a" }}>
          {recipe.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-neutral-500 truncate">
            {owner ? `by ${owner}` : recipe.meal_category ?? ""}
          </p>
          <p className="text-xs text-neutral-500 whitespace-nowrap">❤️ {recipe.save_count ?? 0}</p>
        </div>
      </div>
    </Link>
  );
}
