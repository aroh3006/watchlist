"use client";

import { TvIcon, FilmIcon } from "./icons";
import { Logo } from "./Logo";

const SIDE_ITEMS = [
  { label: "Shows", icon: TvIcon },
  { label: "Movies", icon: FilmIcon },
];

function StatusBar({ windowTitle }: { windowTitle: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b-2 border-ink bg-bg-raised font-mono text-[11px] sm:text-xs text-ink">
      <div className="flex items-center gap-3">
        <Logo className="w-4 h-4" />
        <span className="hidden sm:inline text-ink-muted">Shows &nbsp; Movies</span>
      </div>
      <span className="text-ink-muted truncate px-2">{windowTitle}</span>
    </div>
  );
}

function Wave() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        d="M0 38 C 18 30, 30 46, 48 40 S 78 26, 100 34 L100 100 L0 100 Z"
        fill="#cddfec"
        opacity="0.9"
      />
      <path
        d="M0 52 C 22 46, 34 60, 55 54 S 82 44, 100 50 L100 100 L0 100 Z"
        fill="#8fb2cf"
        opacity="0.55"
      />
    </svg>
  );
}

export function AuthHero({
  windowTitle,
  children,
}: {
  windowTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden flex flex-col">
      <StatusBar windowTitle={windowTitle} />
      <div className="relative flex-1">
        <Wave />

        {/* right-edge shortcuts */}
        <div className="hidden md:flex flex-col items-center gap-6 absolute right-8 top-24">
          {SIDE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-1 text-ink">
                <div className="w-11 h-11 rounded-xl border-2 border-ink bg-bg-raised flex items-center justify-center shadow-card">
                  <Icon width={18} height={18} />
                </div>
                <span className="font-mono text-[10px] text-ink-muted">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* mascot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/raccoon-hero.png"
          alt=""
          aria-hidden="true"
          className="hidden md:block absolute left-4 lg:left-12 bottom-0 w-80 lg:w-[26rem] opacity-90 pointer-events-none select-none"
        />

        {/* window */}
        <div className="relative flex items-center justify-center md:justify-end px-4 py-14 sm:py-20 min-h-full">
          <div className="w-full max-w-sm md:mr-[18%] border-2 border-ink rounded-2xl bg-bg-raised shadow-card overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b-2 border-ink bg-bg-overlay">
              <span className="w-2.5 h-2.5 rounded-full border border-ink" />
              <span className="w-2.5 h-2.5 rounded-full border border-ink" />
            </div>
            <div className="p-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
