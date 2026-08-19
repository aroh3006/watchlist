import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ShowActions } from "@/components/ShowActions";
import { BackButton } from "@/components/BackButton";
import { AddToListButton } from "@/components/AddToListButton";
import { EpisodeList, type SeasonData } from "@/components/EpisodeList";
import { PosterRow, PosterCard } from "@/components/PosterCard";
import { SafeImage } from "@/components/SafeImage";
import { Section } from "@/components/Section";
import { SHOW_STATUS_LABEL, type ShowStatus } from "@/lib/constants";

export default async function ShowDetailPage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const show = await prisma.show.findUnique({
    where: { slug: params.slug },
    include: {
      network: true,
      genres: { include: { genre: true } },
      cast: { include: { person: true, character: true }, orderBy: { billingOrder: "asc" }, take: 12 },
      seasons: { include: { episodes: { orderBy: { episodeNumber: "asc" } } }, orderBy: { seasonNumber: "asc" } },
    },
  });
  if (!show) notFound();

  const [userShow, favorite, rating, watchedEpisodes] = await Promise.all([
    prisma.userShow.findUnique({ where: { userId_showId: { userId: user.id, showId: show.id } } }),
    prisma.favorite.findFirst({ where: { userId: user.id, targetType: "SHOW", showId: show.id, movieId: null } }),
    prisma.rating.findFirst({ where: { userId: user.id, targetType: "SHOW", showId: show.id, episodeId: null, movieId: null } }),
    prisma.episodeWatch.findMany({ where: { userId: user.id, episode: { showId: show.id } }, select: { episodeId: true } }),
  ]);

  const watchedIds = new Set(watchedEpisodes.map((w) => w.episodeId));
  const seasons: SeasonData[] = show.seasons.map((s) => ({
    id: s.id,
    seasonNumber: s.seasonNumber,
    title: s.title,
    episodes: s.episodes.map((e) => ({
      id: e.id,
      episodeNumber: e.episodeNumber,
      title: e.title,
      overview: e.overview,
      runtime: e.runtime,
      airDate: e.airDate?.toISOString() ?? null,
      imageUrl: e.imageUrl,
      watched: watchedIds.has(e.id),
    })),
  }));

  const totalEpisodes = show.seasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const similarShows = await prisma.show.findMany({
    where: {
      id: { not: show.id },
      genres: { some: { genreId: { in: show.genres.map((g) => g.genreId) } } },
      externalIds: { some: { provider: "tmdb" } },
    },
    take: 8,
  });

  return (
    <div>
      <div className="relative h-56 md:h-72 w-full overflow-hidden">
        <SafeImage src={show.backdropUrl} seed={show.id} title={show.title} kind="backdrop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <BackButton className="absolute top-3 left-3 md:top-4 md:left-4" />
      </div>

      <div className="px-4 md:px-8 -mt-16 relative flex flex-col md:flex-row gap-6">
        <div className="w-32 md:w-48 shrink-0 rounded-xl2 overflow-hidden border border-border shadow-card">
          <SafeImage src={show.posterUrl} seed={show.id} title={show.title} kind="poster" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 pt-2 md:pt-16">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{show.title}</h1>
          <p className="text-sm text-ink-muted mt-1 flex flex-wrap gap-x-2 gap-y-1">
            <span>{SHOW_STATUS_LABEL[show.status as ShowStatus]}</span>
            {show.network && <span>· {show.network.name}</span>}
            {show.firstAirDate && <span>· {show.firstAirDate.getFullYear()}</span>}
            <span>· {show.seasons.length} season{show.seasons.length !== 1 ? "s" : ""}</span>
            <span>· {totalEpisodes} episodes</span>
            {show.voteAverage ? <span>· ★ {show.voteAverage.toFixed(1)}</span> : null}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {show.genres.map((g) => (
              <span key={g.genreId} className="text-xs px-2 py-0.5 rounded-full bg-bg-overlay text-ink-muted border border-border-subtle">
                {g.genre.name}
              </span>
            ))}
          </div>
          <p className="text-sm text-ink-muted mt-3 max-w-2xl">{show.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ShowActions
              showId={show.id}
              kind="show"
              initialStatus={userShow?.status}
              initialFavorited={!!favorite}
              initialRating={rating?.score}
            />
            <AddToListButton showId={show.id} />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-8">
        <h2 className="text-base font-semibold mb-3">Episodes</h2>
        <EpisodeList showSlug={show.slug} seasons={seasons} />
      </div>

      {show.cast.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <h2 className="text-base font-semibold mb-3">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {show.cast.map((c) => (
              <div key={c.id} className="shrink-0 w-24 text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-bg-overlay border border-border-subtle">
                  {c.person.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.person.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-xs font-medium mt-1.5 truncate">{c.person.name}</p>
                {c.character && <p className="text-[11px] text-ink-faint truncate">{c.character.name}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {similarShows.length > 0 && (
        <div className="mt-8">
          <Section title="Similar Shows">
            <PosterRow>
              {similarShows.map((s) => (
                <PosterCard key={s.id} href={`/shows/${s.slug}`} title={s.title} posterUrl={s.posterUrl} />
              ))}
            </PosterRow>
          </Section>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}
