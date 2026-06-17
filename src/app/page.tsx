import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-5 pt-8">
      <h1 className="text-xl font-bold" style={{ color: "var(--mk-terracotta)" }}>
        Memory Kitchen
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Signed in as {user?.email}. This week&apos;s menu will live here.
      </p>
    </main>
  );
}
