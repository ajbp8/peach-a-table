"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Recipe = { id: string; name: string; meal_category: string | null; cuisine_tags: string[] | null };
type Dish = { id: string; recipe_id: string | null; free_text: string | null; recipes?: { name: string; meal_category: string | null; cuisine_tags: string[] | null } | null };
type Slot = { id: string; day_date: string; meal_type: string; dishes: Dish[] };
type WeekData = { week_id: string | null; slots: Slot[] };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CUISINE_EMOJI: Record<string, string> = {
  italian: "🍝", mexican: "🌮", indian: "🍛", chinese: "🥡", japanese: "🍣",
  thai: "🍜", french: "🥐", mediterranean: "🥙", american: "🍔",
  "middle-eastern": "🫙", dessert: "🍰", baking: "🍞",
};
function getEmoji(r: { cuisine_tags: string[] | null; meal_category: string | null }) {
  const t = r.cuisine_tags?.[0]?.toLowerCase();
  return (t && CUISINE_EMOJI[t]) || "🍽️";
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISO() { return toISO(new Date()); }

function getMonday(offsetWeeks: number): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayHeader(iso: string, i: number) {
  const d = new Date(iso + "T12:00:00");
  return `${DAY_LABELS[i]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function RingsLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="3" stroke="white" strokeWidth="1.4" />
      <circle cx="11" cy="11" r="6.5" stroke="white" strokeWidth="1.1" strokeDasharray="17 3.8" />
      <circle cx="11" cy="11" r="10" stroke="white" strokeWidth="0.8" strokeDasharray="25 5.7" />
    </svg>
  );
}

export default function WeekMenu({ recipes }: { recipes: Recipe[] }) {
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState<WeekData>({ week_id: null, slots: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);
  const [pendingMealType, setPendingMealType] = useState("dinner");
  const [nestorOpen, setNestorOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const monday = getMonday(weekOffset);
  const weekStart = toISO(monday);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toISO(d);
  });

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/menu?week_start=${weekStart}`);
      if (r.ok) setWeekData(await r.json());
    } finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => { if (mounted) fetchWeek(); }, [fetchWeek, mounted]);
  useEffect(() => {
    if (mounted) { setSearch(""); setPendingRecipe(null); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addDish(day: string, meal: string, recipe: Recipe) {
    setPendingRecipe(null);
    setSearch("");
    setDragOver(null);
    await fetch("/api/menu/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: weekStart, day_date: day, meal_type: meal, recipe_id: recipe.id }),
    });
    fetchWeek();
  }

  async function removeDish(id: string) {
    await fetch(`/api/menu/dishes/${id}`, { method: "DELETE" });
    fetchWeek();
  }

  const allDayDishes = (day: string) =>
    weekData.slots
      .filter(s => s.day_date === day)
      .flatMap(s => s.dishes.map(d => ({ ...d, mealType: s.meal_type })));

  const plannedIds = new Set(
    weekData.slots.flatMap(s => s.dishes.map(d => d.recipe_id)).filter(Boolean)
  );
  const nestorSuggestions = recipes.filter(r => !plannedIds.has(r.id)).slice(0, 3);

  const searchResults = search.trim().length > 0
    ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const todayStr = mounted ? todayISO() : "";

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--mk-cream)" }}>

      {/* Banner */}
      <div
        style={{ background: "linear-gradient(135deg, #3E7B5A 0%, #6AAF88 100%)" }}
        className="px-5 pt-10 pb-4"
      >
        <div className="flex items-center gap-2.5 mb-0.5">
          <RingsLogo />
          <span style={{ fontWeight: 900, fontSize: "22px", letterSpacing: "-0.5px", lineHeight: 1 }}>
            <span style={{ color: "white" }}>Memory</span>
            <span style={{ color: "#FFE580" }}> Kitchen</span>
          </span>
        </div>
        <p className="text-xs font-medium mb-4 pl-9" style={{ color: "rgba(255,255,255,0.6)" }}>
          Cook with a smile ✨
        </p>
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search a recipe to plan…"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none pr-10"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "white",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm" aria-label="Clear">✕</button>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl overflow-hidden z-30" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
              {searchResults.map(r => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("recipe-id", r.id); e.dataTransfer.effectAllowed = "copy"; }}
                  onClick={() => { setPendingRecipe(r); setPendingMealType("dinner"); setSearch(""); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 border-b last:border-0 cursor-grab active:cursor-grabbing hover:bg-neutral-50"
                  style={{ borderColor: "var(--mk-border)" }}
                >
                  <span className="text-lg flex-shrink-0">{getEmoji(r)}</span>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: "#1a1a1a" }}>{r.name}</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#bbb" }}>drag or tap →</span>
                </div>
              ))}
            </div>
          )}
          {search.trim().length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl z-30" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
              <p className="px-4 py-3 text-xs text-neutral-400">No recipes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Week nav */}
      <div className="bg-white border-b px-5 py-3 flex items-center justify-between" style={{ borderColor: "var(--mk-border)" }}>
        <button onClick={() => setWeekOffset(o => Math.max(-2, o - 1))} disabled={weekOffset <= -2} className="text-xs font-semibold disabled:opacity-25" style={{ color: "var(--mk-terracotta)" }}>← prev</button>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago` : `In ${weekOffset}w`}
        </span>
        <button onClick={() => setWeekOffset(o => Math.min(2, o + 1))} disabled={weekOffset >= 2} className="text-xs font-semibold disabled:opacity-25" style={{ color: "var(--mk-terracotta)" }}>next →</button>
      </div>

      {/* 7 compact day cards */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        {loading ? (
          Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl border px-4 py-3 animate-pulse" style={{ borderColor: "var(--mk-border)" }}>
              <div className="h-3 w-20 bg-neutral-100 rounded mb-2" />
              <div className="h-4 w-36 bg-neutral-100 rounded" />
            </div>
          ))
        ) : weekDays.map((day, i) => {
          const dishes = allDayDishes(day);
          const isToday = day === todayStr;
          const isDragTarget = dragOver === day;
          return (
            <div
              key={day}
              className="bg-white rounded-xl overflow-hidden transition-colors"
              style={{
                border: isDragTarget ? "2px dashed var(--mk-terracotta)" : isToday ? "1.5px solid var(--mk-terracotta)" : "1px solid var(--mk-border)",
                background: isDragTarget ? "rgba(62,123,90,0.04)" : undefined,
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(day); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={(e) => {
                e.preventDefault();
                const recipe = recipes.find(r => r.id === e.dataTransfer.getData("recipe-id"));
                if (recipe) addDish(day, "dinner", recipe);
                else setDragOver(null);
              }}
            >
              <div className="px-4 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isToday ? "var(--mk-terracotta)" : "#999" }}>
                    {formatDayHeader(day, i)}
                  </span>
                  {isToday && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: "var(--mk-terracotta)", color: "white" }}>Today</span>}
                </div>
                {isDragTarget && dishes.length === 0 ? (
                  <p className="text-xs font-semibold" style={{ color: "var(--mk-terracotta)" }}>Drop to add for dinner</p>
                ) : dishes.length === 0 ? (
                  <p className="text-xs" style={{ color: "#ccc" }}>Nothing planned — drag a recipe here or search above</p>
                ) : (
                  <div className="space-y-1">
                    {dishes.map(d => (
                      <div key={d.id} className="flex items-center justify-between group">
                        {d.recipe_id ? (
                          <Link href={`/recipes/${d.recipe_id}`} className="text-sm font-medium truncate flex-1 active:opacity-60" style={{ color: "#1a1a1a" }}>
                            {d.recipes?.name ?? d.free_text ?? "Dish"}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium truncate flex-1" style={{ color: "#1a1a1a" }}>{d.free_text ?? "Dish"}</span>
                        )}
                        <button onClick={() => removeDish(d.id)} className="text-neutral-200 hover:text-red-400 ml-2 text-xl leading-none flex-shrink-0 transition-colors" aria-label="Remove">×</button>
                      </div>
                    ))}
                    {isDragTarget && <p className="text-xs font-semibold pt-0.5" style={{ color: "var(--mk-terracotta)" }}>+ Drop to add another</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Nestor */}
        {!loading && (
          <div className="mt-1">
            <button onClick={() => setNestorOpen(o => !o)} className="w-full flex items-center justify-between bg-white rounded-xl border px-4 py-3" style={{ borderColor: "var(--mk-border)" }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#3E7B5A" }}>✦ Nestor suggests</span>
              <span className="text-xs font-semibold" style={{ color: "var(--mk-terracotta)" }}>{nestorOpen ? "Hide ↑" : "Activate →"}</span>
            </button>
            {nestorOpen && (
              <div className="mt-2 space-y-2">
                {nestorSuggestions.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3 bg-white rounded-xl border" style={{ borderColor: "var(--mk-border)" }}>All your recipes are planned this week! 🎉</p>
                ) : nestorSuggestions.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--mk-border)" }}>
                    <span className="text-xl flex-shrink-0">{getEmoji(r)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{r.name}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{r.cuisine_tags?.[0] ?? r.meal_category ?? "recipe"}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/recipes/${r.id}`} className="text-[11px] font-semibold" style={{ color: "var(--mk-terracotta)" }}>View</Link>
                      <button onClick={() => { setPendingRecipe(r); setPendingMealType("dinner"); }} className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: "var(--mk-terracotta)", color: "white" }}>+ Plan</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="h-8" />
      </div>

      {/* Day picker bottom sheet */}
      {pendingRecipe && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setPendingRecipe(null)}>
          <div className="bg-white rounded-t-2xl p-5 w-full" style={{ boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{getEmoji(pendingRecipe)}</span>
              <div>
                <p className="font-bold text-neutral-800 leading-snug">{pendingRecipe.name}</p>
                <p className="text-xs text-neutral-400">Choose a day to plan it</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              {(["breakfast", "dinner", "lunch"] as const).map(m => (
                <button key={m} onClick={() => setPendingMealType(m)} className="text-xs px-3 py-1.5 rounded-full font-semibold capitalize transition-colors"
                  style={{ background: pendingMealType === m ? "var(--mk-terracotta)" : "rgba(62,123,90,0.1)", color: pendingMealType === m ? "white" : "var(--mk-terracotta)" }}>
                  {m}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {weekDays.map((iso, i) => {
                const isToday = iso === todayStr;
                return (
                  <button key={iso} onClick={() => addDish(iso, pendingMealType, pendingRecipe)}
                    className="flex flex-col items-center py-2 px-1 rounded-xl transition-all active:scale-95"
                    style={{ background: isToday ? "var(--mk-terracotta)" : "rgba(62,123,90,0.08)", color: isToday ? "white" : "var(--mk-terracotta)" }}>
                    <span className="text-[10px] font-bold">{DAY_LABELS[i]}</span>
                    <span className="text-base font-bold leading-tight">{new Date(iso + "T12:00:00").getDate()}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPendingRecipe(null)} className="w-full py-2 text-sm text-neutral-400">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
