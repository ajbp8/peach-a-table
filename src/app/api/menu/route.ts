import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function ensureFamily(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: m } = await supabase
    .from("family_members").select("family_id").eq("user_id", userId).limit(1).maybeSingle();
  if (m) return m.family_id as string;
  const { data: fam } = await supabase
    .from("families").insert({ name: "My Kitchen", created_by: userId }).select("id").single();
  if (!fam) return null;
  await supabase.from("family_members").insert({ family_id: fam.id, user_id: userId, role: "admin" });
  return fam.id as string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("week_start");
  if (!weekStart) return NextResponse.json({ error: "week_start required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const familyId = await ensureFamily(supabase, user.id);
  if (!familyId) return NextResponse.json({ week_id: null, slots: [] });

  let { data: week } = await supabase
    .from("menu_weeks").select("id")
    .eq("family_id", familyId).eq("week_start", weekStart).maybeSingle();

  if (!week) {
    const { data: nw } = await supabase
      .from("menu_weeks").insert({ family_id: familyId, week_start: weekStart }).select("id").single();
    week = nw;
  }
  if (!week) return NextResponse.json({ week_id: null, slots: [] });

  const { data: slots } = await supabase
    .from("menu_slots")
    .select("id, day_date, meal_type, menu_dishes(id, recipe_id, free_text, sort_order, recipes(id, name, meal_category, cuisine_tags))")
    .eq("week_id", week.id);

  return NextResponse.json({
    week_id: week.id,
    slots: (slots ?? []).map(s => ({
      id: s.id, day_date: s.day_date, meal_type: s.meal_type,
      dishes: (s.menu_dishes ?? []),
    })),
  });
}
