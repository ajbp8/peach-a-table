"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Inline SVG icons — no extra dependency, consistent rendering everywhere.
function IconMenu({ active }: { active: boolean }) {
  const c = active ? "var(--mk-terracotta)" : "#9a948a";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconEvents({ active }: { active: boolean }) {
  const c = active ? "var(--mk-terracotta)" : "#9a948a";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconDiscover({ active }: { active: boolean }) {
  const c = active ? "var(--mk-terracotta)" : "#9a948a";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconSaved({ active }: { active: boolean }) {
  const c = active ? "var(--mk-terracotta)" : "#9a948a";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const c = active ? "var(--mk-terracotta)" : "#9a948a";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS = [
  { href: "/",         label: "Menu",     Icon: IconMenu },
  { href: "/events",   label: "Events",   Icon: IconEvents },
  { href: "/discover", label: "Discover", Icon: IconDiscover },
  { href: "/saved",    label: "Saved",    Icon: IconSaved },
  { href: "/profile",  label: "Profile",  Icon: IconProfile },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/join")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
      style={{ borderColor: "var(--mk-border)" }}
    >
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3"
            >
              <Icon active={active} />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? "var(--mk-terracotta)" : "#9a948a" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
