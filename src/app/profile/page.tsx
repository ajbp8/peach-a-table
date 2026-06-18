import { createClient } from "@/lib/supabase/server";
import CreateHousehold from "@/components/CreateHousehold";
import InviteLink from "@/components/InviteLink";

// First real (non-placeholder) screen in the app, matching the "Profile"
// mockup. Households, recipes, and friendships all exist as tables already
// (Session 1), but nothing in the app could read or write them yet — this
// page is where that wiring happens. Recipe creation itself is the next
// session, so "Your recipes" only renders an empty state for now.
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // middleware already redirects unauthenticated visitors to /login
  }

  const [profileResult, membershipResult, recipeCountResult, friendCountResult] =
    await Promise.all([
      supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
      supabase
        .from("family_members")
        .select("families(name)")
        .eq("user_id", user.id)
        .limit(1),
      supabase
        .from("recipes")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id),
      supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
    ]);

  const displayName =
    profileResult.data?.name || user.email?.split("@")[0] || "there";
  const initials = displayName.slice(0, 2).toUpperCase();

  const membershipRow = membershipResult.data?.[0] as
    | { families: { name: string } | { name: string }[] | null }
    | undefined;
  const familiesValue = membershipRow?.families;
  const familyName = Array.isArray(familiesValue)
    ? familiesValue[0]?.name
    : familiesValue?.name;

  const recipeCount = recipeCountResult.count ?? 0;
  const friendCount = friendCountResult.count ?? 0;

  return (
    <main className="min-h-screen px-5 pt-8 pb-6 bg-[var(--mk-cream)]">
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xl font-bold"
          style={{ background: "linear-gradient(135deg, #c8602a, #e8854a)" }}
        >
          {initials}
        </div>
        <h1 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>
          {displayName}
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          {familyName ?? "No household yet"}
        </p>
        <div className="flex justify-center gap-6 mt-3">
          <Stat label="Recipes" value={recipeCount} />
          <Stat label="Friends" value={friendCount} />
        </div>
      </div>

      {!familyName && <CreateHousehold />}

      <InviteLink />

      <div className="mt-2">
        <h2 className="text-sm font-bold mb-2" style={{ color: "#1a1a1a" }}>
          Your recipes
        </h2>
        <p className="text-xs text-neutral-500">
          {recipeCount > 0
            ? "Recipe list coming next session."
            : "No recipes yet — adding recipes is coming in the next session."}
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold" style={{ color: "#1a1a1a" }}>
        {value}
      </div>
      <div className="text-[10px] text-neutral-500">{label}</div>
    </div>
  );
}
