"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CheckCircleIcon } from "./icons";
import { SafeImage } from "./SafeImage";

export interface EpisodeRowData {
  id: string;
  episodeNumber: number;
  title: string;
  overview: string | null;
  runtime: number | null;
  airDate: string | null;
  imageUrl: string | null;
  watched: boolean;
}

export interface SeasonData {
  id: string;
  seasonNumber: number;
  title: string | null;
  episodes: EpisodeRowData[];
}

export function EpisodeList({ showSlug, seasons }: { showSlug: string; seasons: SeasonData[] }) {
  const [activeSeason, setActiveSeason] = useState(seasons[0]?.id);
  const router = useRouter();
  const [marking, setMarking] = useState(false);
  const [, startTransition] = useTransition();
  const season = seasons.find((s) => s.id === activeSeason) ?? seasons[0];

  async function markSeason() {
    if (!season) return;
    setMarking(true);
    await fetch(`/api/seasons/${season.id}/watch`, { method: "POST" });
    setMarking(false);
    startTransition(() => router.refresh());
  }

  if (!season) return null;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex gap-2 overflow-x-auto">
          {seasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSeason(s.id)}
              aria-pressed={s.id === activeSeason}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors focus-ring ${
                s.id === (season?.id)
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-border text-ink-muted hover:text-ink"
              }`}
            >
              {s.title ?? `Season ${s.seasonNumber}`}
            </button>
          ))}
        </div>
        <button
          onClick={markSeason}
          disabled={marking}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white transition-colors focus-ring"
        >
          <CheckCircleIcon width={14} height={14} />
          {marking ? "Marking..." : "Mark season watched"}
        </button>
      </div>

      <ul className="divide-y divide-border-subtle rounded-xl2 border border-border-subtle overflow-hidden">
        {season.episodes.map((ep) => {
          const flatEpisodes = seasons.flatMap((s) => s.episodes);
          const flatIndex = flatEpisodes.findIndex((e) => e.id === ep.id);
          const previousUnwatchedIds = flatEpisodes.slice(0, flatIndex).filter((e) => !e.watched).map((e) => e.id);
          return <EpisodeRow key={ep.id} showSlug={showSlug} ep={ep} previousUnwatchedIds={previousUnwatchedIds} />;
        })}
      </ul>
    </div>
  );
}

function EpisodeRow({
  showSlug,
  ep,
  previousUnwatchedIds,
}: {
  showSlug: string;
  ep: EpisodeRowData;
  previousUnwatchedIds: string[];
}) {
  const router = useRouter();
  const [watched, setWatched] = useState(ep.watched);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  // ep.watched comes from a fresh server render (e.g. after "mark season
  // watched"); useState's initial value only applies on mount, so without
  // this the row's own checkbox silently stays stale after a bulk action.
  useEffect(() => setWatched(ep.watched), [ep.watched]);

  async function markIds(ids: string[]) {
    setWatched(true);
    startTransition(async () => {
      await Promise.all(ids.map((id) => fetch(`/api/episodes/${id}/watch`, { method: "POST" })));
      router.refresh();
    });
  }

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    if (watched) {
      setWatched(false);
      await fetch(`/api/episodes/${ep.id}/watch`, { method: "DELETE" });
      startTransition(() => router.refresh());
      return;
    }
    if (previousUnwatchedIds.length > 0) {
      setShowConfirm(true);
      return;
    }
    await markIds([ep.id]);
  }

  return (
    <li className="relative flex gap-3 p-3 hover:bg-bg-overlay/60 transition-colors items-center">
      <Link href={`/shows/${showSlug}/episodes/${ep.id}`} className="flex gap-3 flex-1 min-w-0 focus-ring rounded-lg">
        <div className="w-20 h-12 rounded-md overflow-hidden bg-bg-overlay shrink-0">
          <SafeImage src={ep.imageUrl} seed={ep.id} title={ep.title} kind="backdrop" loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink truncate">
            {ep.episodeNumber}. {ep.title}
          </p>
          <p className="text-xs text-ink-muted truncate">
            {ep.airDate ? new Date(ep.airDate).toLocaleDateString() : "TBA"}
            {ep.runtime ? ` · ${ep.runtime}m` : ""}
          </p>
        </div>
      </Link>
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={watched}
        aria-label={watched ? `Mark episode ${ep.episodeNumber} unwatched` : `Mark episode ${ep.episodeNumber} watched`}
        className={`shrink-0 rounded-full p-1 transition-colors focus-ring ${watched ? "text-brand-400" : "text-ink-faint hover:text-ink"}`}
      >
        <CheckCircleIcon width={24} height={24} fill={watched ? "currentColor" : "none"} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl2 border border-border bg-bg-raised p-5 shadow-card">
            <p className="font-semibold text-sm mb-1">Mark earlier episodes too?</p>
            <p className="text-xs text-ink-muted mb-4">
              {previousUnwatchedIds.length} earlier episode{previousUnwatchedIds.length !== 1 ? "s" : ""} in this show{" "}
              {previousUnwatchedIds.length !== 1 ? "aren't" : "isn't"} marked watched yet.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  markIds([ep.id]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink transition-colors focus-ring"
              >
                Just this one
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  markIds([...previousUnwatchedIds, ep.id]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 hover:bg-brand-600 text-white transition-colors focus-ring"
              >
                Mark all {previousUnwatchedIds.length + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
