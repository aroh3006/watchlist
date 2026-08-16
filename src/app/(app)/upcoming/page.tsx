import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/Section";

function daysUntil(date: Date): string {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export default async function UpcomingPage() {
  const user = await requireUser();
  const now = new Date();

  const [episodes, movies] = await Promise.all([
    prisma.episode.findMany({
      where: { airDate: { gt: now }, show: { userShows: { some: { userId: user.id } } } },
      orderBy: { airDate: "asc" },
      include: { season: { include: { show: true } } },
      take: 60,
    }),
    prisma.movie.findMany({
      where: { releaseDate: { gt: now }, userMovies: { some: { userId: user.id } } },
      orderBy: { releaseDate: "asc" },
      take: 30,
    }),
  ]);

  type Item = { date: Date; kind: "episode" | "movie"; title: string; sub: string; href: string; posterUrl: string | null };
  const items: Item[] = [
    ...episodes
      .filter((e) => e.airDate)
      .map((e) => ({
        date: e.airDate!,
        kind: "episode" as const,
        title: e.season.show.title,
        sub: `S${e.season.seasonNumber}E${e.episodeNumber} — ${e.title}`,
        href: `/shows/${e.season.show.slug}`,
        posterUrl: e.season.show.posterUrl,
      })),
    ...movies
      .filter((m) => m.releaseDate)
      .map((m) => ({
        date: m.releaseDate!,
        kind: "movie" as const,
        title: m.title,
        sub: "Movie release",
        href: `/movies/${m.slug}`,
        posterUrl: m.posterUrl,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const grouped = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.date.toDateString();
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-1">Upcoming</h1>
      <p className="text-sm text-ink-muted mb-6">Episodes and movies coming up for shows you follow.</p>

      {items.length === 0 ? (
        <EmptyState title="Nothing scheduled" body="Follow shows or movies to see upcoming releases here." />
      ) : (
        <div className="space-y-6 max-w-2xl">
          {Array.from(grouped.entries()).map(([dateKey, group]) => (
            <div key={dateKey}>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                {new Date(dateKey).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
                {daysUntil(new Date(dateKey))}
              </p>
              <ul className="space-y-2">
                {group.map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl2 border border-border-subtle bg-bg-raised p-3 hover:border-brand-700 transition-colors focus-ring"
                    >
                      <div className="w-12 h-16 rounded-md overflow-hidden bg-bg-overlay shrink-0">
                        {item.posterUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-ink-muted truncate">{item.sub}</p>
                      </div>
                      <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-bg-overlay text-ink-muted shrink-0">
                        {item.kind === "movie" ? "Movie" : "Episode"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
