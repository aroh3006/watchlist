"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarIcon } from "./icons";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lets a watch event that was just created (this page session) be logged
 * for a different day than today. Only ever targets the exact watch ids the
 * caller passes in, the ones just created by marking something watched, not
 * a general "edit any past watch" control. Nothing shows here for an item
 * that was already watched before this page loaded, that history is left
 * alone on purpose.
 *
 * Noon UTC is used as the picked date's time-of-day rather than midnight,
 * so converting it back to a calendar day in the user's own timezone never
 * lands on the wrong day, midnight UTC can shift a full day earlier for
 * timezones west of UTC.
 */
export function WatchDateEditor({
  kind,
  watchIds,
}: {
  kind: "episode" | "movie";
  watchIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = todayDateString();

  async function apply(dateStr: string) {
    if (!dateStr) return;
    setSaving(true);
    const watchedAt = new Date(dateStr + "T12:00:00Z").toISOString();
    if (kind === "episode") {
      await fetch("/api/episode-watches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: watchIds, watchedAt }),
      });
    } else {
      await fetch(`/api/movie-watches/${watchIds[0]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedAt }),
      });
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        aria-label="Set the date this was actually watched"
        title="Set the date this was actually watched"
        className="text-ink-faint hover:text-ink focus-ring rounded p-1 transition-colors disabled:opacity-60"
      >
        <CalendarIcon width={15} height={15} />
      </button>
      {open && (
        <input
          type="date"
          autoFocus
          defaultValue={today}
          max={today}
          disabled={saving}
          onChange={(e) => apply(e.target.value)}
          onBlur={() => setOpen(false)}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-1 z-10 w-36 rounded-lg bg-bg-overlay border border-border px-2 py-1 text-xs focus-ring"
        />
      )}
    </span>
  );
}
