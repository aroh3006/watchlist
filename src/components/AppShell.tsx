"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  TvIcon,
  FilmIcon,
  CompassIcon,
  CalendarIcon,
  ListIcon,
  BarChartIcon,
  UserIcon,
} from "./icons";
import { Logo } from "./Logo";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/shows", label: "Shows", icon: TvIcon },
  { href: "/movies", label: "Movies", icon: FilmIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/upcoming", label: "Upcoming", icon: CalendarIcon },
  { href: "/lists", label: "Lists", icon: ListIcon },
  { href: "/stats", label: "Statistics", icon: BarChartIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

const MOBILE_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[7],
];

export default function AppShell({ children, username }: { children: ReactNode; username: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-bg text-ink">
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 border-r border-border bg-bg-raised px-5 py-7">
        <Link href="/" className="flex items-center gap-2.5 px-1 mb-10 focus-ring rounded">
          <span className="w-9 h-9 rounded-lg bg-bg-overlay border border-border-subtle flex items-center justify-center text-brand-300">
            <Logo className="w-7 h-7" />
          </span>
          <span className="font-display font-semibold text-xl tracking-tight">Watchlist</span>
        </Link>
        <nav className="flex flex-col gap-2" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-base font-medium transition-colors focus-ring ${
                  active ? "bg-brand-100 text-brand-600" : "text-ink-muted hover:text-ink hover:bg-bg-overlay"
                }`}
              >
                <Icon width={22} height={22} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-5 border-t border-border-subtle flex items-center justify-between">
          <span className="text-sm text-ink-muted truncate">@{username}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-ink-faint hover:text-ink focus-ring rounded px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-raised/95 backdrop-blur border-t border-border flex items-stretch"
        aria-label="Primary"
      >
        {MOBILE_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] focus-ring ${
                active ? "text-brand-500" : "text-ink-faint"
              }`}
            >
              <Icon width={22} height={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
