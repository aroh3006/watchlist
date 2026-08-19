import { requireUserWithProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getShowProgress } from "@/lib/tracking";
import { recommendShows, recommendMovies } from "@/lib/recommendations";
import { Section, EmptyState } from "@/components/Section";
import { PosterCard, PosterRow } from "@/components/PosterCard";
import { NextEpisodeCard, type NextEpisodeCardData } from "@/components/NextEpisodeCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUserWithProfile();

  const watchingShows = await prisma.userShow.findMany({
    where: { userId: user.id, status: { in: ["WATCHING", "PLANNED"] } },
    include: { show: true },
    orderBy: { updatedAt: "desc" },
  });

  const nextEpisodes: NextEpisodeCardData[] = [];
  for (const us of watchingShows) {
    const progress = await getShowProgress(user.id, us.showId);
    if (progress.nextEpisode) {
      nextEpisodes.push({
        showId: us.showId,
        showSlug: us.show.slug,
        showTitle: us.show.title,
        episodeId: progress.nextEpisode.id,
        seasonNumber: (await prisma.season.findUnique({ where: { id: progress.nextEpisode.seasonId } }))!.seasonNumber,
        episodeNumber: progress.nextEpisode.episodeNumber,
        episodeTitle: progress.nextEpisode.title,
        imageUrl: progress.nextEpisode.imageUrl,
        runtime: progress.nextEpisode.runtime,
        watched: progress.watchedEpisodes,
        total: progress.totalEpisodes,
      });
    }
  }

  const now = new Date();
  // Dropped/Paused shows and movies are excluded from Upcoming even if they
  // have a future air date/release, since the user isn't actively following
  // them anymore. This only affects this query; the Shows/Movies library
  // filter tabs still read status directly and are unaffected.
  const upcomingEpisodes = await prisma.episode.findMany({
    where: {
      airDate: { gt: now },
      show: { userShows: { some: { userId: user.id, status: { in: ["WATCHING", "PLANNED"] } } } },
    },
    orderBy: { airDate: "asc" },
    take: 8,
    include: { season: { include: { show: true } } },
  });
  const upcomingMovies = await prisma.movie.findMany({
    where: {
      releaseDate: { gt: now },
      userMovies: { some: { userId: user.id, status: { in: ["WATCHING", "PLANNED"] } } },
    },
    orderBy: { releaseDate: "asc" },
    take: 8,
  });

  const favoriteShows = await prisma.favorite.findMany({
    where: { userId: user.id, targetType: "SHOW" },
    include: { show: true },
    take: 10,
  });

  const [recentlyAddedShows, recentlyAddedMovies] = await Promise.all([
    prisma.userShow.findMany({ where: { userId: user.id }, orderBy: { addedAt: "desc" }, take: 10, include: { show: true } }),
    prisma.userMovie.findMany({ where: { userId: user.id }, orderBy: { addedAt: "desc" }, take: 10, include: { movie: true } }),
  ]);
  const recentlyAdded = [
    ...recentlyAddedShows.map((us) => ({ ...us.show, addedAt: us.addedAt, kind: "show" as const })),
    ...recentlyAddedMovies.map((um) => ({ ...um.movie, addedAt: um.addedAt, kind: "movie" as const })),
  ]
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
    .slice(0, 10);

  const upcomingEpisodesByShow = new Map<string, { first: (typeof upcomingEpisodes)[number]; extra: number }>();
  for (const ep of upcomingEpisodes) {
    const existing = upcomingEpisodesByShow.get(ep.season.show.id);
    if (existing) existing.extra += 1;
    else upcomingEpisodesByShow.set(ep.season.show.id, { first: ep, extra: 0 });
  }
  const upcomingEpisodeGroups = Array.from(upcomingEpisodesByShow.values());

  const [recommendedShows, recommendedMovies] = await Promise.all([
    recommendShows(user.id, 10),
    recommendMovies(user.id, 10),
  ]);

  return (
    <div className="py-6 md:py-8">
      <div className="px-4 md:px-8 mb-10">
        <p className="eyebrow text-[11px] text-brand-300 mb-2">Home</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Welcome back, {user.profile.displayName ?? user.name}
        </h1>
        <p className="text-ink-muted text-sm mt-1.5">Here&apos;s what to watch next.</p>
      </div>

      <Section title="Next Episode" eyebrow="Continue watching">
        {nextEpisodes.length === 0 ? (
          <EmptyState title="Nothing queued up" body="Add a show from Discover to see your next episode here." />
        ) : (
          <PosterRow>
            {nextEpisodes.map((d) => (
              <NextEpisodeCard key={d.showId} data={d} />
            ))}
          </PosterRow>
        )}
      </Section>

      {(upcomingEpisodes.length > 0 || upcomingMovies.length > 0) && (
        <Section title="Upcoming" eyebrow="On the calendar" action={{ href: "/upcoming", label: "See calendar" }}>
          <PosterRow>
            {upcomingEpisodeGroups.map(({ first: ep, extra }) => (
              <PosterCard
                key={ep.id}
                href={`/shows/${ep.season.show.slug}`}
                title={ep.season.show.title}
                posterUrl={ep.season.show.posterUrl}
                subtitle={`S${ep.season.seasonNumber}E${ep.episodeNumber} · ${ep.airDate?.toLocaleDateString()}`}
                badge={extra > 0 ? `+${extra}` : undefined}
              />
            ))}
            {upcomingMovies.map((m) => (
              <PosterCard
                key={m.id}
                href={`/movies/${m.slug}`}
                title={m.title}
                posterUrl={m.posterUrl}
                subtitle={m.releaseDate?.toLocaleDateString()}
              />
            ))}
          </PosterRow>
        </Section>
      )}

      {favoriteShows.length > 0 && (
        <Section title="Favorites" action={{ href: "/shows?view=favorites", label: "See all" }}>
          <PosterRow>
            {favoriteShows.map(
              (f) =>
                f.show && (
                  <PosterCard key={f.id} href={`/shows/${f.show.slug}`} title={f.show.title} posterUrl={f.show.posterUrl} />
                )
            )}
          </PosterRow>
        </Section>
      )}

      <Section title="Recently Added to Watchlist" action={{ href: "/discover", label: "Discover more" }}>
        <PosterRow>
          {recentlyAdded.map((s) => (
            <PosterCard
              key={s.id}
              href={s.kind === "movie" ? `/movies/${s.slug}` : `/shows/${s.slug}`}
              title={s.title}
              posterUrl={s.posterUrl}
            />
          ))}
        </PosterRow>
      </Section>

      {recommendedShows.length > 0 && (
        <Section title="Recommended Shows For You" action={{ href: "/discover", label: "See more" }}>
          <PosterRow>
            {recommendedShows.map((s) => (
              <PosterCard key={s.id} href={`/shows/${s.slug}`} title={s.title} posterUrl={s.posterUrl} />
            ))}
          </PosterRow>
        </Section>
      )}

      {recommendedMovies.length > 0 && (
        <Section title="Recommended Movies For You" action={{ href: "/discover", label: "See more" }}>
          <PosterRow>
            {recommendedMovies.map((m) => (
              <PosterCard key={m.id} href={`/movies/${m.slug}`} title={m.title} posterUrl={m.posterUrl} />
            ))}
          </PosterRow>
        </Section>
      )}
    </div>
  );
}
