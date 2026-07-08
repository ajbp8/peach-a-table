import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ONE-TIME SEED ROUTE — delete after use
// Imports the 9 original peach-a-table recipes for the admin user
export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "no service key" }, { status: 500 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find Adrien's user id
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, name")
    .limit(5);

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  // Use the first user (Adrien is the only user)
  const owner = users?.[0];
  if (!owner) return NextResponse.json({ error: "no user found", users }, { status: 400 });

  const recipes = [
    { name: "Poulet rôti",                  meal_category: "dinner", cuisine_tags: ["french"],         description: "Classic French roast chicken" },
    { name: "Steak haché & haricots verts", meal_category: "dinner", cuisine_tags: ["french"],         description: "Ground beef steak with green beans" },
    { name: "Salmon en papillote",          meal_category: "dinner", cuisine_tags: ["french"],         description: "Salmon baked in parchment with herbs" },
    { name: "Burgers & chips",              meal_category: "dinner", cuisine_tags: ["american"],       description: "Homemade beef burgers with chips" },
    { name: "Spaghetti bolognaise",         meal_category: "dinner", cuisine_tags: ["italian"],        description: "Slow-cooked beef bolognese sauce" },
    { name: "Shakshuka",                    meal_category: "dinner", cuisine_tags: ["middle-eastern"], description: "Eggs poached in spiced tomato sauce" },
    { name: "Ratatouille & poached eggs",   meal_category: "dinner", cuisine_tags: ["french"],         description: "Provençal vegetable stew with eggs" },
    { name: "Chicken fried rice",           meal_category: "dinner", cuisine_tags: ["asian"],          description: "Wok-fried rice with chicken and vegetables" },
    { name: "Yaya Fried Rice",              meal_category: "dinner", cuisine_tags: ["asian"],          description: "Family recipe fried rice" },
  ].map(r => ({ ...r, owner_id: owner.id, visibility: "family" }));

  // Skip any already inserted (by name)
  const { data: existing } = await supabase
    .from("recipes")
    .select("name")
    .eq("owner_id", owner.id);

  const existingNames = new Set((existing ?? []).map((r: { name: string }) => r.name));
  const toInsert = recipes.filter(r => !existingNames.has(r.name));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "All recipes already exist", existing: existing?.map(r => r.name) });
  }

  const { data, error } = await supabase.from("recipes").insert(toInsert).select("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: data?.map(r => r.name), owner: owner.name });
}
