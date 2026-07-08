import { createClient } from "@/lib/supabase/server";
import CreateHousehold from "@/components/CreateHousehold";
import AddDishForm from "@/components/AddDishForm";
import Link from "next/link";
import {
  mondayOf,
  addDays,
  todayStr,
  WEEKDAY_LABELS,
  MEAL_TYPES,
  MEAL_LABELS,
} from "@/lib/menu";

type RecipeEmbed = {
  name: string;
  users: { name: string } | { name: string }[] | null;
} | null;

type DishRow = {
  id: string;
  free_text: string | null;
  recipes: RecipeEmbed | RecipeEmbed[];
};

type SlotRow = {
  id: string;
  day_date: string;
  meal_type: string;
  menu_dishes: DishRow[];
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, membershipResult, recipesResult] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
    supabase
      .from("family_members")
      .select("family_id, families(name)")
      .eq("user_id", user.id)
      .limit(1),
    supabase
      .from("recipes")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("name"),
  ]);

  const displayName =
    profileResult.data?.name || user.email?.split("@")[0] || "there";

  const membershipRow = membershipResult.data?.[0] as
    | { family_id: string; families: { name: string } | { name: string }[] | null }
    | undefined;

  if (!membershipRow) {
    return (
      <main className="min-h-screen px-5 pt-8 pb-6 bg-[var(--mk-cream)]">
        <Banner name={displayName} />
        <div className="mt-4">
          <CreateHousehold />
        </div>
      </main>
    );
  }

  const familyId = membershipRow.family_id;
  const myRecipes = recipesResult.data ?? [];

  const today = todayStr();
  const weekStart = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDay = day && days.includes(day) ? day : today;

  const { data: week } = await supabase
    .from("menu_weeks")
    .select("id")
    .eq("family_id", familyId)
    .eq("week_start", weekStart)
    .maybeSingle();

  let slots: SlotRow[] = [];
  if (week) {
    const { data: slotRows } = await supabase
      .from("menu_slots")
      .select(
        "id, day_date, meal_type, menu_dishes(id, free_text, recipes(name, users!recipes_owner_id_fkey(name)))"
      )
      .eq("week_id", week.id);
    slots = (slotRows ?? []) as SlotRow[];
  }

  function dishesFor(dayDate: string, mealType: string) {
    const slot = slots.find(
      (s) => s.day_date === dayDate && s.meal_type === mealType
    );
    return slot?.menu_dishes ?? [];
  }

  function dayHasDishes(dayDate: string) {
    return slots.some(
      (s) => s.day_date === dayDate && (s.menu_dishes?.length ?? 0) > 0
    );
  }

  const selectedDayLabel = new Date(
    `${selectedDay}T00:00:00`
  ).toLocaleDateString("en-US", { weekday: "long" });

  return (
    <main className="min-h-screen px-5 pt-8 pb-6 bg-[var(--mk-cream)]">
      <Banner name={displayName} />

      <div className="flex items-center justify-between mt-3 mb-2">
        <h2 className="text-xs font-bold" style={{ color: "#1a1a1a" }}>
          This week
        </h2>
      </div>

      <div className="flex gap-1.5 mb-3.5">
        {days.map((d) => {
          const date = new Date(`${d}T00:00:00`);
          const active = d === selectedDay;
          const hasDishes = dayHasDishes(d);
          return (
            <Link
              key={d}
              href={`/?day=${d}`}
              className="flex-1 rounded-[10px] border text-center py-2"
              style={{
                borderColor: active ? "var(--mk-terracotta)" : "var(--mk-border)",
                background: active ? "#fef9ee" : "white",
              }}
            >
              <div className="text-[9px] font-semibold uppercase text-neutral-500">
                {WEEKDAY_LABELS[(date.getDay() + 6) % 7]}
              </div>
              <div
                className="text-[10px] font-bold my-0.5"
                style={{ color: "#1a1a1a" }}
              >
                {date.getDate()}
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full mx-auto"
                style={{
                  background: hasDishes ? "var(--mk-terracotta)" : "var(--mk-border)",
                }}
              />
            </Link>
          );
        })}
      </div>

      {MEAL_TYPES.map((meal) => {
        const dishes = dishesFor(selectedDay, meal);
        return (
          <div
            key={meal}
            className="bg-white rounded-xl p-3 mb-2 border"
            style={{ borderColor: "var(--mk-border)" }}
          >
            <div className="text-[10px] font-semibold uppercase text-neutral-500 mb-1.5">
              {selectedDayLabel} &middot; {MEAL_LABELS[meal]}
            </div>
            {dishes.length === 0 ? (
              <p className="text-xs text-neutral-400 mb-1">Nothing planned yet.</p>
            ) : (
              dishes.map((dish) => {
                const recipe = Array.isArray(dish.recipes)
                  ? dish.recipes[0]
                  : dish.recipes;
                const ownerObj = recipe
                  ? Array.isArray(recipe.users)
                    ? recipe.users[0]
                    : recipe.users
                  : null;
                const owner = ownerObj?.name;
                const name = recipe?.name ?? dish.free_text ?? "Untitled dish";
                return (
                  <div key={dish.id} className="flex items-center gap-2 py-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--mk-terracotta)" }}
                    />
                    <div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: "#1a1a1a" }}
                      >
                        {name}
                      </div>
                      {owner && owner !== displayName && (
                        <div className="text-[10px] text-neutral-400">
                          {owner}&apos;s recipe
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <AddDishForm dayDate={selectedDay} mealType={meal} recipes={myRecipes} />
          </div>
        );
      })}
    </main>
  );
}

function PotIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 13h16v9.5a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V13z" />
      <path d="M12 13v-3a4 4 0 0 1 8 0v3" />
      <path d="M4 16h4M24 16h4" />
      <path d="M13 20c1 1.5 5 1.5 6 0" />
    </svg>
  );
}

function Banner({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  return (
    <div
      className="rounded-2xl p-4 text-white"
      style={{ background: "linear-gradient(135deg, #c8860a 0%, #e8a832 100%)" }}
    >
      <div className="flex items-center gap-2 mb-3 opacity-95">
        <PotIcon />
        <span className="text-sm font-bold tracking-wide">Memory Kitchen</span>
      </div>
      <div className="text-[11px] opacity-80 mb-0.5">{greeting}</div>
      <div className="text-base font-extrabold mb-1">{name} 👋</div>
      <div className="text-[10px] opacity-75 leading-relaxed">
        Invite-only &middot; the recipes of your life
      </div>
    </div>
  );
}
