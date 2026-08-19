"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CheckCircleIcon } from "./icons";

export interface NextEpisodeCardData {
  showId: string;
  showSlug: string;
  showTitle: string;
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  imageUrl?: string | null;
  runtime?: number | null;
  watched: number;
  total: number;
}

export function NextEpisodeCard({ data }: { data: NextEpisodeCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  // After marking watched, the server sends back the show's *new* next
  // episode under the same card (same showId key). Without this, "done"
  // would stay stuck true forever since useState's initial value only
  // applies on mount, permanently disabling the button after one click.
  useEffect(() => setDone(false), [data.episodeId]);

  async function markWatched(e: React.MouseEvent) {
    e.preventDefault();
    setDone(true);
    const res = await fetch(`/api/episodes/${data.episodeId}/watch`, { method: "POST" });
    if (!res.ok) {
      setDone(false);
      return;
    }
    startTransition(() => router.refresh());
  }

  const pct = data.total > 0 ? (data.watched / data.total) * 100 : 0;

  return (
    <div className="relative flex gap-3 rounded-xl2 border border-border bg-bg-raised p-3 hover:border-brand-700 transition-colors w-[300px] sm:w-[360px] shrink-0">
      <Link href={`/shows/${data.showSlug}`} className="shrink-0 focus-ring rounded-lg">
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-bg-overlay">
          {data.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/shows/${data.showSlug}`} className="focus-ring rounded">
          <p className="text-sm font-semibold text-ink truncate">{data.showTitle}</p>
        </Link>
        <p className="text-[11px] text-ink-faint mt-0.5">
          Season {data.seasonNumber} · Episode {data.episodeNumber}
        </p>
        <p className="text-xs text-ink-muted leading-snug line-clamp-2">{data.episodeTitle}</p>
        <div className="mt-1.5 h-1 rounded-full bg-bg-overlay overflow-hidden">
          <div className="h-full bg-brand-400" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-ink-faint mt-1">
          {data.watched}/{data.total} episodes {data.runtime ? `· ${data.runtime}m` : ""}
        </p>
      </div>
      <button
        onClick={markWatched}
        disabled={done || pending}
        aria-label={`Mark ${data.episodeTitle} as watched`}
        className="self-center shrink-0 flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-ink-faint hover:text-brand-500 hover:bg-brand-100 transition-colors focus-ring disabled:text-brand-500"
      >
        <CheckCircleIcon width={24} height={24} />
        <span className="text-[10px] font-medium">{done ? "Watched" : "Mark watched"}</span>
      </button>
    </div>
  );
}
