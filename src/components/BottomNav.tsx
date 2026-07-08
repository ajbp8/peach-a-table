"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Menu", emoji: "📅" },
  { href: "/events", label: "Events", emoji: "🎉" },
  { href: "/discover", label: "Discover", emoji: "🍽️" },
  { href: "/saved", label: "Saved", emoji: "❤️" },
  { href: "/profile", label: "Profile", emoji: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on auth pages.
  if (pathname.startsWith("/login") || pathname.startsWith("/join")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
      style={{ borderColor: "var(--mk-border)" }}
    >
      <div className="max-w-md mx-auto flex">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px]"
              style={{ color: active ? "var(--mk-terracotta)" : "#9a948a" }}
            >
              <span className="text-lg leading-none">{tab.emoji}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
