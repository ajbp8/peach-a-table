import { createClient } from "@/lib/supabase/server";

function RingsLogo({ size = 32, color = "white" }: { size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size * 0.14;
  const r2 = size * 0.30;
  const r3 = size * 0.46;
  const sw1 = size * 0.055;
  const sw2 = size * 0.044;
  const sw3 = size * 0.033;
  const d2 = (2 * Math.PI * r2 * 0.78).toFixed(1);
  const g2 = (2 * Math.PI * r2 * 0.22).toFixed(1);
  const d3 = (2 * Math.PI * r3 * 0.78).toFixed(1);
  const g3 = (2 * Math.PI * r3 * 0.22).toFixed(1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
      <circle cx={cx} cy={cy} r={r1} stroke={color} strokeWidth={sw1} />
      <circle cx={cx} cy={cy} r={r2} stroke={color} strokeWidth={sw2}
        strokeDasharray={`${d2} ${g2}`} strokeDashoffset={size * 0.12} />
      <circle cx={cx} cy={cy} r={r3} stroke={color} strokeWidth={sw3}
        strokeDasharray={`${d3} ${g3}`} strokeDashoffset={size * 0.18} />
    </svg>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const displayName = profile?.name || user?.email?.split("@")[0] || "there";

  return (
    <main className="min-h-screen bg-[var(--mk-cream)]">
      <div
        className="px-5 pt-10 pb-8"
        style={{ background: "linear-gradient(135deg, #3E7B5A 0%, #6AAF88 100%)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <RingsLogo size={28} color="white" />
          <span className="text-white font-semibold text-base tracking-wide">Memory Kitchen</span>
        </div>
        <p className="text-white/60 text-xs tracking-widest uppercase mb-1">
          Invite-only · the recipes of your life
        </p>
        <h1 className="text-white text-2xl font-bold mt-3">
          Hello, {displayName}
        </h1>
      </div>

      <div className="px-5 pt-6">
        <p className="text-sm text-neutral-500 text-center mt-8">
          Your weekly menu will appear here.
        </p>
      </div>
    </main>
  );
}
