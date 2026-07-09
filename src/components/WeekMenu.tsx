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

// Use LOCAL date components — toISOString() is UTC and can be one day off for UTC+ timezones
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
  // addTarget now includes both day and meal so any day can be targeted independently
  const [addTarget, setAddTarget] = useState<{ day: string; meal: string } | null>(null);
  const [search, setSearch] = useState("");
  const [nestorOpen, setNestorOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Hydration fix: date computation runs client-side only
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
    if (mounted) { setAddTarget(null); setSearch(""); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addDish(day: string, meal: string, recipe: Recipe) {
    setAddTarget(null);
    setSearch("");
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

  function startAdding(day: string, meal: string) {
    setAddTarget({ day, meal });
    setSearch("");
    setTimeout(() => {
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const slotFor = (day: string, meal: string) =>
    weekData.slots.find(s => s.day_date === day && s.meal_type === meal);

  const plannedIds = new Set(
    weekData.slots.flatMap(s => s.dishes.map(d => d.recipe_id)).filter(Boolean)
  );
  const nestorSuggestions = recipes.filter(r => !plannedIds.has(r.id)).slice(0, 3);

  // Only show search results when there's an active add target
  const searchResults =
    search.trim().length > 0 && addTarget
      ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
      : [];

  const todayStr = mounted ? todayISO() : "";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--mk-cream)] flex items-center justify-center">
        <div style={{ color: "var(--mk-terracotta)" }} className="text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mk-cream)]">
      {/* ── Banner ── */}
      <div
        style={{ background: "linear-gradient(135deg, #3E7B5A 0%, #6AAF88 100%)" }}
        className="px-5 pt-10 pb-4"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-0.5">
          <RingsLogo />
          <span style={{ fontWeight: 900, fontSize: "22px", letterSpacing: "-0.5px", lineHeight: 1 }}>
            <span style={{ color: "white" }}>Memory</span>
            <span style={{ color: "#FFE580" }}> Kitchen</span>
          </span>
        </div>
        {/* Tagline */}
        <p className="text-xs font-medium mb-4 pl-9" style={{ color: "rgba(255,255,255,0.6)" }}>
          Cook with a smile ✨
        </p>

        {/* Search / add input */}
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              addTarget
                ? `Adding ${addTarget.meal} · ${formatDayHeader(addTarget.day, weekDays.indexOf(addTarget.day))}`
                : "Tap + on a day to add a recipe…"
            }
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none pr-10"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "white",
            }}
          />
          {addTarget && (
            <button
              onClick={() => { setAddTarget(null); setSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-sm"
              aria-label="Cancel"
            >✕</button>
          )}
          {search.trim().length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl overflow-hidden z-30"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            >
              {searchResults.length === 0 ? (
                <p className="px-4 py-3 text-xs text-neutral-400">No recipes found</p>
              ) : searchResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => addDish(addTarget!.day, addTarget!.meal, r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b last:border-0 text-left active:bg-neutral-50"
                  style={{ borderColor: "var(--mk-border)" }}
                >
                  <span className="text-lg flex-shrink-0">{getEmoji(r)}</span>
                  <span className="text-sm truncate font-medium" style={{ color: "#1a1a1a" }}>{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Week nav ── */}
      <div
        className="bg-white border-b px-5 py-3 flex items-center justify-between"
        style={{ borderColor: "var(--mk-border)" }}
      >
        <button
          onClick={() => setWeekOffset(o => Math.max(-2, o - 1))}
          disabled={weekOffset <= -2}
          className="text-xs font-semibold disabled:opacity-25"
          style={{ color: "var(--mk-terracotta)" }}
        >← prev</button>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          {weekOffset === 0 ? "This week"
            : weekOffset === -1 ? "Last week"
            : weekOffset === 1 ? "Next week"
            : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago`
            : `In ${weekOffset}w`}
        </span>
        <button
          onClick={() => setWeekOffset(o => Math.min(2, o + 1))}
          disabled={weekOffset >= 2}
          className="text-xs font-semibold disabled:opacity-25"
          style={{ color: "var(--mk-terracotta)" }}
        >next →</button>
      </div>

      {/* ── All 7 day cards ── */}
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        {loading ? (
          // Skeleton cards while fetching
          Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border px-4 py-3 animate-pulse"
              style={{ borderColor: "var(--mk-border)" }}
            >
              <div className="h-3 w-24 bg-neutral-100 rounded mb-3" />
              <div className="h-4 w-40 bg-neutral-100 rounded mb-2" />
              <div className="h-3 w-32 bg-neutral-100 rounded" />
            </div>
          ))
        ) : weekDays.map((day, i) => {
          const dinner = slotFor(day, "dinner");
          const breakfast = slotFor(day, "breakfast");
          const lunch = slotFor(day, "lunch");
          const isToday = day === todayStr;
          const isAddingHere = addTarget?.day === day;
          const dinnerDishes = dinner?.dishes ?? [];
          const hasBreakfast = (breakfast?.dishes.length ?? 0) > 0;
          const hasLunch = (lunch?.dishes.length ?? 0) > 0;

          return (
            <div
              key={day}
              className="bg-white rounded-xl overflow-hidden"
              style={{
                border: isToday
                  ? "1.5px solid var(--mk-terracotta)"
                  : "1px solid var(--mk-border)",
              }}
            >
              {/* Day header */}
              <div
                className="px-4 py-2 flex items-center gap-2 border-b"
                style={{
                  borderColor: "var(--mk-border)",
                  background: isToday ? "rgba(62,123,90,0.05)" : undefined,
                }}
              >
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: isToday ? "var(--mk-terracotta)" : "#999" }}
                >
                  {formatDayHeader(day, i)}
                </span>
                {isToday && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--mk-terracotta)", color: "white" }}
                  >Today</span>
                )}
              </div>

              {/* Dinner (always shown) */}
              <div className="px-4 pt-2.5 pb-1">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#ccc" }}>
                  🍽️ Dinner
                </p>
                {dinnerDishes.map(d => (
                  <div key={d.id} className="flex items-center justify-between mb-1.5">
                    {d.recipe_id ? (
                      <Link
                        href={`/recipes/${d.recipe_id}`}
                        className="text-sm font-medium truncate flex-1 active:opacity-60"
                        style={{ color: "#1a1a1a" }}
                      >
                        {d.recipes?.name ?? d.free_text ?? "Dish"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium truncate flex-1" style={{ color: "#1a1a1a" }}>
                        {d.free_text ?? "Dish"}
                      </span>
                    )}
                    <button
                      onClick={() => removeDish(d.id)}
                      className="text-neutral-300 hover:text-red-400 ml-2 text-xl leading-none flex-shrink-0"
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={() => startAdding(day, "dinner")}
                  className="text-xs font-semibold pb-1"
                  style={{ color: isAddingHere && addTarget?.meal === "dinner" ? "#bbb" : "var(--mk-terracotta)" }}
                >
                  {isAddingHere && addTarget?.meal === "dinner"
                    ? "Search above…"
                    : dinnerDishes.length > 0 ? "+ Add another" : "+ Add dinner"}
                </button>
              </div>

              {/* Breakfast & Lunch */}
              {(hasBreakfast || hasLunch) ? (
                // At least one optional meal is set — show them expanded
                <div className="px-4 pb-2.5 space-y-2">
                  {hasBreakfast && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#ccc" }}>🍳 Breakfast</p>
                      {breakfast!.dishes.map(d => (
                        <div key={d.id} className="flex items-center justify-between mb-1">
                          {d.recipe_id ? (
                            <Link href={`/recipes/${d.recipe_id}`} className="text-sm font-medium truncate flex-1 active:opacity-60" style={{ color: "#1a1a1a" }}>
                              {d.recipes?.name ?? d.free_text ?? "Dish"}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium truncate flex-1" style={{ color: "#1a1a1a" }}>{d.free_text ?? "Dish"}</span>
                          )}
                          <button onClick={() => removeDish(d.id)} className="text-neutral-300 hover:text-red-400 ml-2 text-xl leading-none">×</button>
                        </div>
                      ))}
                      <button onClick={() => startAdding(day, "breakfast")} className="text-xs font-semibold" style={{ color: "var(--mk-terracotta)" }}>
                        {isAddingHere && addTarget?.meal === "breakfast" ? "Search above…" : "+ Add"}
                      </button>
                    </div>
                  )}
                  {hasLunch && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#ccc" }}>🥪 Lunch</p>
                      {lunch!.dishes.map(d => (
                        <div key={d.id} className="flex items-center justify-between mb-1">
                          {d.recipe_id ? (
                            <Link href={`/recipes/${d.recipe_id}`} className="text-sm font-medium truncate flex-1 active:opacity-60" style={{ color: "#1a1a1a" }}>
                              {d.recipes?.name ?? d.free_text ?? "Dish"}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium truncate flex-1" style={{ color: "#1a1a1a" }}>{d.free_text ?? "Dish"}</span>
                          )}
                          <button onClick={() => removeDish(d.id)} className="text-neutral-300 hover:text-red-400 ml-2 text-xl leading-none">×</button>
                        </div>
                      ))}
                      <button onClick={() => startAdding(day, "lunch")} className="text-xs font-semibold" style={{ color: "var(--mk-terracotta)" }}>
                        {isAddingHere && addTarget?.meal === "lunch" ? "Search above…" : "+ Add"}
                      </button>
                    </div>
                  )}
                  {/* Add whichever optional meal is still missing */}
                  <div className="flex gap-5 pt-0.5">
                    {!hasBreakfast && (
                      <button onClick={() => startAdding(day, "breakfast")} className="text-xs font-semibold" style={{ color: isAddingHere && addTarget?.meal === "breakfast" ? "#bbb" : "var(--mk-terracotta)" }}>
                        {isAddingHere && addTarget?.meal === "breakfast" ? "Search above…" : "+ Breakfast"}
                      </button>
                    )}
                    {!hasLunch && (
                      <button onClick={() => startAdding(day, "lunch")} className="text-xs font-semibold" style={{ color: isAddingHere && addTarget?.meal === "lunch" ? "#bbb" : "var(--mk-terracotta)" }}>
                        {isAddingHere && addTarget?.meal === "lunch" ? "Search above…" : "+ Lunch"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Neither set — compact same-line row
                <div className="flex gap-5 px-4 pb-2.5">
                  <button
                    onClick={() => startAdding(day, "breakfast")}
                    className="text-xs font-semibold"
                    style={{ color: isAddingHere && addTarget?.meal === "breakfast" ? "#bbb" : "var(--mk-terracotta)" }}
                  >
                    {isAddingHere && addTarget?.meal === "breakfast" ? "Search above…" : "+ Breakfast"}
                  </button>
                  <button
                    onClick={() => startAdding(day, "lunch")}
                    className="text-xs font-semibold"
                    style={{ color: isAddingHere && addTarget?.meal === "lunch" ? "#bbb" : "var(--mk-terracotta)" }}
                  >
                    {isAddingHere && addTarget?.meal === "lunch" ? "Search above…" : "+ Lunch"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Nestor suggests ── */}
        {!loading && (
          <div className="mt-1">
            <button
              onClick={() => setNestorOpen(o => !o)}
              className="w-full flex items-center justify-between bg-white rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--mk-border)" }}
            >
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#3E7B5A" }}>
                ✦ Nestor suggests
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--mk-terracotta)" }}>
                {nestorOpen ? "Hide ↑" : "Activate →"}
              </span>
            </button>

            {nestorOpen && (
              <div className="mt-2 space-y-2">
                {nestorSuggestions.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3 bg-white rounded-xl border" style={{ borderColor: "var(--mk-border)" }}>
                    All your recipes are planned this week! 🎉
                  </p>
                ) : nestorSuggestions.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5"
                    style={{ borderColor: "var(--mk-border)" }}
                  >
                    <span className="text-xl flex-shrink-0">{getEmoji(r)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{r.name}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">
                        {r.cuisine_tags?.[0] ?? r.meal_category ?? "recipe"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/recipes/${r.id}`}
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--mk-terracotta)" }}
                      >View</Link>
                      <button
                        onClick={() => addDish(weekDays[0], "dinner", r)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: "var(--mk-terracotta)", color: "white" }}
                      >+ Add</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
