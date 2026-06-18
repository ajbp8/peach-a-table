import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Recipes are Session 3's first real feature beyond households. Visibility
// ('public' | 'friends' | 'private') is enforced by the recipes_select_visible
// RLS policy, so the GET handler below doesn't re-implement that logic - it
// just runs the query a signed-in user is allowed to run, and Postgres
// filters out anything they shouldn't see.
//
// Note: the initial Profile and Discover pages fetch recipes directly with
// the server Supabase client (same pattern as /profile's household/friend
// counts), not through this GET route - that matches how this app's reads
// already work. GET is exposed here anyway as a plain JSON endpoint for any
// future client-driven view (e.g. infinite scroll) that needs to refetch
// without a full page reload.

const VISIBILITY_VALUES = ["public", "friends", "private"];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Recipe name is required." }, { status: 400 });
  }

  const visibility = VISIBILITY_VALUES.includes(body.visibility)
    ? body.visibility
    : "private";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      owner_id: user.id,
      name,
      story: typeof body.story === "string" ? body.story.trim() || null : null,
      ingredients:
        typeof body.ingredients === "string" ? body.ingredients.trim() || null : null,
      source_url:
        typeof body.source_url === "string" ? body.source_url.trim() || null : null,
      meal_category:
        typeof body.meal_category === "string" ? body.meal_category.trim() || null : null,
      cuisine_tags: toStringArray(body.cuisine_tags),
      dietary_tags: toStringArray(body.dietary_tags),
      visibility,
    })
    .select("id")
    .single();

  if (error || !recipe) {
    return NextResponse.json(
      { error: "Couldn't save the recipe. Try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, recipeId: recipe.id });
}

// GET /api/recipes            -> discover feed (other people's recipes)
// GET /api/recipes?mine=1     -> the signed-in user's own recipes
// Optional filters: meal_category, cuisine
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "1";
  const mealCategory = searchParams.get("meal_category");
  const cuisine = searchParams.get("cuisine");

  let query = supabase
    .from("recipes")
    .select(
      "id, owner_id, name, story, source_url, meal_category, cuisine_tags, dietary_tags, visibility, save_count, created_at, users(name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  query = mine ? query.eq("owner_id", user.id) : query.neq("owner_id", user.id);

  if (mealCategory) {
    query = query.eq("meal_category", mealCategory);
  }
  if (cuisine) {
    query = query.contains("cuisine_tags", [cuisine]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Couldn't load recipes." }, { status: 400 });
  }

  return NextResponse.json({ recipes: data ?? [] });
}
