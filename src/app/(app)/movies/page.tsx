import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PosterGrid, PosterCard } from "@/components/PosterCard";
import { EmptyState } from "@/components/Section";
import { WATCH_STATUS_LABEL, type WatchStatus } from "@/lib/constants";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "COMPLETED", label: "Watched" },
  { key: "PLANNED", label: "Planned" },
  { key: "DROPPED", label: "Dropped" },
  { key: "NOT_WATCHED", label: "Not Watched" },
  { key: "favorites", label: "Favorites" },
];

export default async function MoviesPage({ searchParams }: { searchParams: { view?: string } }) {
  const user = await requireUser();
  const view = searchParams.view ?? "all";

  let movies: { id: string; slug: string; title: string; posterUrl: string | null; status?: string }[] = [];

  if (view === "favorites") {
    const favs = await prisma.favorite.findMany({ where: { userId: user.id, targetType: "MOVIE" }, include: { movie: true } });
    movies = favs.filter((f) => f.movie).map((f) => ({ ...f.movie!, status: undefined }));
  } else {
    const userMovies = await prisma.userMovie.findMany({
      where: { userId: user.id, ...(view !== "all" ? { status: view } : {}) },
      include: { movie: true },
      orderBy: { updatedAt: "desc" },
    });
    movies = userMovies.map((um) => ({ ...um.movie, status: um.status }));
  }

  return (
    <div className="py-6 md:py-8">
      <div className="px-4 md:px-8 mb-4 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">My Movies</h1>
        <Link
          href="/discover"
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-ink-muted hover:text-ink hover:border-brand-400 transition-colors focus-ring"
        >
          + Add a movie
        </Link>
      </div>
      <div className="px-4 md:px-8 mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/movies?view=${t.key}`}
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
        {movies.length === 0 ? (
          <EmptyState title="No movies here yet" body="Head to Discover to find something to watch." />
        ) : (
          <PosterGrid>
            {movies.map((m) => (
              <PosterCard
                key={m.id}
                href={`/movies/${m.slug}`}
                title={m.title}
                posterUrl={m.posterUrl}
                subtitle={m.status ? WATCH_STATUS_LABEL[m.status as WatchStatus] : undefined}
                fixedWidth={false}
              />
            ))}
          </PosterGrid>
        )}
      </div>
    </div>
  );
}
