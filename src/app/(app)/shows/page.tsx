import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PosterGrid } from "@/components/PosterCard";
import { PosterCard } from "@/components/PosterCard";
import { EmptyState } from "@/components/Section";
import { WATCH_STATUS_LABEL, type WatchStatus } from "@/lib/constants";
import { getShowProgress } from "@/lib/tracking";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "WATCHING", label: "Watching" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PAUSED", label: "Paused" },
  { key: "PLANNED", label: "Planned" },
  { key: "DROPPED", label: "Dropped" },
  { key: "favorites", label: "Favorites" },
];

export default async function ShowsPage({ searchParams }: { searchParams: { view?: string } }) {
  const user = await requireUser();
  const view = searchParams.view ?? "all";

  let showsWithMeta: { id: string; slug: string; title: string; posterUrl: string | null; status?: string }[] = [];

  if (view === "favorites") {
    const favs = await prisma.favorite.findMany({ where: { userId: user.id, targetType: "SHOW" }, include: { show: true } });
    showsWithMeta = favs.filter((f) => f.show).map((f) => ({ ...f.show!, status: undefined }));
  } else {
    const userShows = await prisma.userShow.findMany({
      where: { userId: user.id, ...(view !== "all" ? { status: view } : {}) },
      include: { show: true },
      orderBy: { updatedAt: "desc" },
    });
    showsWithMeta = userShows.map((us) => ({ ...us.show, status: us.status }));
  }

  const progressMap = new Map<string, { watched: number; total: number }>();
  if (view === "all" || view === "WATCHING") {
    for (const s of showsWithMeta) {
      const p = await getShowProgress(user.id, s.id);
      progressMap.set(s.id, { watched: p.watchedEpisodes, total: p.totalEpisodes });
    }
  }

  return (
    <div className="py-6 md:py-8">
      <div className="px-4 md:px-8 mb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">My Shows</h1>
        <Link
          href="/discover"
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-ink-muted hover:text-ink hover:border-brand-400 transition-colors focus-ring"
        >
          + Add a show
        </Link>
      </div>
      <div className="px-4 md:px-8 mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/shows?view=${t.key}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors focus-ring ${
              view === t.key
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-border text-ink-muted hover:text-ink hover:border-ink-faint"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="px-4 md:px-8">
        {showsWithMeta.length === 0 ? (
          <EmptyState title="No shows here yet" body="Head to Discover to find something to watch." />
        ) : (
          <PosterGrid>
            {showsWithMeta.map((s) => {
              const p = progressMap.get(s.id);
              return (
                <PosterCard
                  key={s.id}
                  href={`/shows/${s.slug}`}
                  title={s.title}
                  posterUrl={s.posterUrl}
                  subtitle={s.status ? WATCH_STATUS_LABEL[s.status as WatchStatus] : undefined}
                  progressPct={p && p.total > 0 ? (p.watched / p.total) * 100 : undefined}
                />
              );
            })}
          </PosterGrid>
        )}
      </div>
    </div>
  );
}
