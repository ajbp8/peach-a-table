import Link from "next/link";

export type RecipeCardData = {
  id: string;
  name: string;
  meal_category?: string | null;
  cuisine_tags?: string[] | null;
  save_count?: number | null;
  users?: { name: string | null } | { name: string | null }[] | null;
};

const CUISINE_STYLES: Record<string, { emoji: string; bg: string }> = {
  italian:       { emoji: "🍝", bg: "#c8602a" },
  mexican:       { emoji: "🌮", bg: "#b8482e" },
  indian:        { emoji: "🍛", bg: "#a8512a" },
  chinese:       { emoji: "🥡", bg: "#b8362e" },
  japanese:      { emoji: "🍣", bg: "#4a6b5a" },
  thai:          { emoji: "🍜", bg: "#4a7a4a" },
  french:        { emoji: "🥐", bg: "#5a5a8a" },
  mediterranean: { emoji: "🥙", bg: "#3a7a7a" },
  american:      { emoji: "🍔", bg: "#c8602a" },
  asian:         { emoji: "🍜", bg: "#4a7a6a" },
  "middle-eastern": { emoji: "🫙", bg: "#8a6a2a" },
  dessert:       { emoji: "🍰", bg: "#b85a8a" },
  baking:        { emoji: "🍞", bg: "#c89050" },
};

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🥪",
  dinner: "🍽️",
  snack: "🍿",
  dessert: "🍰",
};

function styleFor(cuisineTags: string[] | null | undefined, mealCategory: string | null | undefined) {
  const firstTag = cuisineTags?.[0]?.toLowerCase();
  if (firstTag && CUISINE_STYLES[firstTag]) return CUISINE_STYLES[firstTag];
  const mealKey = mealCategory?.toLowerCase();
  return { emoji: (mealKey && MEAL_EMOJI[mealKey]) || "🍽️", bg: "#c8860a" };
}

function ownerName(users: RecipeCardData["users"]) {
  if (!users) return null;
  return Array.isArray(users) ? users[0]?.name ?? null : users.name ?? null;
}

export default function RecipeCard({
  recipe,
  mutualFriends,
}: {
  recipe: RecipeCardData;
  mutualFriends?: number;
}) {
  const { emoji, bg } = styleFor(recipe.cuisine_tags, recipe.meal_category);
  const owner = ownerName(recipe.users);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex items-center gap-3 py-2.5 border-b"
      style={{ borderColor: "var(--mk-border)" }}
    >
      {/* Small cuisine chip */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: bg }}
      >
        {emoji}
      </div>

      {/* Name + owner */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
          {recipe.name}
        </p>
        {owner && (
          <p className="text-[10px] text-neutral-400 truncate">by {owner}</p>
        )}
      </div>

      {/* Mutual friends badge */}
      {mutualFriends !== undefined && mutualFriends > 0 && (
        <span className="text-[10px] text-neutral-400 flex-shrink-0">
          👥 {mutualFriends}
        </span>
      )}

      {/* Save count */}
      <span className="text-[10px] text-neutral-400 flex-shrink-0">
        ♥ {recipe.save_count ?? 0}
      </span>

      {/* Chevron */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M4 2l4 4-4 4"/>
      </svg>
    </Link>
  );
}
