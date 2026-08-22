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

  function onStatusSelect(next: string) {
    // Not Watched deletes data, so picking it only opens the confirm
    // dialog. The select shows it as chosen while the dialog is open, but
    // nothing is applied until the user actually confirms.
    if (next === "NOT_WATCHED") {
      setConfirmingRemove(true);
      return;
    }
    updateStatus(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={confirmingRemove ? "NOT_WATCHED" : status}
        onChange={(e) => onStatusSelect(e.target.value)}
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
        {kind === "movie" && <option value="NOT_WATCHED">Not Watched</option>}
      </select>

      {confirmingRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl2 border border-border bg-bg-raised p-5 shadow-card">
            <p className="font-semibold text-sm mb-1">Remove this movie?</p>
            <p className="text-xs text-ink-muted mb-4">Remove tracking, rating and favorite for this movie?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingRemove(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink transition-colors focus-ring"
              >
                Cancel
              </button>
              <button
                onClick={markNotWatched}
                disabled={removing}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors focus-ring"
              >
                {removing ? "Removing..." : "Not Watched"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <RatingStars score={rating} onChange={setUserRating} onClear={clearUserRating} />
    </div>
  );
}
