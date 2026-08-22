"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WATCH_STATUSES, WATCH_STATUS_LABEL, type WatchStatus } from "@/lib/constants";
import { StarIcon } from "./icons";

export function ShowActions({
  showId,
  initialStatus,
  initialFavorited,
  initialRating,
  kind,
}: {
  showId: string;
  initialStatus?: string | null;
  initialFavorited: boolean;
  initialRating?: number | null;
  kind: "show" | "movie";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus ?? "");
  const [favorited, setFavorited] = useState(initialFavorited);
  const [rating, setRating] = useState(initialRating ?? 0);
  const [saving, setSaving] = useState(false);

  const statusEndpoint = kind === "show" ? `/api/shows/${showId}/status` : `/api/movies/${showId}/status`;

  async function updateStatus(next: string) {
    setSaving(true);
    setStatus(next);
    await fetch(statusEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    startTransition(() => router.refresh());
  }

  async function toggleFavorite() {
    setFavorited((f) => !f);
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: kind === "show" ? "SHOW" : "MOVIE", id: showId }),
    });
    startTransition(() => router.refresh());
  }

  async function setUserRating(score: number) {
    setRating(score);
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: kind === "show" ? "SHOW" : "MOVIE", id: showId, score }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={saving}
        aria-label="Watch status"
        className="rounded-lg bg-bg-overlay border border-border px-3 py-2 text-sm focus-ring"
      >
        <option value="" disabled>
          {status ? WATCH_STATUS_LABEL[status as WatchStatus] : "Add to library"}
        </option>
        {WATCH_STATUSES.filter((s) =>
          kind === "movie" ? s !== "WATCHING" && s !== "PAUSED" : s !== "NOT_WATCHED"
        ).map((s) => (
          <option key={s} value={s}>
            {WATCH_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <button
        onClick={toggleFavorite}
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-1.5 transition-colors focus-ring ${
          favorited ? "border-accent text-accent bg-accent/10" : "border-border text-ink-muted hover:text-ink"
        }`}
      >
        <StarIcon width={16} height={16} fill={favorited ? "currentColor" : "none"} />
        Favorite
      </button>

      <div className="flex items-center gap-0.5" role="group" aria-label="Your rating">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setUserRating(n)}
            aria-label={`Rate ${n} out of 10`}
            aria-pressed={rating >= n}
            className="focus-ring rounded"
          >
            <StarIcon width={16} height={16} className={n <= rating ? "text-brand-300" : "text-ink-faint"} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-ink-muted ml-1">{rating}/10</span>}
      </div>
    </div>
  );
}
