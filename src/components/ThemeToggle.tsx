"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";
import { getCurrentTheme, setTheme, THEME_CHANGE_EVENT, type Theme } from "@/lib/theme";

/**
 * Sun/moon toggle. Reads and writes the same theme state as the blocking
 * init script in the root layout (see src/lib/theme.ts). Two of these can
 * be on screen at once (sidebar footer, Profile page), so every toggle
 * resyncs from the DOM on a shared event instead of keeping its own
 * disconnected copy of the current theme.
 */
export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "row";
}) {
  const [theme, setLocalTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function sync() {
      setLocalTheme(getCurrentTheme());
    }
    sync();
    setMounted(true);
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync);
  }, []);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const Icon = theme === "dark" ? MoonIcon : SunIcon;

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={!mounted}
        className="w-full flex items-center justify-between rounded-lg border border-border bg-bg-overlay px-3.5 py-3 text-sm focus-ring disabled:opacity-0"
      >
        <span className="flex items-center gap-2 text-ink">
          <Icon width={18} height={18} />
          Appearance
        </span>
        <span className="text-ink-muted">{theme === "dark" ? "Dark" : "Light"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      disabled={!mounted}
      className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:text-ink hover:bg-bg-overlay transition-colors focus-ring disabled:opacity-0"
    >
      <Icon width={18} height={18} />
    </button>
  );
}
