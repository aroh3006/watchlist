"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircleIcon } from "./icons";

export function EpisodeWatchToggle({
  episodeId,
  initialWatched,
  rewatchCount,
  previousUnwatchedEpisodeIds = [],
}: {
  episodeId: string;
  initialWatched: boolean;
  rewatchCount: number;
  previousUnwatchedEpisodeIds?: string[];
}) {
  const router = useRouter();
  const [watched, setWatched] = useState(initialWatched);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function markIds(ids: string[]) {
    setBusy(true);
    await Promise.all(ids.map((id) => fetch(`/api/episodes/${id}/watch`, { method: "POST" })));
    setBusy(false);
    setWatched(true);
    startTransition(() => router.refresh());
  }

  async function toggle() {
    if (watched) {
      setWatched(false);
      await fetch(`/api/episodes/${episodeId}/watch`, { method: "DELETE" });
      startTransition(() => router.refresh());
      return;
    }
    if (previousUnwatchedEpisodeIds.length > 0) {
      setShowConfirm(true);
      return;
    }
    await markIds([episodeId]);
  }

  async function rewatch() {
    await fetch(`/api/episodes/${episodeId}/watch`, { method: "POST" });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={watched}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus-ring disabled:opacity-60 ${
          watched ? "border-brand-400 text-brand-300 bg-brand-900/30" : "border-border text-ink-muted hover:text-ink"
        }`}
      >
        <CheckCircleIcon width={18} height={18} fill={watched ? "currentColor" : "none"} />
        {watched ? "Watched" : "Mark watched"}
      </button>
      {watched && (
        <button onClick={rewatch} className="text-xs text-ink-muted hover:text-ink focus-ring rounded px-2 py-1">
          + Rewatch{rewatchCount > 1 ? ` (${rewatchCount})` : ""}
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl2 border border-border bg-bg-raised p-5 shadow-card">
            <p className="font-semibold text-sm mb-1">Mark earlier episodes too?</p>
            <p className="text-xs text-ink-muted mb-4">
              {previousUnwatchedEpisodeIds.length} earlier episode{previousUnwatchedEpisodeIds.length !== 1 ? "s" : ""} in this show{" "}
              {previousUnwatchedEpisodeIds.length !== 1 ? "aren't" : "isn't"} marked watched yet.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  markIds([episodeId]);
                }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink transition-colors focus-ring disabled:opacity-60"
              >
                Just this one
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  markIds([...previousUnwatchedEpisodeIds, episodeId]);
                }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 hover:bg-brand-600 text-white transition-colors focus-ring disabled:opacity-60"
              >
                Mark all {previousUnwatchedEpisodeIds.length + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
