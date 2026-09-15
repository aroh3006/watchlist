"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarIcon } from "./icons";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Corrects the date on specific watch rows, identified by id. Two ways to
 * reach it: right after marking something watched (an icon next to the new
 * "Watched"/"Completed" state, watchIds coming from that action's own
 * response), and persistently wherever a completion date is displayed
 * (label + currentDate given, watchIds coming from a fresh page load). Both
 * paths call the same PATCH endpoints and only ever target the exact ids
 * passed in, this is not a browse-and-pick-any-watch control.
 *
 * Noon UTC is used as the picked date's time-of-day rather than midnight,
 * so converting it back to a calendar day in the user's own timezone never
 * lands on the wrong day, midnight UTC can shift a full day earlier for
 * timezones west of UTC.
 */
export function WatchDateEditor({
  kind,
  watchIds,
  currentDate,
  label,
}: {
  kind: "episode" | "movie";
  watchIds: string[];
  /** yyyy-mm-dd the picker opens to. Defaults to today, e.g. right after marking something watched. */
  currentDate?: string;
  /** When given, this text is the clickable trigger (a persistent "Completed <date>" display) instead of a bare icon. */
  label?: string;
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
    <span className="relative inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        aria-label={label ? `${label}. Click to change the date.` : "Set the date this was actually watched"}
        title="Change the watched date"
        className={
          label
            ? "flex items-center gap-1 text-xs text-ink-faint hover:text-ink transition-colors focus-ring rounded disabled:opacity-60"
            : "text-ink-faint hover:text-ink focus-ring rounded p-1 transition-colors disabled:opacity-60"
        }
      >
        {label ? (
          <>
            {label}
            <CalendarIcon width={12} height={12} />
          </>
        ) : (
          <CalendarIcon width={15} height={15} />
        )}
      </button>
      {open && (
        <input
          type="date"
          autoFocus
          defaultValue={currentDate ?? today}
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
