"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 300;

/**
 * Live search box for Discover. Typing debounces into a router navigation
 * to /discover?q=..., which re-runs the server page and its existing
 * title/genre/cast/character search, so ranking and results are untouched,
 * only the trigger changes from submit to type-ahead. Next's router
 * supersedes an older in-flight navigation with a newer one on its own, so
 * a fast typer never has an old response race ahead of a newer one.
 */
export function DiscoverSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function navigateTo(q: string) {
    const target = q ? `/discover?q=${encodeURIComponent(q)}` : "/discover";
    startTransition(() => router.replace(target));
  }

  useEffect(() => {
    if (value === defaultValue) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => navigateTo(value), DEBOUNCE_MS);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      action="/discover"
      className="max-w-lg"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timeoutRef.current);
        navigateTo(value);
      }}
    >
      <div className="relative">
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search shows, movies, actors, characters..."
          className="w-full rounded-lg bg-bg-overlay border border-border px-4 py-2.5 text-sm focus-ring"
        />
        {isPending && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-ink-faint border-t-transparent animate-spin"
            aria-hidden="true"
          />
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {isPending ? "Searching..." : ""}
      </span>
    </form>
  );
}
