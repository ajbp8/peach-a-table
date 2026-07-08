import { createClient } from "@/lib/supabase/server";
import WeekMenu from "@/components/WeekMenu";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name, meal_category, cuisine_tags")
    .order("name");

  return <WeekMenu recipes={recipes ?? []} />;
}
