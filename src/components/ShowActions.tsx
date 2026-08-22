"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WATCH_STATUSES, WATCH_STATUS_LABEL, type WatchStatus } from "@/lib/constants";
import { StarIcon } from "./icons";
import { RatingStars } from "./RatingStars";

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
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

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

  async function clearUserRating() {
    setRating(0);
    await fetch("/api/ratings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: kind === "show" ? "SHOW" : "MOVIE", id: showId }),
    });
    startTransition(() => router.refresh());
  }

  // "Not Watched" fully untracks a movie: it deletes UserMovie, Rating, and
  // Favorite so the page looks exactly like a movie the user never touched.
  // MovieWatch/DailyWatchActivity are never touched by this, real watch
  // history is never erased just because tracking status changes later.
  async function markNotWatched() {
    setRemoving(true);
    await fetch(statusEndpoint, { method: "DELETE" });
    setStatus("");
    setFavorited(false);
    setRating(0);
    setRemoving(false);
    setConfirmingRemove(false);
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
        {WATCH_STATUSES.filter((s) => (kind === "movie" ? s !== "WATCHING" && s !== "PAUSED" : true)).map((s) => (
          <option key={s} value={s}>
            {WATCH_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      {kind === "movie" &&
        (confirmingRemove ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">Remove tracking, rating, and favorite for this movie?</span>
            <button onClick={markNotWatched} disabled={removing} className="text-accent font-medium focus-ring rounded px-2 py-1">
              {removing ? "Removing..." : "Not Watched"}
            </button>
            <button onClick={() => setConfirmingRemove(false)} className="text-ink-muted focus-ring rounded px-2 py-1">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingRemove(true)}
            className="rounded-lg border px-3 py-2 text-sm border-border text-ink-muted hover:text-ink hover:border-ink-faint transition-colors focus-ring"
          >
            Not Watched
          </button>
        ))}

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

      <RatingStars score={rating} onChange={setUserRating} />
    </div>
  );
}
