"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Recipe = { id: string; name: string; meal_category: string | null; cuisine_tags: string[] | null };
type Dish = { id: string; recipe_id: string | null; free_text: string | null; recipes?: { name: string; meal_category: string | null; cuisine_tags: string[] | null } | null };
type Slot = { id: string; day_date: string; meal_type: string; dishes: Dish[] };
type WeekData = { week_id: string | null; slots: Slot[] };

const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const CUISINE_EMOJI: Record<string,string> = {
  italian:"🍝",mexican:"🌮",indian:"🍛",chinese:"🥡",japanese:"🍣",
  thai:"🍜",french:"🥐",mediterranean:"🥙",american:"🍔","middle-eastern":"🫙",dessert:"🍰",baking:"🍞",
};
function getEmoji(r: Recipe) { const t = r.cuisine_tags?.[0]?.toLowerCase(); return (t && CUISINE_EMOJI[t]) || "🍽️"; }

// LOCAL date helpers — toISOString() is UTC and shifts dates for UTC+ timezones
function toISO(d: Date) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}
function todayISO() { return toISO(new Date()); }

function getMonday(offsetWeeks: number): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function RingsLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="3" stroke="white" strokeWidth="1.4"/>
      <circle cx="11" cy="11" r="6.5" stroke="white" strokeWidth="1.1" strokeDasharray="17 3.8"/>
      <circle cx="11" cy="11" r="10" stroke="white" strokeWidth="0.8" strokeDasharray="25 5.7"/>
    </svg>
  );
}

export default function WeekMenu({ recipes }: { recipes: Recipe[] }) {
  const [mounted, setMounted] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  // Start empty — set to today on client mount to avoid SSR/client hydration mismatch
  const [selectedDay, setSelectedDay] = useState("");
  const [weekData, setWeekData] = useState<WeekData>({ week_id: null, slots: [] });
  const [loading, setLoading] = useState(true);
  const [addTarget, setAddTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showBreakfast, setShowBreakfast] = useState(false);
  const [showLunch, setShowLunch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Hydration fix: new Date() differs between server (UTC) and client (local tz)
  useEffect(() => {
    setMounted(true);
    setSelectedDay(todayISO());
  }, []);

  const monday = getMonday(weekOffset);
  const weekStart = toISO(monday);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return toISO(d);
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
    if (!mounted) return;
    const t = todayISO();
    setSelectedDay(weekDays.includes(t) ? t : weekDays[0]);
    setShowBreakfast(false); setShowLunch(false); setAddTarget(null); setSearch("");
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addDish(meal: string, recipe: Recipe) {
    await fetch("/api/menu/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: weekStart, day_date: selectedDay, meal_type: meal, recipe_id: recipe.id }),
    });
    setAddTarget(null); setSearch(""); fetchWeek();
  }

  async function removeDish(id: string) {
    await fetch(`/api/menu/dishes/${id}`, { method: "DELETE" }); fetchWeek();
  }

  function startAdding(meal: string) {
    setAddTarget(meal);
    if (meal === "breakfast") setShowBreakfast(true);
    if (meal === "lunch") setShowLunch(true);
    setTimeout(() => {
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  const daySlots = weekData.slots.filter(s => s.day_date === selectedDay);
  const slotFor = (meal: string) => daySlots.find(s => s.meal_type === meal);
  const plannedIds = new Set(weekData.slots.flatMap(s => s.dishes.map(d => d.recipe_id)).filter(Boolean));
  const nestorSuggestions = recipes.filter(r => !plannedIds.has(r.id)).slice(0, 3);
  const searchResults = search.trim().length > 0
    ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];
  const daysWithDinner = new Set(
    weekData.slots.filter(s => s.meal_type === "dinner" && s.dishes.length > 0).map(s => s.day_date)
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--mk-cream)] flex items-center justify-center">
        <div style={{ color: "var(--mk-terracotta)" }} className="text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mk-cream)]">
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #3E7B5A 0%, #6AAF88 100%)" }} className="px-5 pt-10 pb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <RingsLogo />
          <span style={{ fontWeight: 900, fontSize: "22px", letterSpacing: "-0.5px", lineHeight: 1 }}>
            <span style={{ color: "white" }}>Memory</span>
            <span style={{ color: "#FFE580" }}> Kitchen</span>
          </span>
        </div>
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={addTarget ? `Search to add ${addTarget}…` : "Search your recipes…"}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: "white" }}
          />
          {search.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl overflow-hidden z-30"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              {addTarget && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b"
                  style={{ color: "var(--mk-terracotta)", borderColor: "var(--mk-border)" }}>
                  Adding to {addTarget}
                </div>
              )}
              {searchResults.length === 0
                ? <p className="px-4 py-3 text-xs text-neutral-400">No recipes found</p>
                : searchResults.map(r => (
                  <button key={r.id} onClick={() => addDish(addTarget ?? "dinner", r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b last:border-0 text-left"
                    style={{ borderColor: "var(--mk-border)" }}>
                    <span className="text-lg flex-shrink-0">{getEmoji(r)}</span>
                    <span className="text-sm truncate font-medium" style={{ color: "#1a1a1a" }}>{r.name}</span>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Week nav */}
      <div className="bg-white border-b px-5 py-3" style={{ borderColor: "var(--mk-border)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={() => setWeekOffset(o => Math.max(-2, o - 1))} disabled={weekOffset <= -2}
            className="text-xs font-semibold disabled:opacity-25" style={{ color: "var(--mk-terracotta)" }}>← prev</button>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago` : `In ${weekOffset}w`}
          </span>
          <button onClick={() => setWeekOffset(o => Math.min(2, o + 1))} disabled={weekOffset >= 2}
            className="text-xs font-semibold disabled:opacity-25" style={{ color: "var(--mk-terracotta)" }}>next →</button>
        </div>
        <div className="flex gap-0.5">
          {weekDays.map((day, i) => {
            const date = new Date(day + "T12:00:00");
            const isSel = day === selectedDay;
            const hasDot = daysWithDinner.has(day);
            return (
              <button key={day} onClick={() => { setSelectedDay(day); setAddTarget(null); setSearch(""); }}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg transition-colors"
                style={{ background: isSel ? "var(--mk-terracotta)" : "transparent" }}>
                <span className="text-[10px]" style={{ color: isSel ? "rgba(255,255,255,0.7)" : "#aaa" }}>{DAY_LABELS[i]}</span>
                <span className="text-sm font-bold" style={{ color: isSel ? "white" : "#1a1a1a" }}>{date.getDate()}</span>
                <span className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ background: hasDot ? (isSel ? "rgba(255,255,255,0.8)" : "var(--mk-terracotta)") : "transparent" }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="px-5 pt-4 pb-28">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
          {selectedDay && new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {loading ? (
          <p className="text-xs text-neutral-400 text-center py-10">Loading…</p>
        ) : (
          <div className="space-y-2">
            <MealSection label="Dinner" meal="dinner" emoji="🍽️"
              slot={slotFor("dinner")} isAdding={addTarget === "dinner"}
              onStartAdd={() => startAdding("dinner")} onRemove={removeDish} />
            <div className="flex flex-col gap-3 pt-1">
              {(showBreakfast || (slotFor("breakfast")?.dishes.length ?? 0) > 0) ? (
                <MealSection label="Breakfast" meal="breakfast" emoji="🍳"
                  slot={slotFor("breakfast")} isAdding={addTarget === "breakfast"}
                  onStartAdd={() => startAdding("breakfast")} onRemove={removeDish} />
              ) : (
                <button onClick={() => startAdding("breakfast")}
                  className="text-xs font-semibold py-1 text-left" style={{ color: "var(--mk-terracotta)" }}>
                  + Add breakfast
                </button>
              )}
              {(showLunch || (slotFor("lunch")?.dishes.length ?? 0) > 0) ? (
                <MealSection label="Lunch" meal="lunch" emoji="🥪"
                  slot={slotFor("lunch")} isAdding={addTarget === "lunch"}
                  onStartAdd={() => startAdding("lunch")} onRemove={removeDish} />
              ) : (
                <button onClick={() => startAdding("lunch")}
                  className="text-xs font-semibold py-1 text-left" style={{ color: "var(--mk-terracotta)" }}>
                  + Add lunch
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nestor suggests */}
        {!loading && nestorSuggestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#3E7B5A" }}>✦ Nestor suggests</h2>
            <div className="space-y-2">
              {nestorSuggestions.map(r => (
                <button key={r.id} onClick={() => addDish("dinner", r)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5 text-left"
                  style={{ borderColor: "var(--mk-border)" }}>
                  <span className="text-xl flex-shrink-0">{getEmoji(r)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{r.name}</p>
                    <p className="text-[10px] text-neutral-400">{r.cuisine_tags?.[0] ?? r.meal_category ?? "recipe"}</p>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--mk-terracotta)" }}>+ Add</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MealSection({ label, meal, emoji, slot, isAdding, onStartAdd, onRemove }: {
  label: string; meal: string; emoji: string; slot: Slot | undefined;
  isAdding: boolean; onStartAdd: () => void; onRemove: (id: string) => void;
}) {
  const dishes = slot?.dishes ?? [];
  return (
    <div className="bg-white rounded-xl border px-4 py-3" style={{ borderColor: "var(--mk-border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--mk-terracotta)" }}>
        {emoji} {label}
      </p>
      {dishes.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {dishes.map(d => (
            <div key={d.id} className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                {d.recipes?.name ?? d.free_text ?? "Dish"}
              </span>
              <button onClick={() => onRemove(d.id)} className="text-neutral-300 hover:text-red-400 ml-3 text-xl leading-none">×</button>
            </div>
          ))}
        </div>
      )}
      {isAdding
        ? <p className="text-xs italic" style={{ color: "var(--mk-terracotta)" }}>Search above to add a recipe…</p>
        : <button onClick={onStartAdd} className="text-xs font-medium"
            style={{ color: dishes.length > 0 ? "var(--mk-terracotta)" : "#bbb" }}>
            {dishes.length > 0 ? "+ Add another" : `+ Add ${label.toLowerCase()}`}
          </button>
      }
    </div>
  );
}
